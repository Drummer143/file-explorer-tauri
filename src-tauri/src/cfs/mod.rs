pub mod app_config;
pub mod copy_file;
pub mod get_disks;
pub mod read_dir;
pub mod remove_directory;
pub mod remove_file;
pub mod rename;
pub mod types;
pub mod watch_dir;

use notify::RecommendedWatcher;
use std::{collections::HashMap, ffi::OsStr, path::Path, sync::Mutex};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};
use tauri::{Config, Window};

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
        return FileTypes::Image;
    }

    FileTypes::File
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
fn print_state(state: tauri::State<'_, CFSState>) {
    println!("{:#?}", state);
}

pub fn init<R: Runtime>(config: &Config) -> TauriPlugin<R> {
    let (js_init_script, app_config) = app_config::init(config, APP_CONFIG_NAME);

    println!("{}", js_init_script);

    Builder::new("cfs")
        .invoke_handler(tauri::generate_handler![
            remove,
            remove_file,
            remove_directory,
            unwatch,
            watch_dir,
            get_disks,
            remove_copy_process_from_state,
            read_dir,
            rename,
            exists,
            // copy,
            copy_file,
            print_state,
        ])
        .setup(|app| {
            app.manage(CFSState::new_app_config(app_config));

            Ok(())
        })
        .js_init_script(js_init_script)
        .build()
}
