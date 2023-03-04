#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod cfs;
mod file_types;

use std::process::Command;

#[tauri::command]
fn open_in_explorer(path_to_dir: String) -> Result<(), String> {
    let result = Command::new("explorer").arg(&path_to_dir).output();

    match result {
        Ok(result) => {
            let stderr = String::from_utf8_lossy(&result.stderr);

            if !stderr.is_empty() {
                Err(format!("Error while trying to open explorer: {}", stderr))
            } else {
                Ok(())
            }
        }
        Err(_) => Err("Error in cmd".into()),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_in_explorer])
        .plugin(cfs::init())
        .run(tauri::generate_context!())
        .expect("Can't run app.");
}
