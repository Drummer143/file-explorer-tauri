use std::sync::{Arc, Condvar, Mutex, RwLock};

use tauri::{Manager, Runtime, State, Window};

use crate::{cfs::{
    get_file_type,
    types::{ErrorMessage, FileType}
}, AppState};

use super::{copy_directory::copy_directory, copy_file::copy_file};

#[derive(serde::Deserialize, serde::Serialize, Clone)]
pub struct PathFromTo {
    from: String,
    to: String,
}

impl PathFromTo {
    pub fn new(from: &str, to: &str) -> Self {
        Self {
            from: from.into(),
            to: to.into(),
        }
    }
}

#[tauri::command(async)]
pub fn copy_multiple_files<R: Runtime>(
    window: Window<R>,
    state: State<'_, AppState>,
    paths: Vec<PathFromTo>,
    event_id: usize,
    remove_target_on_finish: bool,
) -> Result<(), ErrorMessage> {
    let mut index = 0;
    let file_finished_event_name = format!("copy-next-file//{}", event_id);
    let stop = Arc::new(RwLock::new(false));
    let stop_clone = stop.clone();

    window.once(format!("stop-copying//{}", event_id), move |_| {
        let mut stop = stop_clone.write().unwrap();

        *stop = true;
    });

    let control_vars = Arc::new((Condvar::new(), Mutex::new(false)));
    let control_vars_clone = control_vars.clone();

    println!("sleeping");

    window.once(format!("start-copying//{}", event_id), move |_| {
        let &(ref cvar, ref can_start) = &*control_vars_clone;
        let mut can_start = can_start.lock().unwrap();

        *can_start = true;
        cvar.notify_all();
    });

    {
        let &(ref cvar, ref can_start) = &*control_vars;
        let mut can_start = can_start.lock().unwrap();

        while !*can_start {
            can_start = cvar.wait(can_start).unwrap();
        }
    }

    for path_pair in paths {
        let filetype = get_file_type(&path_pair.from);

        let _ = window.emit(&file_finished_event_name, (index, filetype.clone()));

        let mut copy_error: Option<ErrorMessage> = None;

        match filetype {
            FileType::File => {
                let result = copy_file(
                    window.clone(),
                    state.clone(),
                    path_pair.from,
                    path_pair.to,
                    event_id,
                    remove_target_on_finish,
                    super::utils::DuplicateFileAction::Ask,
                );

                if let Err(error) = result {
                    copy_error = Some(error);
                }
            }
            FileType::Folder => {
                let result = copy_directory(
                    window.clone(),
                    state.clone(),
                    path_pair.from,
                    path_pair.to,
                    event_id,
                    remove_target_on_finish,
                    super::utils::DuplicateFileAction::Ask,
                );

                if let Err(error) = result {
                    copy_error = Some(error);
                }
            }
            FileType::Disk => unreachable!(),
            FileType::Unknown => unreachable!(),
        }

        index += 1;

        let stop_copying = stop.read().unwrap();

        if *stop_copying {
            break;
        }

        if let Some(error) = copy_error {
            let json = serde_json::to_string_pretty(&error).unwrap();

            println!("{}", json);
        }
    }

    let _ = window.emit(&format!("copy-all-finished//{}", event_id), ());

    Ok(())
}
