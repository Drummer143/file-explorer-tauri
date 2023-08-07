use std::{
    fs,
    path::Path,
    sync::{Arc, Condvar, Mutex},
    thread,
};
use tauri::{Runtime, State, Window};

use super::{
    get_file_size::get_file_size,
    types::{CopyActions, CopyResult, ErrorMessage},
    CFSState,
};

#[derive(serde::Deserialize)]
pub enum DuplicateFileAction {
    Overwrite,
    SaveBoth,
    Skip,
    Ask,
}

#[derive(serde::Deserialize)]
pub struct DirectoryCopyOptions {
    pub overwrite: bool,
    pub skip_exist: bool,
    pub remove_target_on_finish: bool,
    pub duplicate_file_action: DuplicateFileAction,
}

fn copy_directory_recursion<R: Runtime>(
    window: &tauri::Window<R>,
    event_id: usize,
    path_from: &Path,
    path_to: &Path,
    buffer_size: usize,
    copy_speed: u64,
    control_vars: Arc<(Mutex<CopyActions>, Condvar)>,
    mut total_bytes_copied: usize,
    total_size: u64,
) -> usize {
    let mkdir_result = fs::create_dir(path_to);

    if let Err(error) = mkdir_result {
        println!("{}", error.to_string());
        return total_bytes_copied;
    }

    let dir_entry = path_from.read_dir();

    if let Err(ref error) = dir_entry {
        println!("{}", error.to_string());
    }

    let dir_entry = dir_entry.unwrap();
    let error_event_name = format!("copy-error//{}", event_id);

    for entry in dir_entry {
        if let Err(error) = entry {
            println!("{}", error.to_string());
            continue;
        }

        let entry = entry.unwrap();
        let metadata = entry.metadata();

        if let Err(error) = metadata {
            println!("{}", error.to_string());
            continue;
        }

        let metadata = metadata.unwrap();

        let to = path_to.join(entry.file_name());
        let entry_path = entry.path();

        if metadata.is_dir() {
            total_bytes_copied = copy_directory_recursion(
                window,
                event_id,
                &entry_path,
                &to,
                buffer_size,
                copy_speed,
                control_vars.clone(),
                total_bytes_copied,
                total_size,
            );
            continue;
        }

        let from_str = entry_path.to_str().unwrap();
        let to_str = to.to_str().unwrap();

        if to.exists() {
            let _ = window.emit(&error_event_name, to_str);

            let &(ref lock, ref cvar) = &*control_vars;
            let mut state = lock.lock().unwrap();

            *state = CopyActions::Pause;

            while *state == CopyActions::Pause {
                state = cvar.wait(state).unwrap();
            }

            if *state == CopyActions::Exit {
                todo!();
            }
        }

        let result = super::copy_file_with_progress(
            window,
            from_str,
            to_str,
            event_id,
            buffer_size,
            copy_speed,
            control_vars.clone(),
            total_bytes_copied,
            Some(total_size),
        );

        if let CopyResult::Error(error) = result {
            println!(
                "error: {}\nmessage: {}",
                error.error.unwrap_or_default(),
                error.message.unwrap_or_default()
            );
        } else {
            total_bytes_copied += entry.metadata().unwrap().len() as usize;
        }
    }

    total_bytes_copied
}

fn copy_directory_with_progress<R: tauri::Runtime>(
    window: &tauri::Window<R>,
    from: &str,
    to: &str,
    event_id: usize,
    buffer_size: usize,
    copy_speed: u64,
    control_vars: Arc<(Mutex<CopyActions>, Condvar)>,
) -> CopyResult {
    let path_from = Path::new(from);
    let dir_size = get_file_size(path_from);

    if let Err(error) = dir_size {
        return CopyResult::Error(error);
    }

    let dir_size = dir_size.unwrap();
    let root_dir_entry = path_from.read_dir();

    if let Err(error) = root_dir_entry {
        return CopyResult::Error(ErrorMessage::new_all(
            "Can't read directory".into(),
            error.to_string(),
        ));
    }

    let _ = window.emit(&format!("copy-ready//{}", event_id), ());

    copy_directory_recursion(
        window,
        event_id,
        path_from,
        Path::new(to),
        buffer_size,
        copy_speed,
        control_vars,
        0,
        dir_size,
    );

    let _ = window.emit(&format!("copy-finished//{}", event_id), ());

    CopyResult::Ok
}

fn spawn_copy_thread<R: Runtime>(
    window: Window<R>,
    copy_speed: u64,
    buffer_size: usize,
    from: String,
    to: String,
    event_id: usize,
    control_vars: Arc<(Mutex<CopyActions>, Condvar)>,
    remove_target_on_finish: bool,
) -> Result<(), ErrorMessage> {
    thread::spawn(move || {
        let result = copy_directory_with_progress(
            &window,
            &from,
            &to,
            event_id,
            buffer_size,
            copy_speed,
            control_vars,
        );

        match result {
            CopyResult::Error(error) => println!("error: {:#?}", error),
            CopyResult::Ok => println!("finished successfully"),
            CopyResult::Stop => println!("stopped by user"),
        }

        if remove_target_on_finish {
            if let Err(error) = fs::remove_dir_all(from) {
                println!("{}", error.to_string());
            }
        }
    });

    Ok(())
}

#[tauri::command(async)]
pub fn copy_directory<R: Runtime>(
    // app: AppHandle<R>,
    window: Window<R>,
    state: State<'_, CFSState>,
    from: String,
    to: String,
    event_id: usize,
    copy_options: DirectoryCopyOptions,
) -> Result<(), ErrorMessage> {
    // let path_from = Path::new(&from);
    let path_to = Path::new(&to);

    let control_vars = Arc::new((Mutex::new(CopyActions::Pause), Condvar::new()));
    let control_vars_clone = control_vars.clone();

    let listener_id = window.listen(format!("copy-change-state//{}", event_id), move |e| {
        let payload = e.payload();

        let &(ref lock, ref cvar) = &*control_vars;
        let mut state = lock.lock().unwrap();

        if let Some(payload) = payload {
            let parsed_value = CopyActions::from_window_event_payload(payload);

            if let Ok(parsed) = parsed_value {
                *state = parsed;
                cvar.notify_one();
            }
        }
    });

    if copy_options.overwrite && path_to.exists() {
        let result: Result<(), std::io::Error>;

        if path_to.is_file() {
            result = fs::remove_file(path_to);
        } else {
            result = fs::remove_dir_all(path_to);
        }

        if let Err(error) = result {
            return Err(ErrorMessage::new_all(
                "Can't overwrite file".into(),
                error.to_string(),
            ));
        }
    }

    let copy_speed = state
        .app_config
        .filesystem
        .copy_speed_limit_bytes_per_second;
    let buffer_size = state.app_config.filesystem.copy_buffer_size_bytes;

    state
        .copy_processes
        .lock()
        .unwrap()
        .insert(event_id, listener_id);

    spawn_copy_thread(
        window.clone(),
        copy_speed as u64,
        buffer_size,
        from.clone(),
        to.clone(),
        event_id,
        control_vars_clone,
        copy_options.remove_target_on_finish,
    )
}
