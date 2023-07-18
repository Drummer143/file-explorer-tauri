use std::{fs, path::Path};

use crate::cfs::types::ErrorMessage;

#[tauri::command(async)]
pub fn remove(path: String) -> Result<(), ErrorMessage> {
    let path = Path::new(&path);

    let mut error: Option<std::io::Error> = None;

    if path.is_file() {
        if let Err(err) = fs::remove_file(path) {
            error = Some(err);
        }
    } else if path.is_dir() {
        if let Err(err) = fs::remove_dir_all(path) {
            error = Some(err);
        }
    }

    if let Some(error) = error {
        return Err(ErrorMessage::new_all("Can't remove file".into(), error.to_string()))
    }

    Ok(())
}
