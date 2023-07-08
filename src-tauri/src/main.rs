#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod cfs;

use std::path::Path;

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

// #[tauri::command(async)]
// fn sw<R: Runtime>(app_handle: AppHandle<R>) -> Result<(), ErrorMessage> {
//     let result = tauri::WindowBuilder::new(
//         &app_handle,
//         "file-exists",
//         tauri::WindowUrl::App("file-exists.html".into()),
//     )
//     .build();

//     if let Err(error) = result {
//         Err(ErrorMessage::new_all(
//             "Can't open second window".into(),
//             error.to_string(),
//         ))
//     } else {
//         Ok(())
//     }
// }

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_file])
        .plugin(cfs::init())
        .run(tauri::generate_context!())
        .expect("Can't run app.");
}
