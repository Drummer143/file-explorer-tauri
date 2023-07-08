#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::path::Path;
use tauri::Manager;

mod cfs;
// mod old_cfs;

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
        .setup(|app|{
            let w = app.get_window("main");

            if let Some(window) = w {
                if !window.is_devtools_open() {
                    window.open_devtools();
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Can't run app.");
}
