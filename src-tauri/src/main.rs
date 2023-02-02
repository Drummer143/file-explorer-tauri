#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod cfs;
mod file_types;

use cfs::{read_dir as cfs_read_dir, watch_dir as cfs_watch_dir, FileInfo};
use notify::{RecommendedWatcher, Watcher};
use rand::random;
use std::{collections::HashMap, sync::Mutex, path::Path};
use tauri::{Manager, Runtime, State};

#[derive(Default)]
struct MyState {
    watcher: Mutex<HashMap<usize, (RecommendedWatcher, String)>>,
}

#[tauri::command]
fn read_dir(path_to_dir: String) -> Result<Vec<FileInfo>, String> {
    let result = cfs_read_dir(path_to_dir.clone());

    result
}

#[tauri::command]
fn watch_dir<R: Runtime>(
    window: tauri::Window<R>,
    state: State<'_, MyState>,
    path_to_dir: String,
) -> Result<usize, String> {
    let watcher = cfs_watch_dir(window, path_to_dir.clone());

    if let Ok(watcher) = watcher {
        let id = random::<usize>();

        state.watcher.lock().unwrap().insert(id, (watcher, path_to_dir));

        Ok(id)
    } else {
        Err("Can't create watcher.".into())
    }
}

#[tauri::command]
fn unwatch(state: State<'_, MyState>, id: usize) -> Result<(), String> {
    let result = state.watcher.lock().unwrap().remove(&id);

    if let Some((mut watcher, path)) = result {
        let res = watcher.unwatch(Path::new(&path));

        match res {
            Ok(_) => Ok(()),
            Err(_) => Err("Can't disable watcher.".into())
        }
    } else {
        Err("Watcher wasn't found.".into())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_dir, watch_dir, unwatch])
        .setup(|app| {
            app.manage(MyState::default());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Can't run app.");
}
