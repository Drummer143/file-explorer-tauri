use crate::file_types::is_image;
use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use rand::random;
use std::{
    collections::HashMap,
    fs,
    os::windows::fs::MetadataExt,
    path::Path,
    sync::mpsc::{channel, Receiver},
    sync::Mutex,
    thread::spawn,
};
use sysinfo::{DiskExt, System, SystemExt};
use tauri::Window;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime, State,
};

#[derive(Default, Debug)]
pub struct MyState {
    watcher: Mutex<HashMap<usize, (RecommendedWatcher, String)>>,
}

#[derive(serde::Serialize, Debug)]
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

#[tauri::command]
pub fn watch_dir<R: Runtime>(
    window: tauri::Window<R>,
    state: State<'_, MyState>,
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

    let id = random::<u8>();

    state
        .watcher
        .lock()
        .unwrap()
        .insert(id.into(), (watcher, path_to_dir));

    Ok(id.into())
}

#[tauri::command]
pub fn get_disks() -> Result<Vec<FileInfo>, String> {
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
pub fn read_dir(path_to_dir: String) -> Result<Vec<FileInfo>, String> {
    if path_to_dir.len() == 0 {
        return get_disks();
    }

    if let Ok(files) = fs::read_dir(path_to_dir) {
        let mut file_info: Vec<FileInfo> = vec![];

        files.for_each(|file| {
            if let Ok(file) = file {
                let file_name = file.file_name().to_str().unwrap().to_string();
                let meta = fs::metadata(file.path());

                if let Ok(meta) = meta {
                    let file_type = if meta.is_dir() {
                        "directory"
                    } else {
                        if is_image(file.path().to_str().unwrap_or("")) {
                            "image"
                        } else {
                            "file"
                        }
                    };

                    file_info.push(FileInfo::new(
                        file_name,
                        file_type.into(),
                        meta.file_size() as usize,
                    ));
                }
            }
        });

        Ok(file_info)
    } else {
        Err("Can't get information about files in directory.".into())
    }
}

#[tauri::command]
fn unwatch(state: State<'_, MyState>, id: usize) -> Result<(), String> {
    println!("{}", id);
    println!("{:?}", state);
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
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("cfs")
        .invoke_handler(tauri::generate_handler![read_dir, watch_dir, get_disks, unwatch])
        .setup(|app_handle| {
            // setup plugin specific state here
            app_handle.manage(MyState::default());
            Ok(())
        })
        .build()
}
