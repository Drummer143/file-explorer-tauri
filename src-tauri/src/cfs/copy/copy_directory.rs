use std::{
    fs,
    path::Path,
    sync::{Arc, Condvar, Mutex},
};
use tauri::{Runtime, State, Window};

use crate::cfs::{
    add_index_to_filename,
    get_file_size::get_file_size,
    get_file_type,
    types::{CopyActions, CopyResult, ErrorMessage, FileType},
    CFSState,
};

use super::utils::{DuplicateFileAction, DuplicateFileHandleEventPayload};

type ControlVars = Arc<(Mutex<CopyActions>, Condvar)>;

#[derive(serde::Serialize, Clone)]
struct ExistingEntryInfo {
    path: String,
    filename: String,
    r#type: FileType,
    path_to_new_dirname: String,
}

fn check_lock_thread(control_vars: ControlVars) -> bool {
    let &(ref lock, ref cvar) = &*control_vars.clone();
    let mut state = lock.lock().unwrap();

    while *state == CopyActions::Pause {
        state = cvar.wait(state).unwrap();
    }

    if *state == CopyActions::Exit {
        true
    } else {
        false
    }
}

fn mount_duplicate_file_listener<R: Runtime>(
    window: &tauri::Window<R>,
    event_id: usize,
    duplicate_file_action: Arc<Mutex<(DuplicateFileAction, bool)>>,
    control_vars: ControlVars,
) {
    window.once(&format!("copy-handle-duplicate//{}", event_id), move |e| {
        let payload_str = e.payload().unwrap();

        println!("{}", payload_str);

        let payload = serde_json::from_str::<DuplicateFileHandleEventPayload>(payload_str);

        println!("is_err {}, is_ok {}", payload.is_err(), payload.is_ok());

        if let Ok(payload) = payload {
            println!("{:#?}", payload);

            let (ref mut action, ref mut do_for_all) = &mut *duplicate_file_action.lock().unwrap();

            println!("after unlock");

            *action = payload.action;
            *do_for_all = payload.do_for_all;

            println!("{:#?}", action);
        } else {
            println!("can't parse payload: {:#?}", payload_str);
        }

        let &(ref lock, ref cvar) = &*control_vars;
        let mut state = lock.lock().unwrap();

        *state = CopyActions::Run;
        cvar.notify_all();
    });
}

fn emit_duplicate_file<R: Runtime>(
    window: &tauri::Window<R>,
    event_id: usize,
    filename: String,
    path: String,
    r#type: FileType,
    path_to_new_dirname: String,
    control_vars: ControlVars,
) -> bool {
    let _ = window.emit(
        &format!("copy-error//{}", event_id),
        ExistingEntryInfo {
            filename,
            path,
            r#type,
            path_to_new_dirname,
        },
    );

    {
        let &(ref lock, _) = &*control_vars;
        let mut state = lock.lock().unwrap();

        *state = CopyActions::Pause;
    }

    check_lock_thread(control_vars)
}

fn prepare_to_copy_folder<R: Runtime>(
    window: &tauri::Window<R>,
    event_id: usize,
    from: &str,
    to: &str,
) -> Result<(usize, fs::ReadDir), ErrorMessage> {
    let path_from = Path::new(from);
    let total_size = get_file_size(from);
    let root_dir_entry = path_from.read_dir();

    if let Err(error) = root_dir_entry {
        return Err(ErrorMessage::new_all(
            "Can't read directory",
            &error.to_string(),
        ));
    }

    let _ = window.emit(&format!("copy-ready//{}", event_id), ());

    let path_to = Path::new(to);

    if !path_to.exists() {
        if let Err(error) = fs::create_dir(path_to) {
            return Err(ErrorMessage::new_all(
                "can't create root folder",
                &error.to_string(),
            ));
        }
    }

    let dir_entry = path_from.read_dir();

    if let Err(ref error) = dir_entry {
        return Err(ErrorMessage::new_all(
            "can't read folder",
            &error.to_string(),
        ));
    }

    let dir_entry = dir_entry.unwrap();

    Ok((total_size, dir_entry))
}

