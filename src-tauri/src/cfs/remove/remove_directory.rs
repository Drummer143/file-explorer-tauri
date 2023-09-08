use std::{ffi::OsStr, path::Path};
use tauri::{Runtime, Window};

use crate::cfs::types::ErrorMessage;

use super::{
    confirm_deletion::{confirm_deletion, RemoveFileOptions},
    move_to_trash::move_to_trash,
};

#[tauri::command(async)]
pub fn remove_directory<R: Runtime>(
    window: Window<R>,
    path_to_dir: String,
) -> Result<(), ErrorMessage> {
    let path = Path::new(&path_to_dir);

    let dir_entries = path.read_dir();

    if let Err(error) = dir_entries {
        return Err(ErrorMessage::new_all(
            "Unable to read directory.",
            &error.to_string(),
        ));
    }

    let is_dir_empty = dir_entries.unwrap().count() == 0;
    let filename = path.file_name();
    let filename = filename.unwrap_or(OsStr::new("folder"));
    let filename = filename.to_str().unwrap_or("folder");

    match confirm_deletion(&window, filename, !is_dir_empty, true) {
        RemoveFileOptions::Cancel => Ok(()),
        RemoveFileOptions::Permanent => crate::raw_fs::remove(&path_to_dir),
        RemoveFileOptions::Trash => move_to_trash(&path_to_dir),
    }
}
