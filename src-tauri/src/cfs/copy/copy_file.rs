use std::{
    fs::File,
    io::{Read, Write},
    path::Path,
    sync::{Arc, Condvar, Mutex},
    thread,
    time::{Duration, Instant},
};
use tauri::{Runtime, State, Window};

use crate::cfs::{
    types::{CopyActions, CopyCutProgress, CopyResult, ErrorMessage},
    CFSState,
};

use super::utils::HandleDuplicateFileAnswer;

pub fn copy_file_with_progress<R: tauri::Runtime>(
    window: &tauri::Window<R>,
    from: &str,
    to: &str,
    event_id: usize,
    buffer_size: usize,
    copy_speed: u64,
    control_vars: Arc<(Mutex<CopyActions>, Condvar)>,
    mut total_bytes_copied: usize,
    total_size: Option<u64>,
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
    let mut buffer = vec![0; buffer_size];
    let start_time = Instant::now();
    let file_size = if let Some(total_size) = total_size {
        total_size
    } else {
        file_from.metadata().unwrap().len()
    };

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

#[tauri::command(async)]
pub fn copy_file<R: Runtime>(
    // app: AppHandle<R>,
    window: Window<R>,
    state: State<'_, CFSState>,
    from: String,
    mut to: String,
    event_id: usize,
    remove_target_on_finish: bool,
) -> Result<(), ErrorMessage> {
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

    if path_to.exists() {
        let result = super::utils::handle_duplicate_file(&to, &from, &window);

        match result {
            HandleDuplicateFileAnswer::New(new_to) => to = new_to,
            HandleDuplicateFileAnswer::Error(error) => return Err(error),
            HandleDuplicateFileAnswer::Merge => {
                let _ = window.emit(&format!("copy-finished//{}", event_id), ());

                return Ok(());
            }
            HandleDuplicateFileAnswer::Skip => {
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

    let result = copy_file_with_progress(
        &window,
        &from,
        &to,
        event_id,
        buffer_size,
        copy_speed as u64,
        control_vars_clone,
        0,
        None,
    );

    let _ = window.emit(&format!("copy-finished//{}", event_id), ());

    window.unlisten(listener_id);

    match result {
        CopyResult::Stop => Ok(()),
        CopyResult::Error(error) => Err(error),
        CopyResult::Ok => {
            if remove_target_on_finish {
                crate::raw_fs::remove(from)
            } else {
                Ok(())
            }
        }
    }
}
