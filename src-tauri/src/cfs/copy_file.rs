use std::{
    path::Path,
    sync::{Arc, Condvar, Mutex},
    thread,
};
use tauri::{Runtime, State, Window};

use super::{
    types::{CopyCutProgress, ErrorMessage},
    CFSState,
};

#[derive(serde::Deserialize)]
pub struct CopyOptions {
    pub overwrite: bool,
    pub skip_exist: bool,
}

#[derive(serde::Deserialize, PartialEq, Clone, Copy, Debug)]
#[serde(rename_all = "camelCase")]
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
    path_from: String,
    path_to: String,
    options: &CopyOptions,
    event_id: usize,
    pair: Arc<(Mutex<CopyActions>, Condvar)>,
) {
    let copy_options = fs_extra::file::CopyOptions::new()
        .overwrite(options.overwrite)
        .skip_exist(options.skip_exist);

    thread::spawn(move || {
        let progress_event_name = format!("copy-progress//{}", event_id);
        let finish_event_name = format!("copy-progress//{}", event_id);
        // let start_event_name = format!("copy-started//{}", event_id);

        // window
        //     .emit(&start_event_name, event_id)
        //     .unwrap();

        let result =
            fs_extra::file::copy_with_progress(path_from, path_to, &copy_options, |progress| {
                let &(ref lock, ref cvar) = &*pair;
                let mut state = lock.lock().unwrap();

                window
                    .emit(
                        &progress_event_name,
                        CopyCutProgress {
                            done: progress.copied_bytes as usize,
                            total: progress.total_bytes as usize,
                        },
                    )
                    .unwrap();

                match *state {
                    CopyActions::Run => {}
                    CopyActions::Pause => {
                        println!("paused before while");

                        while *state == CopyActions::Pause {
                            println!("paused in while");
                            state = cvar.wait(state).unwrap();
                        }
                    }
                    CopyActions::Exit => {
                        println!("exit");

                        window.emit(&finish_event_name, -2).unwrap();

                        todo!("Terminate thread here");
                    }
                }
            });

        match result {
            Ok(res) => {
                window.emit(&finish_event_name, res).unwrap();
            }
            Err(error) => {
                window
                    .emit(
                        &finish_event_name,
                        ErrorMessage::new_all(
                            "Error while copying files".into(),
                            error.to_string(),
                        ),
                    )
                    .unwrap();
            }
        }
    });
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

    let pair = Arc::new((Mutex::new(CopyActions::Pause), Condvar::new()));
    let pair_clone = pair.clone();

    let listener_id = window.listen(format!("copy-change-state//{}", event_id), move |e| {
        let payload = e.payload();

        let &(ref lock, ref cvar) = &*pair;
        let mut state = lock.lock().unwrap();

        if let Some(payload) = payload {
            let parsed_value = CopyActions::from_window_event_payload(payload);

            if let Ok(parsed) = parsed_value {
                *state = parsed;
                cvar.notify_one();
            }
        }
    });

    spawn_copy_thread(
        window.clone(),
        from.clone(),
        to.clone(),
        &copy_options,
        event_id,
        pair_clone,
    );

    state
        .copy_processes
        .lock()
        .unwrap()
        .insert(event_id, listener_id);

    Ok(())
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