fn copy_directory_with_progress<R: tauri::Runtime>(
    window: &tauri::Window<R>,
    from: &str,
    to: &str,
    event_id: usize,
    buffer_size: usize,
    copy_speed: usize,
    control_vars: ControlVars,
    duplicate_file_action: DuplicateFileAction,
) -> CopyResult {
    if check_lock_thread(control_vars.clone()) {
        let _ = window.emit(&format!("copy-finished//{}", event_id), ());

        return CopyResult::Stop;
    }

    let result = prepare_to_copy_folder(&window, event_id, from, to);

    if let Err(error) = result {
        return CopyResult::Error(error);
    }

    let (total_size, dir_entry) = result.unwrap();
    let mut dirs_queue = vec![(dir_entry, String::from(to))];
    let mut total_bytes_copied = 0;
    let duplicate_file_action = Arc::new(Mutex::new((duplicate_file_action, false)));

    while !dirs_queue.is_empty() {
        let (dir_entry, path_to) = dirs_queue.remove(0);

        for entry in dir_entry {
            if let Err(error) = entry {
                println!("{}", error.to_string());
                continue;
            }

            let entry = entry.unwrap();
            let metadata = entry.metadata();

            if let Err(error) = metadata {
                println!("error on metadata: {}", error.to_string());
                continue;
            }

            let metadata = metadata.unwrap();
            let mut path_to_new_entry = Path::new(&path_to).join(entry.file_name());
            let path_to_new_entry_str = path_to_new_entry.clone();
            let mut path_to_new_entry_str = String::from(path_to_new_entry_str.to_str().unwrap());
            let path_to_entry = entry.path();

            if path_to_new_entry.exists() && metadata.is_file() {
                if !duplicate_file_action.lock().unwrap().1 {
                    mount_duplicate_file_listener(
                        &window,
                        event_id,
                        duplicate_file_action.clone(),
                        control_vars.clone(),
                    );

                    let should_break = emit_duplicate_file(
                        &window,
                        event_id,
                        entry.file_name().to_str().unwrap().into(),
                        path_to_entry.to_str().unwrap().into(),
                        get_file_type(path_to_entry.to_str().unwrap()),
                        path_to.clone(),
                        control_vars.clone(),
                    );

                    println!("{}", should_break);

                    if should_break {
                        break;
                    }
                }

                println!("{:#?}", duplicate_file_action.lock().unwrap().0);

                match duplicate_file_action.lock().unwrap().0 {
                    DuplicateFileAction::Overwrite => {
                        let _ = fs::remove_file(&path_to_new_entry_str); // FIXME:
                    }
                    DuplicateFileAction::SaveBoth => {
                        let new_filename = add_index_to_filename(&path_to_new_entry_str);

                        if new_filename.is_err() {
                            continue; // FIXME:
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

            if check_lock_thread(control_vars.clone()) {
                break;
            }

            if metadata.is_dir() {
                if let Err(error) = fs::create_dir(path_to_new_entry.clone()) {
                    println!("{}", error.to_string());
                } else if let Ok(dir) = path_to_entry.read_dir() {
                    dirs_queue.push((dir, path_to_new_entry_str));
                }

                continue;
            }

            let result = super::copy_file::copy_file_with_progress(
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
    }

    let _ = window.emit(&format!("copy-finished//{}", event_id), ());

    CopyResult::Ok
}

#[tauri::command(async)]
pub fn copy_directory<R: Runtime>(
    window: Window<R>,
    state: State<'_, CFSState>,
    from: String,
    mut to: String,
    event_id: usize,
    remove_target_on_finish: bool,
    duplicate_file_action: DuplicateFileAction,
) -> Result<(), ErrorMessage> {
    let path_to = Path::new(&to);

    let control_vars = Arc::new((Mutex::new(CopyActions::Pause), Condvar::new()));
    let control_vars_clone = control_vars.clone();

    let copy_state_change_listener = window.listen(&format!("copy-change-state//{}", event_id), move |e| {
        let payload = e.payload();

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

    if duplicate_file_action == DuplicateFileAction::Ask && path_to.exists() {
        let (duplicate_file_action, _) =
            super::utils::emit_duplicate_file(&to, &from, &window, false);

        match duplicate_file_action {
            DuplicateFileAction::Ask => {}
            DuplicateFileAction::Merge => {}
            DuplicateFileAction::SaveBoth => {
                let result = add_index_to_filename(&to);

                match result {
                    Ok(new_to) => to = new_to,
                    Err(error) => return Err(error),
                }
            }
            DuplicateFileAction::Overwrite => {
                if let Err(error) = fs::remove_dir_all(&to) {
                    return Err(ErrorMessage::new_all(
                        "Can't remove root directory",
                        &error.to_string(),
                    ));
                }
            }
            DuplicateFileAction::Skip => {
                let _ = window.emit(&format!("copy-finished//{}", event_id), ());

                return Ok(());
            }
        }
    }

    let copy_speed = state
        .app_config
        .filesystem
        .copy_speed_limit_bytes_per_second;
    let buffer_size = state.app_config.filesystem.copy_buffer_size_bytes;

    let result = copy_directory_with_progress(
        &window,
        &from,
        &to,
        event_id,
        buffer_size,
        copy_speed,
        control_vars_clone,
        duplicate_file_action,
    );

    window.unlisten(copy_state_change_listener);

    match result {
        CopyResult::Error(error) => Err(error),
        CopyResult::Ok => {
            if remove_target_on_finish {
                if let Err(error) = fs::remove_dir_all(from) {
                    return Err(ErrorMessage::new_all(
                        "Can't delete target folder",
                        &error.to_string(),
                    ));
                }
            }

            Ok(())
        }
        CopyResult::Stop => Ok(()),
    }
}
