use std::{os::windows::fs::MetadataExt, path::Path};

use super::types::ErrorMessage;

#[tauri::command(async)]
pub fn get_dirnames(path_to_dir: String) -> Result<Vec<String>, ErrorMessage> {
    let path = Path::new(&path_to_dir);

    if !path.exists() {
        return Err(ErrorMessage::new_message("Path don't exist"));
    }

    let mut folders: Vec<String> = vec![];
    let dir_entries = path.read_dir();

    if let Err(error) = dir_entries {
        return Err(ErrorMessage::new_all(
            "Can't read directory",
            &error.to_string(),
        ));
    }

    let dir_entries = dir_entries.unwrap();

    for entry in dir_entries {
        if let Err(error) = entry {
            println!("{}", error.to_string());
            continue;
        }

        let entry = entry.unwrap();
        let metadata = entry.metadata();

        if let Err(error) = metadata {
            println!("{}", error.to_string());
            continue;
        }

        let metadata = metadata.unwrap();
        let is_hidden = (metadata.file_attributes() & 0x2) > 0;

        if metadata.is_dir() && !is_hidden {
            let filename = entry.file_name();
            let filename = filename.to_str();

            if !filename.is_none() {
                folders.push(filename.unwrap().to_string());
            }
        }
    }

    Ok(folders)
}
