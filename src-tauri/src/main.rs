#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod cfs;
mod file_types;

fn main() {
    tauri::Builder::default()
        // .invoke_handler(tauri::generate_handler![])
        .plugin(cfs::init())
        .run(tauri::generate_context!())
        .expect("Can't run app.");
}
