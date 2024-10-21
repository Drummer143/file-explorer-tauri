use std::{ffi::OsStr, os::windows::prelude::MetadataExt, path::Path};
use tauri::{Runtime, Window};

use crate::{cfs::types::ErrorMessage, AppState};

use super::{confirm_deletion::{confirm_deletion, RemoveFileOptions}, move_to_trash::move_to_trash};

#[tauri::command(async)]
pub fn remove_file<R: Runtime>(
    window: Window<R>,
    state: tauri::State<'_, AppState>,
    path_to_file: String,
) -> Result<(), ErrorMessage> {
    let path = Path::new(&path_to_file);

    let filename = path.file_name();
    let filename = filename.unwrap_or(OsStr::new("file"));
    let filename = filename.to_str().unwrap_or("file");

    let metadata = path.metadata();

    if let Err(error) = metadata {
        return Err(ErrorMessage::new_all(
            "Can't get file",
            &error.to_string(),
        ));
    }

    let metadata = metadata.unwrap();
    let file_size = metadata.file_size();
    let result = confirm_deletion(
        &window,
        filename,
        file_size > 0,
        file_size >= state.app_config.filesystem.file_size_in_trashcan_limit_in_bytes as u64,
    );

    match result {
        RemoveFileOptions::Cancel => Ok(()),
        RemoveFileOptions::Permanent => crate::raw_fs::remove(&path_to_file),
        RemoveFileOptions::Trash => move_to_trash(&path_to_file),
    }
}
