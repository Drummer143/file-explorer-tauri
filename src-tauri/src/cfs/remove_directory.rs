use std::{ffi::OsStr, fs, path::Path};
use tauri::{api::dialog, Runtime, Window};

use super::types::ErrorMessage;

enum RemoveDirectoryOptions {
    Permanent,
    Trash,
    Cancel,
}

fn move_dir_to_trash(path_to_dir: &Path) -> Result<(), ErrorMessage> {
    match trash::delete(path_to_dir) {
        Err(error) => {
            return Err(ErrorMessage::new_all(
                "Can't remove directory.".into(),
                error.to_string(),
            ));
        }
        Ok(_) => return Ok(()),
    }
}

fn remove_permanently(path_to_dir: &Path) -> Result<(), ErrorMessage> {
    match fs::remove_dir_all(path_to_dir) {
        Ok(_) => return Ok(()),
        Err(error) => {
            // if error.raw_os_error().unwrap_or(-1) == 5 {
            //     let output = Command::new("cmd")
            //         .args(&[
            //             "/C",
            //             "runas",
            //             "/user:Administrator",
            //             "cmd.exe",
            //             "/C",
            //             "del",
            //             &path,
            //         ])
            //         .output()
            //         .expect("Failed to execute command.");
            //     if output.status.success() {
            //         return Ok(());
            //     } else {
            //         let a = if !!output.stdout.is_empty() {
            //             output.stdout
            //         } else {
            //             output.stderr
            //         };
            //         let message = format!(
            //             "Error deleting file with administrator rights. Reason: {:#?}",
            //             a
            //         );

            //         return Err(message);
            //     }
            // } else {
            return Err(ErrorMessage::new_all(
                "Can't remove directory.".into(),
                error.to_string(),
            ));
            // }
        }
    }
}

fn confirm_deletion<R: Runtime>(
    window: &Window<R>,
    filename: &str,
    ask_about_deletion: bool,
) -> RemoveDirectoryOptions {
    if ask_about_deletion {
        let dialog_title = format!("{filename} deletion");
        let dialog_message = format!("Remove {filename}?");

        let confirmed = dialog::blocking::confirm(Some(&window), dialog_title, dialog_message);

        if !confirmed {
            return RemoveDirectoryOptions::Cancel;
        }
    }

    let delete_permanently = dialog::blocking::ask(
        Some(&window),
        format!("{filename} deletion"),
        format!("Delete {filename} permanently?"),
    );

    if delete_permanently {
        return RemoveDirectoryOptions::Permanent;
    } else {
        return RemoveDirectoryOptions::Trash;
    }
}

#[tauri::command(async)]
pub fn remove_directory<R: Runtime>(window: Window<R>, path: String) -> Result<(), ErrorMessage> {
    let path_to_dir = Path::new(&path);

    let dir_entries = path_to_dir.read_dir();

    if let Err(error) = dir_entries {
        return Err(ErrorMessage::new_all(
            "Unable to read directory.".into(),
            error.to_string(),
        ));
    }

    let is_dir_empty = dir_entries.unwrap().count() == 0;
    let filename = path_to_dir.file_name();
    let filename = filename.unwrap_or(OsStr::new("folder"));
    let filename = filename.to_str().unwrap_or("folder");

    match confirm_deletion(&window, filename, !is_dir_empty) {
        RemoveDirectoryOptions::Cancel => Ok(()),
        RemoveDirectoryOptions::Permanent => remove_permanently(path_to_dir),
        RemoveDirectoryOptions::Trash => move_dir_to_trash(path_to_dir)
    }
}
