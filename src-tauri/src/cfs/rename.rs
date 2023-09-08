use std::{fs, path::Path};

use super::types::ErrorMessage;

#[tauri::command(async)]
pub fn rename(old_name: String, new_name: String) -> Result<(), ErrorMessage> {
    let old_path = Path::new(&old_name);
    let new_path = Path::new(&new_name);

    if !old_path.exists() {
        return Err(ErrorMessage::new_message("File doesn't exist"));
    }

    if new_path.exists() {
        return Err(ErrorMessage::new_message(
            "A file with given name already exists",
        ));
    }

    let result = fs::rename(old_path, new_path);

    match result {
        Ok(_) => Ok(()),
        Err(error) => Err(ErrorMessage::new_all("Can't rename", &error.to_string())),
    }
}
