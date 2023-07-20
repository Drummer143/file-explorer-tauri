use std::{
    fs::File,
    io::{Read, Write},
    sync::{Arc, Condvar, Mutex},
    thread,
    time::{Duration, Instant},
};

use super::{
    copy_file::CopyActions,
    types::{CopyCutProgress, ErrorMessage},
};

#[derive(PartialEq)]
pub enum CopyResult {
    Ok,
    Stop,
    Error(ErrorMessage),
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
