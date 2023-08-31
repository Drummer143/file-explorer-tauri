use std::path::Path;
use tauri::{Runtime, State, Window};

use crate::cfs::{CFSState, types::ErrorMessage};

use super::{
    copy_directory::copy_directory,
    copy_file::copy_file,
};

#[derive(serde::Deserialize, serde::Serialize, Clone)]
pub struct PathFromTo {
    from: String,
    to: String,
}

impl PathFromTo {
    pub fn new(from: &str, to: &str) -> Self {
        Self { from: from.into(), to: to.into() }
    }
}

#[tauri::command(async)]
pub fn copy_multiple_files<R: Runtime>(
    window: Window<R>,
    state: State<'_, CFSState>,
    paths: Vec<PathFromTo>,
    event_id: usize,
    remove_target_on_finish: bool,
) -> Result<(), ErrorMessage> {
    let index = 0;
    let paths_len = paths.len();

    for path_pair in paths {
        let is_file = Path::new(&path_pair.from).is_file();

        if is_file {
            let _ = copy_file(
                window.clone(),
                state.clone(),
                path_pair.from,
                path_pair.to,
                event_id,
                remove_target_on_finish,
            );
        } else {
            let _ = copy_directory(
                window.clone(),
                state.clone(),
                path_pair.from,
                path_pair.to,
                event_id,
                remove_target_on_finish,
            );
        }

        let _ = window.emit(
            &format!("copy-file-copied//{}", event_id),
            (index, paths_len),
        );
    }

    let _ = window.emit(&format!("copy-all-finished//{}", event_id), ());

    Ok(())
}
