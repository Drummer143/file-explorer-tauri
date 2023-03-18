// use crate::file_types::is_image;
use notify::{
    Config, Event as NotifyEvent, EventKind as NotifyEventKind, RecommendedWatcher, RecursiveMode,
    Watcher, event::EventAttributes,
};
use rand::random;
use std::{
    collections::HashMap,
    fs,
    os::windows::fs::MetadataExt,
    path::{Path, PathBuf},
    sync::mpsc::{channel, Receiver},
    sync::Mutex,
    thread::spawn,
};
use sysinfo::{DiskExt, System, SystemExt};
use tauri::Window;
use tauri::{
    api::dialog,
    plugin::{Builder, TauriPlugin},
    Manager, Runtime, State,
};

#[derive(Default, Debug)]
struct CFSState {
    watcher: Mutex<HashMap<usize, (RecommendedWatcher, String)>>,
}

#[derive(serde::Serialize, Debug)]
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

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
enum FileChangeEventType {
    Access,
    Any,
    Create,
    Modify,
    Remove,
    Other,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
struct FileChangePayload {
    r#type: FileChangeEventType,
    kind: NotifyEventKind,
    paths: Vec<PathBuf>,
    attrs: EventAttributes,
}

fn watch<R: Runtime>(window: Window<R>, rx: Receiver<notify::Result<NotifyEvent>>) {
    spawn(move || {
        while let Ok(event) = rx.recv() {
            if let Ok(event) = event {
                let event_type = match event.kind {
                    NotifyEventKind::Access(_) => FileChangeEventType::Access,
                    NotifyEventKind::Any => FileChangeEventType::Any,
                    NotifyEventKind::Create(_) => FileChangeEventType::Create,
                    NotifyEventKind::Modify(_) => FileChangeEventType::Modify,
                    NotifyEventKind::Other => FileChangeEventType::Other,
                    NotifyEventKind::Remove(_) => FileChangeEventType::Remove,
                };

                let payload = FileChangePayload {
                    r#type: event_type,
                    attrs: event.attrs,
                    kind: event.kind,
                    paths: event.paths
                };

                let _ = window.emit("changes-in-dir", payload);
            }
        }
    });
}

#[tauri::command]
fn watch_dir<R: Runtime>(
    window: tauri::Window<R>,
    state: State<'_, CFSState>,
    path_to_dir: String,
) -> Result<usize, String> {
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

    let id: usize = random::<u8>().into();

    state
        .watcher
        .lock()
        .unwrap()
        .insert(id, (watcher, path_to_dir));

    Ok(id.into())
}

#[tauri::command]
fn get_disks() -> Result<Vec<FileInfo>, String> {
    let mut sys = System::new_all();

    sys.refresh_disks();
    sys.refresh_disks_list();

    let mut disks: Vec<FileInfo> = vec![];

    for disk in sys.disks() {
        let mount = disk.mount_point().to_str().unwrap_or("").replace("\\", "");

        disks.push(FileInfo::new(mount.into(), "disk".into(), 0));
    }

    Ok(disks)
}

#[tauri::command]
fn read_dir(path_to_dir: String) -> Result<Vec<FileInfo>, String> {
    if path_to_dir.len() == 0 {
        return get_disks();
    }

    if let Ok(files) = fs::read_dir(path_to_dir) {
        let mut dir_entry_info: Vec<FileInfo> = vec![];

        files.for_each(|file| {
            if let Ok(file) = file {
                let file_name = file.file_name().to_str().unwrap().to_string();
                let meta = fs::metadata(file.path());

                if let Ok(meta) = meta {
                    let file_type = if meta.is_dir() {
                        "directory"
                    } else {
                        // if is_image(file.path().to_str().unwrap_or("")) {
                        //     "image"
                        // } else {
                        "file"
                        // }
                    };

                    dir_entry_info.push(FileInfo::new(
                        file_name,
                        file_type.into(),
                        meta.file_size() as usize,
                    ));
                }
            }
        });

        Ok(dir_entry_info)
    } else {
        Err("Can't get information about files in directory.".into())
    }
}

#[tauri::command]
fn unwatch(state: State<'_, CFSState>, id: usize) -> Result<(), String> {
    let result = state.watcher.lock().unwrap().remove(&id);

    if let Some((mut watcher, path)) = result {
        let res = watcher.unwatch(Path::new(&path));

        match res {
            Ok(_) => Ok(()),
            Err(_) => Err("Can't disable watcher.".into()),
        }
    } else {
        Err("Watcher wasn't found.".into())
    }
}

#[tauri::command]
fn rename(old_name: String, new_name: String) -> Result<(), String> {
    let old_path = Path::new(&old_name);
    let new_path = Path::new(&new_name);

    if !old_path.exists() {
        return Err("File doesn't exist".into());
    }

    if new_path.exists() {
        return Err("A file with given name already exists".into());
    }

    let result = fs::rename(old_path, new_path);

    match result {
        Ok(_) => Ok(()),
        Err(error) => Err(error.kind().to_string()),
    }
}

fn delete_file(path_to_file: String) -> Result<(), String> {
    let path_to_file = Path::new(&path_to_file);

    if path_to_file.is_dir() {
        let result = fs::remove_dir_all(path_to_file);

        match result {
            Ok(_) => return Ok(()),
            Err(_) => return Err("Can't delete directory".into()),
        }
    }

    if path_to_file.is_file() {
        let result = fs::remove_file(path_to_file);

        match result {
            Ok(_) => return Ok(()),
            Err(_) => return Err("Can't delete directory".into()),
        }
    }

    Err("Unknown file".into())
}

#[tauri::command]
pub fn check_file_before_delete<R: Runtime>(
    window: Window<R>,
    path_to_file: String,
) -> Result<(), String> {
    let path = Path::new(&path_to_file);

    if !path.exists() {
        return Err("File doesn't exist".into());
    }

    if path.is_dir() {
        let dir_entry = fs::read_dir(path);

        match dir_entry {
            Ok(mut files) => {
                let is_empty = files.next().is_none();

                if !is_empty {
                    let filename: &str = if let Some(file_name) = path.file_name() {
                        file_name.to_str().unwrap_or("directory")
                    } else {
                        "directory"
                    };

                    dialog::confirm(
                        Some(&window),
                        format!("Deleting {}", filename),
                        format!("Confirm {} deletion", filename),
                        |answer| {
                            if answer {
                                let result = delete_file(path_to_file);

                                if let Err(error) = result {
                                    println!("{}", error);
                                }
                            }
                        },
                    );

                    return Ok(());
                } else {
                    return delete_file(path_to_file);
                }
            }
            Err(_) => return Err("Can't read directory".into()),
        }
    }

    if path.is_file() {
        let file_entry = fs::read(path);

        match file_entry {
            Ok(data) => {
                if data.len() != 0 {
                    let filename: &str = if let Some(file_name) = path.file_name() {
                        file_name.to_str().unwrap_or("file")
                    } else {
                        "file"
                    };

                    dialog::confirm(
                        Some(&window),
                        format!("Deleting {}", filename),
                        format!("Confirm {} deletion", filename),
                        |answer| {
                            if answer {
                                let result = delete_file(path_to_file);

                                if let Err(error) = result {
                                    println!("{}", error);
                                }
                            }
                        },
                    );
                } else {
                    return delete_file(path_to_file);
                }
            }
            Err(_) => return Err("Can't read file".into()),
        }
    }

    Ok(())
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("cfs")
        .invoke_handler(tauri::generate_handler![
            read_dir,
            watch_dir,
            get_disks,
            unwatch,
            rename,
            check_file_before_delete
        ])
        .setup(|app_handle| {
            // setup plugin specific state here
            app_handle.manage(CFSState::default());
            Ok(())
        })
        .build()
}
