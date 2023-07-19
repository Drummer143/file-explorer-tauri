use std::io::Error;
use std::time::{Duration, Instant};
use std::{
    fs::File,
    io::{Read, Write},
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
    pub remove_target_on_finish: bool,
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
    copy_speed: u64,
    buffer_size: usize,
    path_from: String,
    path_to: String,
    event_id: usize,
    pair: Arc<(Mutex<CopyActions>, Condvar)>,
    remove_target_on_finish: bool,
) -> Result<(), ErrorMessage> {
    let file_from = File::open(&path_from);

    if let Err(error) = file_from {
        return Err(ErrorMessage::new_all(
            "Can't open target file".into(),
            error.to_string(),
        ));
    }

    let mut file_from = file_from.unwrap();
    let file_to = File::create(path_to);

    if let Err(error) = file_to {
        return Err(ErrorMessage::new_all(
            "Can't create file file".into(),
            error.to_string(),
        ));
    }

    let mut file_to = file_to.unwrap();
    let progress_event_name = format!("copy-progress//{}", event_id);
    let finish_event_name = format!("copy-finished//{}", event_id);
    let file_size = file_from.metadata().unwrap().len();
    let mut total_bytes_copied = 0;
    let mut buffer = vec![0; buffer_size];
    let start_time = Instant::now();

    thread::spawn(move || {
        let result: Option<Error> = loop {
            let &(ref lock, ref cvar) = &*pair;
            let mut state = lock.lock().unwrap();

            match *state {
                CopyActions::Run => {
                    window
                        .emit(
                            &progress_event_name,
                            CopyCutProgress {
                                done: total_bytes_copied as usize,
                                total: file_size as usize,
                            },
                        )
                        .unwrap();
                }
                CopyActions::Pause => {
                    while *state == CopyActions::Pause {
                        state = cvar.wait(state).unwrap();
                    }
                }
                CopyActions::Exit => {
                    window.emit(&finish_event_name, -2).unwrap();

                    break None;
                }
            }

            let bytes_read = file_from.read(&mut buffer);

            if let Err(error) = bytes_read {
                break Some(error);
            }

            let bytes_read = bytes_read.unwrap();

            if bytes_read == 0 {
                // Достигнут конец файла
                break None;
            }

            let result = file_to.write_all(&buffer[..bytes_read]);

            if let Err(error) = result {
                break Some(error);
            }

            total_bytes_copied += bytes_read;

            let elapsed_time = start_time.elapsed();
            let elapsed_seconds = elapsed_time.as_secs();
            let elapsed_bytes = total_bytes_copied;
            let expected_bytes = copy_speed * elapsed_seconds;

            if elapsed_bytes > (expected_bytes as usize) {
                let sleep_duration = Duration::from_secs(1);
                thread::sleep(sleep_duration);
            }
        };

        if let Some(error) = result {
            let message =
                ErrorMessage::new_all("Error while copying files".into(), error.to_string());

            window.emit(&finish_event_name, message).unwrap();

            println!("error while copying");

            return;
        }

        println!("copied successfully");

        if !remove_target_on_finish {
            return;
        }

        if let Err(error) = crate::raw_fs::remove(path_from) {
            window.emit(&finish_event_name, error).unwrap();

            println!("error while deleting after copy");
        } else {
            window.emit(&finish_event_name, ()).unwrap();

            println!("removed after copy successfully");
        }
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
        pair_clone,
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
