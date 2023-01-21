#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{ffi::OsStr, fs, path::Path, process::Command};
// use tauri::api::process::Command;

const IMAGE_EXTENSIONS: [&str; 3] = ["png", "jpg", "jpeg"];

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(serde::Serialize)]
struct FileInfo {
    name: String,
    r#type: String,
    size: usize,
}

impl FileInfo {
    pub fn new(name: String, r#type: String, size: usize) -> FileInfo {
        FileInfo { name, r#type, size }
    }
}

fn is_image(path_to_file: &str) -> bool {
    let p = Path::new(path_to_file);

    if p.exists() {
        let ext = p.extension().and_then(OsStr::to_str).unwrap_or("empty");

        IMAGE_EXTENSIONS.contains(&ext)
    } else {
        println!("file does not exist");

        false
    }
}

fn get_disks() -> Result<Vec<FileInfo>, &'static str> {
    let res = Command::new("wmic")
        .arg("logicaldisk")
        .arg("get")
        .arg("name")
        .output();

    if let Ok(output) = res {
        if output.stdout.len() != 0 {
            let answer = String::from_utf8_lossy(&output.stdout);
            let answer = answer
                .split("\r\r\n")
                .filter(|str| {
                    // FIXME: REFACTOR THIS
                    str.to_string()
                        .chars()
                        .nth(0)
                        .unwrap_or('\0')
                        .is_alphabetic()
                        && str
                            .to_string()
                            .chars()
                            .nth(1)
                            .unwrap_or('\0')
                            .eq_ignore_ascii_case(&':')
                })
                .map(|str| FileInfo::new(str.trim().to_string(), "disk".to_string(), 0))
                .collect::<Vec<FileInfo>>();

            Ok(answer)
        } else {
            Err("Can't get info about disks")
        }
    } else {
        Err("Can't get info about disks")
    }
}

#[tauri::command]
fn read_dir(path_to_dir: &str) -> Result<Vec<FileInfo>, &str> {
    if path_to_dir.len() == 0 {
        return get_disks();
    }

    if let Ok(files) = fs::read_dir(path_to_dir) {
        let mut arr: Vec<FileInfo> = vec![];

        files.for_each(|file| {
            if let Ok(file) = file {
                let file_name = file.file_name().to_str().unwrap().to_string();
                let meta = file.metadata();

                if meta.is_ok() {
                    let meta = meta.unwrap();

                    let file_type = if meta.is_dir() {
                        "directory"
                    } else {
                        if is_image(file.path().to_str().unwrap_or("")) {
                            "image"
                        } else {
                            "file"
                        }
                    };

                    arr.push(FileInfo::new(
                        file_name,
                        file_type.to_string(),
                        meta.len() as usize,
                    ));
                }
            }
        });

        Ok(arr)
    } else {
        Err("Can't get information about files in directory")
    }
}

/*
if let Ok(entries) = fs::read_dir(".") {
    for entry in entries {
        if let Ok(entry) = entry {
            // Here, `entry` is a `DirEntry`.
            println!("{:?}", entry.file_name());
        }
    }
}
*/

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, read_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
