use std::{
    fs::{self, File},
    io::{Read, Write},
    path::Path,
    sync::{Arc, Condvar, Mutex},
    thread,
    time::{Duration, Instant},
};
use tauri::{Runtime, State, Window};

use super::{
    get_file_size::get_file_size,
    types::{CopyActions, CopyCutProgress, CopyResult, ErrorMessage},
    CFSState,
};

#[derive(serde::Deserialize)]
pub struct DirectoryCopyOptions {
    pub overwrite: bool,
    pub skip_exist: bool,
    pub remove_target_on_finish: bool,
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
    let dir_size = get_file_size(Path::new(from));

    match dir_size {
        Ok(dir_size) => {
            println!("{}", dir_size);

            CopyResult::Ok
        }
        Err(error) => CopyResult::Error(error),
    }
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
            CopyResult::Stop => println!("stopped by user")
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
