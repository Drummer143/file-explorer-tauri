#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::path::Path;

mod cfs;

#[tauri::command(async)]
fn open_file(path_to_dir: String) -> Result<(), String> {
    let path_to_dir = Path::new(&path_to_dir);

    if !path_to_dir.exists() {
        return Err("Path don't exist".into());
    }

    let result = open::that(path_to_dir);

    if let Err(error) = result {
        let error_message = format!("Error while trying to open file. Reason: {}", error.kind());

        Err(error_message)
    } else {
        Ok(())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_file])
        .plugin(cfs::init())
        .plugin(tauri_plugin_fs_watch::init())
        .run(tauri::generate_context!())
        .expect("Can't run app.");
}
