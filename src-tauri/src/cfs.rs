// use crate::file_types::is_image;
use notify::{
    event::EventAttributes, Config, Event as NotifyEvent, EventKind as NotifyEventKind,
    RecommendedWatcher, RecursiveMode, Watcher,
};
use rand::random;
use std::{
    collections::HashMap,
    ffi::OsStr,
    fs,
    os::windows::fs::MetadataExt,
    path::{Path, PathBuf},
    sync::mpsc::{channel, Receiver},
    sync::Mutex,
    thread::spawn,
};
use sysinfo::{DiskExt, System, SystemExt};
use tauri::{api::dialog, Window};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime, State,
};

#[derive(Default, Debug)]
struct CFSState {
    watcher: Mutex<HashMap<usize, (RecommendedWatcher, String)>>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct DiskInfo {
    mount_point: String,
    name: String,
    r#type: String,
    total_space: usize,
    available_space: usize,
}

impl DiskInfo {
    pub fn new(
        mount_point: String,
        name: String,
        total_space: usize,
        available_space: usize,
    ) -> Self {
        Self {
            mount_point,
            name,
            total_space,
            available_space,
            r#type: "disk".into(),
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
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
#[serde(rename_all = "camelCase")]
struct FileChangePayload {
    r#type: FileChangeEventType,
    kind: NotifyEventKind,
    paths: Vec<PathBuf>,
    attrs: EventAttributes,
    file_info: FileInfo,
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

                let path_buf_default = &PathBuf::default();

                let paths = event.paths.clone();
                let path_to_file = paths.first().unwrap_or(path_buf_default);

                let filename = path_to_file
                    .file_name()
                    .unwrap_or(OsStr::new(""))
                    .to_string_lossy();

                let file_type = if path_to_file.is_dir() {
                    "directory"
                } else {
                    "file"
                };

                let metadata = path_to_file.metadata();

                let size: usize = if let Ok(metadata) = metadata {
                    metadata.file_size() as usize
                } else {
                    0
                };

                let payload = FileChangePayload {
                    r#type: event_type,
                    attrs: event.attrs,
                    kind: event.kind,
                    paths: event.paths,
                    file_info: FileInfo {
                        name: filename.to_string(),
                        r#type: file_type.into(),
                        size: size as usize,
                    },
                };

                let _ = window.emit("changes-in-dir", payload);
            }
        }
    });
}

#[tauri::command(async)]
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

    Ok(id)
}

#[tauri::command(async)]
async fn unwatch(state: tauri::State<'_, CFSState>, id: usize) -> Result<(), String> {
    if let Some((mut watcher, path)) = state.watcher.lock().unwrap().remove(&id) {
        let path = Path::new(&path);

        watcher.unwatch(&path);

        Ok(())
    } else {
        Err("Watcher not found".into())
    }
}

#[tauri::command(async)]
fn get_disks() -> Result<Vec<DiskInfo>, String> {
    let mut sys = System::new_all();

    sys.refresh_disks();
    sys.refresh_disks_list();

    let mut disks: Vec<DiskInfo> = vec![];

    for disk in sys.disks() {
        let mount = disk.mount_point().to_str().unwrap_or("").replace("\\", "");

        disks.push(DiskInfo::new(
            mount,
            disk.name().to_str().unwrap_or("").into(),
            disk.total_space() as usize,
            disk.available_space() as usize,
        ));
    }

    Ok(disks)
}

#[tauri::command(async)]
fn read_dir(path_to_dir: String) -> Result<Vec<FileInfo>, String> {
    let path_to_dir = Path::new(&path_to_dir);

    if !path_to_dir.exists() {
        return Err("Path don't exist".into());
    }

    let files = path_to_dir.read_dir();

    if let Err(error) = files {
        let message = format!(
            "Can't get information about files in directory. Reason: {}",
            error.kind()
        );

        return Err(message);
    }

    let mut dir_entry_info: Vec<FileInfo> = vec![];

    files.unwrap().for_each(|file| {
        if let Ok(file) = file {
            let file_name = file.file_name().to_str().unwrap().to_string();
            let meta = file.metadata();

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
}

#[tauri::command(async)]
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

#[tauri::command(async)]
fn exists(path_to_file: String) -> bool {
    Path::new(&path_to_file).exists()
}

#[tauri::command(async)]
fn remove_file<R: Runtime>(window: Window<R>, path_to_file: String) -> Result<(), String> {
    let path_to_file = Path::new(&path_to_file);

    let file_name = path_to_file.file_name();
    let file_name = file_name.unwrap_or(OsStr::new("file"));
    let file_name = file_name.to_str().unwrap_or("file");

    let dialog_title = format!("Remove {file_name}");
    let dialog_message = format!("Remove {}?", file_name);

    let confirmed = dialog::blocking::confirm(Some(&window), dialog_title, dialog_message);

    if !confirmed {
        return Ok(());
    }

    match fs::remove_file(path_to_file) {
        Ok(_) => return Ok(()),
        Err(error) => return Err(format!("Can't remove file. Reason: {}", error.kind())),
    };
}

#[tauri::command(async)]
fn remove_directory<R: Runtime>(window: Window<R>, path_to_dir: String) -> Result<(), String> {
    let path_to_dir = Path::new(&path_to_dir);

    let dir_entries = path_to_dir.read_dir();

    if let Err(error) = dir_entries {
        return Err(format!(
            "Unable to read directory. Reason: {}",
            error.kind()
        ));
    }

    let is_dir_empty = dir_entries.unwrap().count() == 0;

    if !is_dir_empty {
        let file_name = path_to_dir.file_name();
        let file_name = file_name.unwrap_or(OsStr::new("folder"));
        let file_name = file_name.to_str().unwrap_or("folder");

        let dialog_title = format!("Remove {file_name}");
        let dialog_message = format!("Remove {}?", file_name);

        let confirmed = dialog::blocking::confirm(Some(&window), dialog_title, dialog_message);

        if !confirmed {
            return Ok(());
        }
    }

    match fs::remove_dir_all(path_to_dir) {
        Ok(_) => return Ok(()),
        Err(error) => return Err(format!("Can't remove directory. Reason: {}", error.kind())),
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("cfs")
        .invoke_handler(tauri::generate_handler![
            read_dir,
            watch_dir,
            get_disks,
            unwatch,
            rename,
            exists,
            remove_directory,
            remove_file
        ])
        .setup(|app| {
            // setup plugin specific state here
            app.manage(CFSState::default());
            Ok(())
        })
        .build()
}
