pub(super) mod app_config;
pub(super) mod copy;
pub(super) mod get_disks;
pub(super) mod get_file_size;
pub(super) mod read_dir;
pub(super) mod read_dir_simplified;
pub(super) mod remove;
pub(super) mod rename;
pub(super) mod sort_files;
pub(super) mod types;
pub(super) mod watch_dir;

use notify::RecommendedWatcher;
use std::{collections::HashMap, ffi::OsStr, path::Path, sync::Mutex};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime, State, Window,
};

use self::{
    copy::{
        copy_directory::{__cmd__copy_directory, copy_directory},
        copy_file::{__cmd__copy_file, copy_file},
        copy_multiple_files::{__cmd__copy_multiple_files, copy_multiple_files},
    },
    get_disks::{__cmd__get_disks, get_disks},
    read_dir::{__cmd__read_dir, read_dir},
    read_dir_simplified::{__cmd__get_nested_dirnames, get_nested_dirnames},
    remove::{
        remove_directory::{__cmd__remove_directory, remove_directory},
        remove_file::{__cmd__remove_file, remove_file},
        remove_multiple::{__cmd__remove_multiple, remove_multiple},
    },
    rename::{__cmd__rename, rename},
    types::{AppConfig, FileType},
    types::{ErrorMessage, FileSubtype},
    watch_dir::{__cmd__unwatch, __cmd__watch_dir, unwatch, watch_dir},
};

#[derive(Default, Debug)]
pub struct CFSState {
    watcher: Mutex<HashMap<usize, (RecommendedWatcher, String)>>,
    app_config: AppConfig,
}

impl CFSState {
    pub fn new_app_config(app_config: AppConfig) -> Self {
        Self {
            app_config,
            watcher: Mutex::default(),
        }
    }
}

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
fn exists(path_to_file: String) -> bool {
    Path::new(&path_to_file).exists()
}

#[tauri::command(async)]
fn remove<R: Runtime>(
    window: Window<R>,
    state: tauri::State<'_, CFSState>,
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
fn print_state(state: State<'_, CFSState>) {
    println!("{:#?}", state);
}

/// Adds index to the filename until it's unique.
///
/// Returns path to file.
#[tauri::command(async)]
fn add_index_to_filename(path_to_file: &str) -> Result<String, ErrorMessage> {
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

pub fn init<R: Runtime>(config: &tauri::Config) -> TauriPlugin<R> {
    let (js_init_script, app_config) = app_config::init(tauri::api::path::app_config_dir(config));

    Builder::new("cfs")
        .invoke_handler(tauri::generate_handler![
            add_index_to_filename,
            copy_directory,
            copy_file,
            copy_multiple_files,
            create_file,
            dirname,
            exists,
            get_disks,
            get_file_type,
            get_nested_dirnames,
            print_state,
            remove,
            read_dir,
            remove_directory,
            remove_file,
            remove_multiple,
            rename,
            unwatch,
            watch_dir,
        ])
        .setup(|app| {
            app.manage(CFSState::new_app_config(app_config));

            Ok(())
        })
        .js_init_script(js_init_script)
        .build()
}
