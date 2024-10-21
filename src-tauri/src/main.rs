#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod cfs;
mod raw_fs;

use notify::RecommendedWatcher;
use std::{collections::HashMap, sync::Mutex};
use tauri::Manager;

use cfs::{
    add_index_to_filename, app_config, canonicalize,
    copy::{
        copy_directory::copy_directory, copy_file::copy_file,
        copy_multiple_files::copy_multiple_files,
    },
    create_file, dirname, exists, get_config,
    get_dirnames::get_dirnames,
    get_disk_names::get_disk_names,
    get_disks::get_disks,
    get_file_type, open_file, open_in_explorer, print_state,
    read_dir::read_dir,
    remove::{
        remove_directory::remove_directory, remove_file::remove_file,
        remove_multiple::remove_multiple,
    },
    remove_any,
    rename::rename,
    types,
    watch_dir::{unwatch, watch_dir},
};

#[derive(Default, Debug)]
pub struct AppState {
    watcher: Mutex<HashMap<usize, (RecommendedWatcher, String)>>,
    app_config: types::AppSettings,
}

impl AppState {
    pub fn new_app_config(app_config: types::AppSettings) -> Self {
        Self {
            app_config,
            watcher: Mutex::default(),
        }
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_file,
            raw_fs::remove,
            open_in_explorer,
            //
            // cfs
            add_index_to_filename,
            canonicalize,
            copy_directory,
            copy_file,
            copy_multiple_files,
            create_file,
            dirname,
            exists,
            get_dirnames,
            get_disks,
            get_disk_names,
            get_file_type,
            get_config,
            print_state,
            remove_any,
            read_dir,
            remove_directory,
            remove_file,
            remove_multiple,
            rename,
            unwatch,
            watch_dir,
        ])
        .plugin(tauri_plugin_dialog::init())
        .on_page_load(|window, payload| {
            let _ = window.eval(&format!("console.log('{}');", payload.url()));
        })
        .setup(|app| {
            let app_config_path = app.path().app_config_dir();

            let app_config_path_ref = match app_config_path {
                Ok(path) => path,
                Err(error) => {
                    panic!("Can't get app config path: {}", error);
                }
            };

            let app_config = app_config::init(&app_config_path_ref);

            app.manage(AppState::new_app_config(app_config));

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Can't run app.");
}
