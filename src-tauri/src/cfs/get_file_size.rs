use std::{path::Path, fs};

use super::types::ErrorMessage;

pub fn get_file_size(path: &Path) -> Result<u64, ErrorMessage> {
    let metadata = fs::metadata(path);

    if metadata.is_err() {
        return Ok(0);
    }

    let metadata = metadata.unwrap();

    if metadata.is_file() {
        Ok(metadata.len())
    } else if metadata.is_dir() {
        let mut size: u64 = 0;

        let dir_entries = fs::read_dir(path);

        if dir_entries.is_err() {
            return Ok(0);
        }

        let dir_entries = dir_entries.unwrap();

        for entry in dir_entries {
            let entry = entry;

            if entry.is_err() {
                continue;
            }

            let entry = entry.unwrap();
            let file_name = entry.file_name();
            let new_path = path.join(&file_name);

            size += get_file_size(&new_path)?;
        }
        Ok(size)
    } else {
        Ok(0)
    }
}