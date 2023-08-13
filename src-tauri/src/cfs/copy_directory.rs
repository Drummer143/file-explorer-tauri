use std::{
    fs,
    path::Path,
    sync::{Arc, Condvar, Mutex},
    thread,
};
use tauri::{Runtime, State, Window};

use crate::cfs::{generate_duplicated_filename, get_file_type};

use super::{
    get_file_size::get_file_size,
    types::{CopyActions, CopyResult, ErrorMessage, FileTypes},
    CFSState,
};

#[derive(serde::Deserialize, Clone)]
pub enum DuplicateFileAction {
    Overwrite,
    SaveBoth,
    Skip,
    Ask,
}

impl DuplicateFileAction {
    pub fn from_window_event_payload(s: &str) -> Result<Self, ()> {
        let lowercased: &str = &s.to_ascii_lowercase();

        match lowercased {
            "\"overwrite\"" => Ok(DuplicateFileAction::Overwrite),
            "\"saveboth\"" => Ok(DuplicateFileAction::SaveBoth),
            "\"skip\"" => Ok(DuplicateFileAction::Skip),
            "\"ask\"" => Ok(DuplicateFileAction::Ask),
            _ => Err(()),
        }
    }
}

type ControlVars = Arc<(Mutex<CopyActions>, Condvar)>;

#[derive(serde::Deserialize)]
pub struct DirectoryCopyOptions {
    pub overwrite: bool,
    pub skip_exist: bool,
    pub remove_target_on_finish: bool,
    pub duplicate_file_action: DuplicateFileAction,
}

#[derive(serde::Serialize, Clone)]
struct ExistingEntryInfo {
    path: String,
    filename: String,
    r#type: FileTypes,
    path_to_new_dirname: String,
}

fn copy_directory_with_progress<R: tauri::Runtime>(
    window: &tauri::Window<R>,
    from: &str,
    to: &str,
    event_id: usize,
    buffer_size: usize,
    copy_speed: u64,
    control_vars: ControlVars,
    duplicate_file_action: DuplicateFileAction,
) -> CopyResult {
    let path_from = Path::new(from);
    let total_size = get_file_size(path_from);

    if let Err(error) = total_size {
        return CopyResult::Error(error);
    }

    let total_size = total_size.unwrap();
    let root_dir_entry = path_from.read_dir();

    if let Err(error) = root_dir_entry {
        return CopyResult::Error(ErrorMessage::new_all(
            "Can't read directory".into(),
            error.to_string(),
        ));
    }

    let _ = window.emit(&format!("copy-ready//{}", event_id), ());

    let path_to = Path::new(to);
    let mut total_bytes_copied = 0;

    if let Err(error) = fs::create_dir(path_to) {
        println!("{}", error.to_string());
        // return CopyResult::Error(ErrorMessage::new_all(
        //     "can't create root folder".into(),
        //     error.to_string(),
        // ));
    }

    let dir_entry = path_from.read_dir();

    if let Err(ref error) = dir_entry {
        println!("{}", error.to_string());
    }

    let dir_entry = dir_entry.unwrap();
    let error_event_name = format!("copy-error//{}", event_id);

    let mut dirs_queue = vec![(dir_entry, String::from(to))];

    while !dirs_queue.is_empty() {
        let (dir_entry, path_to) = dirs_queue.remove(0);
        let &(ref lock, ref cvar) = &*control_vars;

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

            let mut path_to_new_entry = Path::new(&path_to).join(entry.file_name());
            let path_to_new_entry_str = path_to_new_entry.clone();
            let mut path_to_new_entry_str = String::from(path_to_new_entry_str.to_str().unwrap());
            let path_to_entry = entry.path();

            if path_to_new_entry.exists() {
                let _ = window.emit(
                    &error_event_name,
                    ExistingEntryInfo {
                        filename: entry.file_name().to_str().unwrap().into(),
                        path: path_to_entry.to_str().unwrap().into(),
                        r#type: get_file_type(&path_to_entry),
                        path_to_new_dirname: path_to.clone(),
                    },
                );

                {
                    let mut state = lock.lock().unwrap();
                    *state = CopyActions::Pause;
                }

                let action_arc = Arc::new(Mutex::new(duplicate_file_action.clone()));
                let action_arc_clone = action_arc.clone();
                let ctrl_vars_clone = control_vars.clone();

                window.once(format!("copy-handle-duplicate//{}", event_id), move |e| {
                    let payload = e.payload().unwrap();

                    if let Ok(action) = DuplicateFileAction::from_window_event_payload(payload) {
                        let mut action_arc_clone = action_arc_clone.lock().unwrap();

                        *action_arc_clone = action;

                        let &(ref lock, ref cvar) = &*ctrl_vars_clone;
                        let mut state = lock.lock().unwrap();

                        println!("got event");
                        *state = CopyActions::Run;
                        cvar.notify_one();
                    }
                });

                println!("waiting");

                let mut state = lock.lock().unwrap();
                while *state == CopyActions::Pause {
                    state = cvar.wait(state).unwrap();
                }

                let current_action = action_arc.lock().unwrap();

                match *current_action {
                    DuplicateFileAction::Overwrite => {
                        let _ = fs::remove_file(&path_to_new_entry_str);
                    }
                    DuplicateFileAction::SaveBoth => {
                        let new_filename =
                            generate_duplicated_filename(path_to_new_entry_str.into());

                        if new_filename.is_err() {
                            continue;
                        }

                        let new_filename = new_filename.unwrap();
                        path_to_new_entry = Path::new(&path_to).join(new_filename);

                        let path_clone = path_to_entry.clone();
                        path_to_new_entry_str = path_clone.to_str().unwrap().into();
                    }
                    DuplicateFileAction::Skip => continue,
                    _ => {}
                };
            }

            {
                let mut state = lock.lock().unwrap();

                while *state == CopyActions::Pause {
                    state = cvar.wait(state).unwrap();
                }

                if *state == CopyActions::Exit {
                    break;
                }
            }

            if metadata.is_dir() {
                if let Err(error) = fs::create_dir(path_to_new_entry.clone()) {
                    println!("{}", error.to_string());
                } else if let Ok(dir) = path_to_entry.read_dir() {
                    dirs_queue.push((dir, path_to_new_entry_str));
                }

                continue;
            }

            let result = super::copy_file_with_progress(
                window,
                path_to_entry.to_str().unwrap(),
                path_to_new_entry.to_str().unwrap(),
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

        println!("{:#?}", dirs_queue);
    }

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
    control_vars: ControlVars,
    remove_target_on_finish: bool,
    duplicate_file_action: DuplicateFileAction,
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
            duplicate_file_action,
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

        println!("changing state");

        let &(ref lock, ref cvar) = &*control_vars;
        let mut state = lock.lock().unwrap();

        if let Some(payload) = payload {
            let parsed_value = CopyActions::from_window_event_payload(payload);

            if let Ok(parsed) = parsed_value {
                *state = parsed;
                cvar.notify_all();
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
        copy_options.duplicate_file_action,
    )
}
