use std::{
    fs::File,
    io::{Read, Write},
    path::Path,
    sync::{Arc, Condvar, Mutex},
    thread,
    time::{Duration, Instant},
};
use tauri::{Runtime, State, Window};

use super::{
    types::{CopyActions, CopyCutProgress, CopyResult, ErrorMessage},
    CFSState,
};

#[derive(serde::Deserialize)]
pub struct FileCopyOptions {
    pub overwrite: bool,
    pub skip_exist: bool,
    pub remove_target_on_finish: bool,
}

pub fn copy_file_with_progress<R: tauri::Runtime>(
    window: &tauri::Window<R>,
    from: &str,
    to: &str,
    event_id: usize,
    buffer_size: usize,
    copy_speed: u64,
    control_vars: Arc<(Mutex<CopyActions>, Condvar)>,
) -> CopyResult {
    let file_from = File::open(&from);

    if let Err(error) = file_from {
        return CopyResult::Error(ErrorMessage::new_all(
            "Can't open target file".into(),
            error.to_string(),
        ));
    }

    let mut file_from = file_from.unwrap();
    let file_to = File::create(&to);

    if let Err(error) = file_to {
        return CopyResult::Error(ErrorMessage::new_all(
            "Can't create file file".into(),
            error.to_string(),
        ));
    }

    let mut file_to = file_to.unwrap();
    let progress_event_name = format!("copy-progress//{}", event_id);
    let file_size = file_from.metadata().unwrap().len();
    let mut total_bytes_copied = 0;
    let mut buffer = vec![0; buffer_size];
    let start_time = Instant::now();

    loop {
        let &(ref lock, ref cvar) = &*control_vars;
        let mut state = lock.lock().unwrap();

        match *state {
            CopyActions::Pause => {
                while *state == CopyActions::Pause {
                    state = cvar.wait(state).unwrap();
                }
            }
            CopyActions::Exit => {
                break CopyResult::Stop;
            }
            _ => {}
        }

        window
            .emit(
                &progress_event_name,
                CopyCutProgress {
                    done: total_bytes_copied as usize,
                    total: file_size as usize,
                },
            )
            .expect("Can't send message to window");

        let bytes_read = file_from.read(&mut buffer);

        if let Err(error) = bytes_read {
            break CopyResult::Error(ErrorMessage::new_all(
                "error on reading source file".into(),
                error.to_string(),
            ));
        }

        let bytes_read = bytes_read.unwrap();

        if bytes_read == 0 {
            // Достигнут конец файла
            break CopyResult::Ok;
        }

        let result = file_to.write_all(&buffer[..bytes_read]);

        if let Err(error) = result {
            break CopyResult::Error(ErrorMessage::new_all(
                "error on writing on new file file".into(),
                error.to_string(),
            ));
        }

        total_bytes_copied += bytes_read;

        let elapsed_seconds = start_time.elapsed().as_secs();
        let elapsed_bytes = total_bytes_copied;
        let expected_bytes = copy_speed * elapsed_seconds;

        if elapsed_bytes > (expected_bytes as usize) {
            let sleep_duration = Duration::from_secs(1);
            thread::sleep(sleep_duration);
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
    copy_options: FileCopyOptions,
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
