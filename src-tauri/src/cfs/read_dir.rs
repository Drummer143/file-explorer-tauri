use std::{fs::DirEntry, io::Error as IOError, os::windows::prelude::MetadataExt};

use super::{
    get_file_subtype, get_file_type,
    types::{ErrorMessage, FileInfo, FileType, SortConfig, SortOrder},
    CFSState,
};

fn handle_file(file: Result<DirEntry, IOError>) -> Option<FileInfo> {
    if let Ok(file) = file {
        let file_name = file.file_name().to_str().unwrap().to_string();
        let meta = file.metadata().unwrap();

        let is_hidden = (meta.file_attributes() & 0x2) > 0;

        if !is_hidden {
            let file_type = get_file_type(file.path().to_str().unwrap());
            let file_subtype = get_file_subtype(&file.path());
            let ext = if file_type != FileType::Folder {
                if let Some(ext) = file.path().extension() {
                    if let Some(ext) = ext.to_str() {
                        Some(String::from(ext))
                    } else {
                        None
                    }
                } else {
                    None
                }
            } else {
                None
            };

            return Some(FileInfo::new(
                file_name,
                file_type.into(),
                meta.file_size() as usize,
                meta.permissions().readonly(),
                file_subtype,
                ext,
            ));
        }
    }

    None
}

#[tauri::command(async)]
pub fn read_dir(
    state: tauri::State<'_, CFSState>,
    path_to_dir: String,
    sort_config: Option<SortConfig>,
) -> Result<Vec<FileInfo>, ErrorMessage> {
    let path_to_dir = std::path::Path::new(&path_to_dir);

    if !path_to_dir.exists() {
        return Err(ErrorMessage::new_message("Path don't exist"));
    }

    let dir_entries = path_to_dir.read_dir();

    if let Err(error) = dir_entries {
        return Err(ErrorMessage::new_all(
            "Can't get information about files in directory.",
            &error.to_string(),
        ));
    }

    let mut files: Vec<FileInfo> = vec![];
    let mut folders: Vec<FileInfo> = vec![];

    dir_entries.unwrap().for_each(|file| {
        if let Some(file) = handle_file(file) {
            if file.r#type == FileType::Folder {
                folders.push(file);
            } else {
                files.push(file);
            }
        }
    });

    let sort_config = sort_config.unwrap_or(state.app_config.filesystem.sort_config);
    let is_sort_default = sort_config.increasing && sort_config.order == SortOrder::Name;

    if !is_sort_default {
        use super::sort_files::sort_files;

        Ok(sort_files(files, folders, sort_config.order, sort_config.increasing))
    } else {
        Ok([folders, files].concat())
    }
}
