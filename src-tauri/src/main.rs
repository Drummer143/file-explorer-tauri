#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod cfs;
mod types;
mod raw_fs;
mod app_config;

use std::{path::Path, process::Command};

use cfs::{
    create_file, dirname, get_file_type,
    types::ErrorMessage,
};

#[tauri::command(async)]
fn open_file(path_to_file: String) -> Result<(), ErrorMessage> {
    let path_to_file = Path::new(&path_to_file);

    if !path_to_file.exists() {
        return Err(ErrorMessage::new_message("Path don't exist".into()));
    }

    let result = Command::new("explorer").arg(&path_to_file).output();

    if let Err(error) = result {
        return Err(ErrorMessage::new_all(
            "Can't run command",
            &error.to_string(),
        ));
    }

    let output = result.unwrap();

    if !output.status.success() {
        Ok(())
    } else {
        let error = String::from_utf8_lossy(&output.stderr);

        Err(ErrorMessage::new_all("error in result", &error))
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
            "Can't run command",
            &error.to_string(),
        ));
    }

    let output = result.unwrap();

    if !output.status.success() {
        Ok(())
    } else {
        let error = String::from_utf8_lossy(&output.stderr);

        Err(ErrorMessage::new_all("error in result", &error))
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_file,
            raw_fs::remove,
            open_in_explorer,
            create_file,
            dirname,
            get_file_type,
        ])
        // .plugin(cfs::init(ctx.config()))
        .on_page_load(|window, payload| {
            let _ = window.eval(&format!("console.log('{}');", payload.url()));
        })
        .run(tauri::generate_context!())
        .expect("Can't run app.");
}
