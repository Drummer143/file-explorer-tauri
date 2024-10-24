pub(super) mod app_config;
pub(super) mod copy;
pub(super) mod get_dirnames;
pub(super) mod get_disk_names;
pub(super) mod get_disks;
pub(super) mod get_file_size;
pub(super) mod read_dir;
pub(super) mod remove;
pub(super) mod rename;
pub(super) mod sort_files;
pub(super) mod types;
pub(super) mod watch_dir;

use std::{ffi::OsStr, path::Path, process::Command};
use tauri::{
    Runtime, State, Window
};

use crate::AppState;

use self::{remove::{remove_directory::remove_directory, remove_file::remove_file}, types::{ErrorMessage, FileSubtype, FileType}};

const DISPLAYABLE_IMAGE_EXTENSIONS: [&str; 13] = [
    "jpg", "jpeg", "jpe", "jif", "jfif", "jfi", "webp", "png", "gif", "svg", "svgz", "bmp", "dib",
];
static APP_CONFIG_NAME: &'static str = "app_config.json";

#[tauri::command(async)]
pub fn get_file_type(path_to_file: &str) -> FileType {
    let path_to_file = Path::new(path_to_file);

    if path_to_file.is_dir() {
        FileType::Folder
    } else {
        FileType::File
    }
}

fn get_file_subtype(path_to_file: &Path) -> Option<FileSubtype> {
    if path_to_file.is_dir() {
        return None;
    }

    let extension = path_to_file.extension().and_then(OsStr::to_str);

    if let Some(extension) = extension {
        if DISPLAYABLE_IMAGE_EXTENSIONS.contains(&extension) {
            return Some(FileSubtype::Image);
        }
    }

    None
}

#[tauri::command(async)]
pub fn exists(path_to_file: String) -> bool {
    Path::new(&path_to_file).exists()
}

#[tauri::command(async)]
pub fn remove_any<R: Runtime>(
    window: Window<R>,
    state: tauri::State<'_, AppState>,
    path_to_file: String,
) -> Result<(), ErrorMessage> {
    let path = Path::new(&path_to_file);

    if path.is_dir() {
        remove_directory(window, path_to_file)
    } else if path.is_file() {
        remove_file(window, state, path_to_file)
    } else {
        let filename = path.file_name().unwrap().to_string_lossy();

        let message = format!("{} is not removable", filename);

        Err(ErrorMessage::new_message(&message))
    }
}

#[tauri::command(async)]
pub fn print_state(state: State<'_, AppState>) {
    println!("{:#?}", state);
}

/// Adds index to the filename until it's unique.
///
/// Returns path to file.
#[tauri::command(async)]
pub fn add_index_to_filename(path_to_file: &str) -> Result<String, ErrorMessage> {
    let path = Path::new(path_to_file);
    let mut index = 0;
    let filename = path.file_stem().unwrap().to_str();

    if filename.is_none() {
        return Err(ErrorMessage::new_message("Incorrect path"));
    }

    let dirname = path.parent();

    if dirname.is_none() {
        return Err(ErrorMessage::new_message("Incorrect path"));
    }

    let dirname = dirname.unwrap();
    let filename = filename.unwrap();
    let file_ext = path
        .extension()
        .unwrap_or_default()
        .to_str()
        .unwrap_or_default();

    loop {
        index += 1;

        let mut indexed_filename = format!("{} ({})", filename, index);

        if !file_ext.is_empty() {
            indexed_filename = format!("{}.{}", indexed_filename, file_ext);
        }

        let indexed_path = dirname.join(&indexed_filename);

        if !indexed_path.exists() {
            break Ok(indexed_path.to_str().unwrap().to_string());
        }
    }
}

#[tauri::command(async)]
pub fn create_file(path: String, filetype: FileType) -> Result<(), ErrorMessage> {
    use std::fs::{create_dir_all, File};

    if Path::new(&path).exists() {
        return Err(ErrorMessage::new_message("File is already exists"));
    }

    match filetype {
        FileType::File => {
            if let Err(error) = File::create(path) {
                Err(ErrorMessage::new_all(
                    "Can't create file",
                    &error.to_string(),
                ))
            } else {
                Ok(())
            }
        }
        FileType::Folder => {
            if let Err(error) = create_dir_all(path) {
                Err(ErrorMessage::new_all(
                    "Can't create folder",
                    &error.to_string(),
                ))
            } else {
                Ok(())
            }
        }
        FileType::Disk => Ok(()),
        FileType::Unknown => Ok(()),
    }
}

#[tauri::command(async)]
pub fn dirname(path: String) -> Result<String, ErrorMessage> {
    if let Some(dirname) = Path::new(&path).parent() {
        Ok(dirname.to_str().unwrap().into())
    } else if path.ends_with(':') {
        Ok("".into())
    } else {
        Err(ErrorMessage::new_message("Can't get dirname"))
    }
}

#[tauri::command(async)]
pub fn canonicalize(path: &Path) -> Result<String, ErrorMessage> {
    match path.canonicalize() {
        Ok(canonicalized) => {
            let mut canonicalized = canonicalized.to_str().unwrap();

            canonicalized
                .starts_with("\\\\?\\")
                .then(|| canonicalized = &canonicalized[4..]);

            Ok(canonicalized.into())
        }
        Err(error) => Err(ErrorMessage::new_all(
            "Can't get canonicalized path",
            &error.to_string(),
        )),
    }
}

#[tauri::command(async)]
pub fn open_file(path_to_file: String) -> Result<(), ErrorMessage> {
    let path_to_file = Path::new(&path_to_file);

    if !path_to_file.exists() {
        return Err(ErrorMessage::new_message("Path don't exist".into()));
    }

    let result = Command::new("explorer").arg(&path_to_file).output();

    if let Err(error) = result {
        return Err(ErrorMessage::new_all(
            "Can't run command",
            &error.to_string(),
        ));
    }

    let output = result.unwrap();

    if !output.status.success() {
        Ok(())
    } else {
        let error = String::from_utf8_lossy(&output.stderr);

        Err(ErrorMessage::new_all("error in result", &error))
    }
}

#[tauri::command(async)]
pub fn open_in_explorer(path_to_file: String) -> Result<(), ErrorMessage> {
    let path = Path::new(&path_to_file);

    let mut command = Command::new("explorer");

    if path.is_file() {
        command.arg("/select,");
    }

    let result = command.arg(&path_to_file).output();

    if let Err(error) = result {
        return Err(ErrorMessage::new_all(
            "Can't run command",
            &error.to_string(),
        ));
    }

    let output = result.unwrap();

    if !output.status.success() {
        Ok(())
    } else {
        let error = String::from_utf8_lossy(&output.stderr);

        Err(ErrorMessage::new_all("error in result", &error))
    }
}

#[tauri::command(async)]
pub fn get_config(state: State<'_, AppState>) -> Result<types::AppSettings, ErrorMessage> {
    Ok(state.app_config.clone())
}
