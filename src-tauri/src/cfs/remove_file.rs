use std::{ffi::OsStr, fs, os::windows::prelude::MetadataExt, path::Path};
use tauri::{api::dialog, Runtime, Window};

use super::{types::ErrorMessage, FILE_SIZE_TRASHCAN_LIMIT};

enum RemoveFileOptions {
    Permanent,
    Trash,
    Cancel,
}

fn remove_file_permanently(path_to_file: &Path) -> Result<(), ErrorMessage> {
    match fs::remove_file(path_to_file) {
        Ok(_) => return Ok(()),
        Err(error) => {
            return Err(ErrorMessage::new_all(
                "Can't remove file.".into(),
                error.to_string(),
            ))
        }
    };
}

fn move_file_to_trash(path_to_file: &Path) -> Result<(), ErrorMessage> {
    match trash::delete(path_to_file) {
        Ok(_) => return Ok(()),
        Err(error) => {
            return Err(ErrorMessage::new_all(
                "Can't remove file.".into(),
                error.to_string(),
            ))
        }
    }
}

fn confirm_deletion<R: Runtime>(
    window: &Window<R>,
    filename: &str,
    ask_about_deletion: bool,
    ask_about_deletion_options: bool,
) -> RemoveFileOptions {
    if ask_about_deletion {
        let dialog_title = format!("Remove {filename}");
        let dialog_message = format!("Remove {}?", filename);

        let confirmed = dialog::blocking::confirm(Some(&window), dialog_title, dialog_message);

        if !confirmed {
            return RemoveFileOptions::Cancel;
        }
    }

    if ask_about_deletion_options {
        let remove_permanently = dialog::blocking::ask(
            Some(&window),
            format!("{filename} deletion"),
            format!("{filename} is too large. Remove permanently?"),
        );

        if remove_permanently {
            return RemoveFileOptions::Permanent;
        } else {
            return RemoveFileOptions::Trash;
        }
    }

    RemoveFileOptions::Permanent
}

#[tauri::command(async)]
pub fn remove_file<R: Runtime>(
    window: Window<R>,
    path_to_file: String,
) -> Result<(), ErrorMessage> {
    let path_to_file = Path::new(&path_to_file);

    let filename = path_to_file.file_name();
    let filename = filename.unwrap_or(OsStr::new("file"));
    let filename = filename.to_str().unwrap_or("file");

    let metadata = fs::metadata(path_to_file);

    if let Err(error) = metadata {
        return Err(ErrorMessage::new_all(
            "Can't get file".into(),
            error.to_string(),
        ));
    }

    let metadata = metadata.unwrap();
    let file_size = metadata.file_size();

    match confirm_deletion(
        &window,
        filename,
        file_size > 0,
        file_size >= FILE_SIZE_TRASHCAN_LIMIT,
    ) {
        RemoveFileOptions::Cancel => Ok(()),
        RemoveFileOptions::Permanent => remove_file_permanently(path_to_file),
        RemoveFileOptions::Trash => move_file_to_trash(path_to_file),
    }
}
