use std::{fs, path::Path};

pub fn get_file_size(path: &str) -> usize {
    let metadata = fs::metadata(path);

    if metadata.is_err() {
        return 0;
    }

    let metadata = metadata.unwrap();

    let path = Path::new(path);

    if metadata.is_file() {
        metadata.len() as usize
    } else if metadata.is_dir() {
        let mut size: usize = 0;

        let dir_entries = fs::read_dir(path);

        if dir_entries.is_err() {
            return 0;
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

            size += get_file_size(new_path.to_str().unwrap());
        }
        size
    } else {
        0
    }
}
