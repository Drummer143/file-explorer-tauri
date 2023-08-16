pub mod app_config;
pub mod copy_directory;
pub mod copy_file;
pub mod get_disks;
pub mod get_file_size;
pub mod read_dir;
pub mod remove_directory;
pub mod remove_file;
pub mod rename;
pub mod types;
pub mod watch_dir;

use fs_extra::file;
use notify::RecommendedWatcher;
use std::{collections::HashMap, ffi::OsStr, path::Path, sync::Mutex};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime, State,
};
use tauri::{Config, Window};

use copy_directory::*;
use copy_file::*;
use get_disks::*;
use read_dir::*;
use remove_directory::*;
use remove_file::*;
use rename::*;
use types::*;
use watch_dir::*;

#[derive(Default, Debug)]
pub struct CFSState {
    watcher: Mutex<HashMap<usize, (RecommendedWatcher, String)>>,
    copy_processes: Mutex<HashMap<usize, tauri::EventHandler>>,
    app_config: AppConfig,
}

impl CFSState {
    pub fn new_app_config(app_config: AppConfig) -> Self {
        Self {
            watcher: Mutex::default(),
            copy_processes: Mutex::default(),
            app_config,
        }
    }
}

///  10 Megabytes
const DISPLAYABLE_IMAGE_EXTENSIONS: [&str; 13] = [
    "jpg", "jpeg", "jpe", "jif", "jfif", "jfi", "webp", "png", "gif", "svg", "svgz", "bmp", "dib",
];
const APP_CONFIG_NAME: &str = "app_config.json";

fn get_file_type(path_to_file: &Path) -> FileTypes {
    if path_to_file.is_dir() {
        return FileTypes::Folder;
    }

    let extension = path_to_file
        .extension()
        .and_then(OsStr::to_str)
        .unwrap_or("");

    if DISPLAYABLE_IMAGE_EXTENSIONS.contains(&extension) {
        return FileTypes::File;
    }

    FileTypes::File
}

fn get_file_subtype(path_to_file: &Path) -> Option<FileSubtypes> {
    if path_to_file.is_dir() {
        return None;
    }

    let extension = path_to_file.extension().and_then(OsStr::to_str);

    if let Some(extension) = extension {
        if DISPLAYABLE_IMAGE_EXTENSIONS.contains(&extension) {
            return Some(FileSubtypes::Image);
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

        Err(ErrorMessage::new_message(message))
    }
}

// #[tauri::command(async)]
// fn copy<R: Runtime>(window: Window<R>, from: String, to: String) -> Result<(), ErrorMessage> {
//     let path = Path::new(&from);

//     if path.is_file() {
//         copy_file(window, from, to)
//     } else {
//         Err(ErrorMessage::new_message("Can copy only files".into()))
//     }
// }

#[tauri::command(async)]
fn print_state(state: State<'_, CFSState>) {
    println!("{:#?}", state);
}

#[tauri::command(async)]
pub fn remove_copy_process_from_state<R: Runtime>(
    state: State<'_, CFSState>,
    window: Window<R>,
    id: usize,
) {
    let state = state.copy_processes.lock();

    if let Ok(mut state) = state {
        let id = state.remove(&id);

        if let Some(id) = id {
            window.unlisten(id);
        }
    }
}

#[tauri::command(async)]
fn add_index_to_filename(path_to_file: String) -> Result<String, ErrorMessage> {
    let path = Path::new(&path_to_file);
    let mut index = 0;
    let filename = path.file_stem().unwrap().to_str();

    if filename.is_none() {
        return Err(ErrorMessage::new_message("Incorrect path".into()));
    }

    let dirname = path.parent();

    if dirname.is_none() {
        return Err(ErrorMessage::new_message("Incorrect path".into()));
    }

    let dirname = dirname.unwrap();
    let filename = filename.unwrap();
    let file_ext = path.extension().unwrap_or_default().to_str().unwrap_or_default();

    loop {
        index += 1;

        let mut indexed_filename = format!("{} ({})", filename, index);

        if !file_ext.is_empty() {
            indexed_filename = format!("{}.{}", indexed_filename, file_ext);
        }

        let indexed_path = dirname.join(&indexed_filename);

        if !indexed_path.exists() {
            break Ok(indexed_filename);
        }
    }
}

pub fn init<R: Runtime>(config: &Config) -> TauriPlugin<R> {
    let (js_init_script, app_config) = app_config::init(config, APP_CONFIG_NAME);

    println!("{}", js_init_script);

    Builder::new("cfs")
        .invoke_handler(tauri::generate_handler![
            add_index_to_filename,
            copy_directory,
            copy_file,
            exists,
            get_disks,
            print_state,
            remove,
            read_dir,
            remove_copy_process_from_state,
            remove_directory,
            remove_file,
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
