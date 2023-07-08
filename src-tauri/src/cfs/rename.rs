use std::{path::Path, fs};

use super::types::ErrorMessage;

#[tauri::command(async)]
pub fn rename(old_name: String, new_name: String) -> Result<(), ErrorMessage> {
    let old_path = Path::new(&old_name);
    let new_path = Path::new(&new_name);

    if !old_path.exists() {
        return Err(ErrorMessage::new_message("File doesn't exist".into()));
    }

    if new_path.exists() {
        return Err(ErrorMessage::new_message(
            "A file with given name already exists".into(),
        ));
    }

    let result = fs::rename(old_path, new_path);

    match result {
        Ok(_) => Ok(()),
        Err(error) => Err(ErrorMessage::new_all(
            "Can't rename".into(),
            error.kind().to_string(),
        )),
    }
}