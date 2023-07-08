use std::{fs::DirEntry, io::Error as IOError, os::windows::prelude::MetadataExt};

use super::{
    get_file_type,
    types::{ErrorMessage, FileInfo},
};

/// function checks given file and if its ok returns required info about it
fn handle_file(file: Result<DirEntry, IOError>) -> Option<FileInfo> {
    if let Ok(file) = file {
        let file_name = file.file_name().to_str().unwrap().to_string();
        let meta = file.metadata().unwrap();

        let is_hidden = (meta.file_attributes() & 0x2) > 0;

        if !is_hidden {
            let file_type = get_file_type(&file.path());

            return Some(FileInfo::new(
                file_name,
                file_type.into(),
                meta.file_size() as usize,
                meta.permissions().readonly(),
            ));
        }
    }

    None
}

#[tauri::command(async)]
pub fn read_dir(path_to_dir: String) -> Result<Vec<FileInfo>, ErrorMessage> {
    let path_to_dir = std::path::Path::new(&path_to_dir);

    if !path_to_dir.exists() {
        return Err(ErrorMessage::new_message("Path don't exist".into()));
    }

    let files = path_to_dir.read_dir();

    if let Err(error) = files {
        return Err(ErrorMessage::new_all(
            "Can't get information about files in directory.".into(),
            error.to_string(),
        ));
    }

    let mut dir_entry_info: Vec<FileInfo> = vec![];

    files.unwrap().for_each(|file| {
        if let Some(file_info) = handle_file(file) {
            dir_entry_info.push(file_info);
        }
    });

    Ok(dir_entry_info)
}
