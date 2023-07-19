#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod cfs;
mod raw_fs;

use std::{path::Path, process::Command};

use cfs::types::ErrorMessage;

#[tauri::command(async)]
fn open_file(path_to_file: String) -> Result<(), ErrorMessage> {
    let path_to_file = Path::new(&path_to_file);

    if !path_to_file.exists() {
        return Err(ErrorMessage::new_message("Path don't exist".into()));
    }

    let result = Command::new("explorer").arg(&path_to_file).output();

    if let Err(error) = result {
        return Err(ErrorMessage::new_all(
            "Can't run command".into(),
            error.to_string(),
        ));
    }

    let output = result.unwrap();

    if !output.status.success() {
        Ok(())
    } else {
        let error = String::from_utf8_lossy(&output.stderr);

        Err(ErrorMessage::new_all(
            "error in result".into(),
            error.into(),
        ))
    }
}

#[tauri::command(async)]
fn open_in_explorer(path_to_file: String) -> Result<(), ErrorMessage> {
    let path = Path::new(&path_to_file);

    let mut command = Command::new("explorer");

    if path.is_file() {
        command.arg("/select,");
    }

    let result = command.arg(&path_to_file).output();

    if let Err(error) = result {
        return Err(ErrorMessage::new_all(
            "Can't run command".into(),
            error.to_string(),
        ));
    }

    let output = result.unwrap();

    if !output.status.success() {
        Ok(())
    } else {
        let error = String::from_utf8_lossy(&output.stderr);

        Err(ErrorMessage::new_all(
            "error in result".into(),
            error.into(),
        ))
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
    let ctx = tauri::generate_context!();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_file,
            raw_fs::remove,
            open_in_explorer
        ])
        .plugin(cfs::init(ctx.config()))
        .run(ctx)
        .expect("Can't run app.");
}
