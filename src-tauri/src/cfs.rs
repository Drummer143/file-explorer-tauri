use crate::file_types::is_image;
use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::{
    fs,
    path::Path,
    process::Command,
    sync::mpsc::{channel, Receiver},
    thread::spawn,
};
use tauri::{Runtime, Window};

#[derive(serde::Serialize)]
pub struct FileInfo {
    name: String,
    r#type: String,
    size: usize,
}

impl FileInfo {
    pub fn new(name: String, r#type: String, size: usize) -> FileInfo {
        FileInfo { name, r#type, size }
    }
}

fn watch<R: Runtime>(window: Window<R>, rx: Receiver<notify::Result<Event>>) {
    spawn(move || {
        let event_name = format!("changes-in-dir");
        while let Ok(event) = rx.recv() {
            if let Ok(event) = event {
                if event.paths[0].exists() {
                    let _ = window.emit(&event_name, event);
                }
            }
        }
    });
}

pub fn watch_dir<R: Runtime>(
    window: tauri::Window<R>,
    path_to_dir: String,
) -> Result<RecommendedWatcher, String> {
    let path = Path::new(&path_to_dir);

    if !path.exists() {
        return Err("Directory doesn't exist.".into());
    }

    let (tx, rx) = channel();
    let watcher = RecommendedWatcher::new(tx, Config::default());

    if let Err(_) = watcher {
        return Err("Can't create watcher".into());
    }

    let mut watcher = watcher.unwrap();

    let result = watcher.watch(path, RecursiveMode::NonRecursive);
    watch(window, rx);

    if let Err(_) = result {
        return Err("Error while trying to create watcher.".into());
    }

    Ok(watcher)
}

pub fn get_disks() -> Result<Vec<FileInfo>, String> {
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
                    let str = str.to_string();
                    let mut str = str.chars();
                    // FIXME: REFACTOR THIS
                    str.nth(0).unwrap_or('\0').is_alphabetic()
                        && str.nth(1).unwrap_or('\0').eq_ignore_ascii_case(&':')
                })
                .map(|str| FileInfo::new(str.trim().to_string(), "disk".to_string(), 0))
                .collect::<Vec<FileInfo>>();

            Ok(answer)
        } else {
            Err("Can't get info about disks.".into())
        }
    } else {
        Err("Can't get info about disks.".into())
    }
}

pub fn read_dir(path_to_dir: String) -> Result<Vec<FileInfo>, String> {
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
        Err("Can't get information about files in directory.".into())
    }
}
