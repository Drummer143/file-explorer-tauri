use std::{
    path::Path,
    sync::{Arc, Condvar, Mutex},
    thread,
};
use tauri::{Runtime, State, Window};

use super::copy_file_with_progress::{copy_file_with_progress, CopyResult};
use super::types::ErrorMessage;
use super::CFSState;

#[derive(serde::Deserialize)]
pub struct CopyOptions {
    pub overwrite: bool,
    pub skip_exist: bool,
    pub remove_target_on_finish: bool,
}

#[derive(PartialEq, Clone, Copy, Debug)]
pub enum CopyActions {
    Pause,
    Exit,
    Run,
}

impl CopyActions {
    fn from_window_event_payload(s: &str) -> Result<Self, ()> {
        let lowercased: &str = &s.to_ascii_lowercase();

        match lowercased {
            "\"exit\"" => Ok(CopyActions::Exit),
            "\"pause\"" => Ok(CopyActions::Pause),
            "\"run\"" => Ok(CopyActions::Run),
            _ => Err(()),
        }
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
    let finish_event_name = format!("copy-finished//{}", event_id);

    thread::spawn(move || {
        let result = copy_file_with_progress(
            &window,
            &from,
            &to,
            event_id,
            buffer_size,
            copy_speed,
            control_vars,
        );

        if result != CopyResult::Ok || !remove_target_on_finish {
            let payload = if let CopyResult::Error(error) = result {
                Some(error)
            } else {
                None
            };

            window
                .emit(&finish_event_name, payload)
                .expect("Can't send message to window");

            return;
        }

        let remove_file_payload = if let Err(error) = crate::raw_fs::remove(from) {
            Some(error)
        } else {
            None
        };

        if remove_file_payload.is_none() {
            println!("error while deleting after copy");
        } else {
            println!("removed after copy successfully");
        }

        window
            .emit(&finish_event_name, remove_file_payload)
            .expect("Can't send message to window");
    });

    Ok(())
}

#[tauri::command(async)]
pub fn copy_file<R: Runtime>(
    // app: AppHandle<R>,
    window: Window<R>,
    state: State<'_, CFSState>,
    from: String,
    to: String,
    event_id: usize,
    copy_options: CopyOptions,
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
            result = std::fs::remove_file(path_to);
        } else {
            result = std::fs::remove_dir_all(path_to);
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

#[tauri::command(async)]
pub fn remove_copy_process_from_state<R: Runtime>(
    state: State<'_, CFSState>,
    window: Window<R>,
    id: usize,
) {
    let state = state.copy_processes.lock();

    if let Ok(mut state) = state {
        let id = state.remove(&id);

        if let Some(id) = id {
            window.unlisten(id);
        }
    }
}
