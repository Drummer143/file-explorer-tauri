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
enum FileTypes {
    Disk,
    File,
    Folder,
    Image,
}

#[derive(Default, Debug)]
struct CFSState {
    watcher: Mutex<HashMap<usize, (RecommendedWatcher, String)>>,
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ErrorMessage {
    message: Option<String>,
    error: Option<String>,
}

impl ErrorMessage {
    pub fn new_all(message: String, reason: String) -> Self {
        Self {
            message: Some(message),
            error: Some(reason),
        }
    }

    pub fn new_reason(reason: String) -> Self {
        Self {
            message: None,
            error: Some(reason),
        }
    }

    pub fn new_message(message: String) -> Self {
        Self {
            message: Some(message),
            error: None,
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct DiskInfo {
    mount_point: String,
    name: String,
    r#type: FileTypes,
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
            r#type: FileTypes::Disk,
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct FileInfo {
    name: String,
    r#type: FileTypes,
    size: usize,
    is_removable: bool,
}

impl FileInfo {
    pub fn new(name: String, r#type: FileTypes, size: usize, is_removable: bool) -> FileInfo {
        FileInfo {
            name,
            r#type,
            size,
            is_removable,
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct FileChangePayload {
    r#type: FileChangeEventType,
    kind: NotifyEventKind,
    paths: Vec<PathBuf>,
    attrs: EventAttributes,
    name: String,
    file_info: Option<FileInfo>,
}

const DISPLAYABLE_IMAGE_EXTENSIONS: [&str; 13] = [
    "jpg", "jpeg", "jpe", "jif", "jfif", "jfi", "webp", "png", "gif", "svg", "svgz", "bmp", "dib",
];

fn get_file_type(path_to_file: &Path) -> FileTypes {
    if path_to_file.is_dir() {
        return FileTypes::Folder;
    }

    let extension = path_to_file
        .extension()
        .and_then(OsStr::to_str)
        .unwrap_or("");

    if DISPLAYABLE_IMAGE_EXTENSIONS.contains(&extension) {
        return FileTypes::Image;
    }

    FileTypes::File
}

fn watch<R: Runtime>(window: Window<R>, rx: Receiver<notify::Result<NotifyEvent>>, id: usize) {
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

                let file_type = get_file_type(path_to_file);

                let metadata = path_to_file.metadata();
                let mut file_info: Option<FileInfo> = None;

                if let Ok(metadata) = metadata {
                    let size = metadata.file_size() as usize;
                    let is_removable = !metadata.permissions().readonly();

                    file_info = Some(FileInfo {
                        name: filename.to_string(),
                        r#type: file_type.into(),
                        is_removable,
                        size,
                    });
                }

                let payload = FileChangePayload {
                    r#type: event_type,
                    attrs: event.attrs,
                    kind: event.kind,
                    paths: event.paths,
                    name: filename.to_string(),
                    file_info,
                };

                let event_name = format!("changes-in-dir/{id}");

                let _ = window.emit(&event_name, payload);
            }
        }
    });
}

#[tauri::command(async)]
fn watch_dir<R: Runtime>(
    window: tauri::Window<R>,
    state: State<'_, CFSState>,
    path_to_dir: String,
) -> Result<usize, ErrorMessage> {
    let path = Path::new(&path_to_dir);

    if !path.exists() {
        return Err(ErrorMessage::new_message("Directory doesn't exist.".into()));
    }

    let (tx, rx) = channel();
    let watcher = RecommendedWatcher::new(tx, Config::default());

    if let Err(error) = watcher {
        return Err(ErrorMessage::new_all(
            "Can't create watcher".into(),
            error.to_string(),
        ));
    }

    let mut watcher = watcher.unwrap();

    let id: usize = random::<u8>().into();

    let result = watcher.watch(path, RecursiveMode::NonRecursive);
    watch(window, rx, id);

    if let Err(error) = result {
        return Err(ErrorMessage::new_all(
            "Error while trying to create watcher.".into(),
            error.to_string(),
        ));
    }

    state
        .watcher
        .lock()
        .unwrap()
        .insert(id, (watcher, path_to_dir));

    Ok(id)
}

#[tauri::command(async)]
async fn unwatch(state: tauri::State<'_, CFSState>, id: usize) -> Result<(), ErrorMessage> {
    if let Some((mut watcher, path)) = state.watcher.lock().unwrap().remove(&id) {
        let path = Path::new(&path);

        let res = watcher.unwatch(&path);

        match res {
            Ok(_) => return Ok(()),
            Err(error) => return Err(ErrorMessage::new_reason(error.to_string())),
        }
    } else {
        Err(ErrorMessage::new_message("Watcher not found".into()))
    }
}

#[tauri::command(async)]
fn get_disks() -> Result<Vec<DiskInfo>, ErrorMessage> {
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
fn read_dir(path_to_dir: String) -> Result<Vec<FileInfo>, ErrorMessage> {
    let path_to_dir = Path::new(&path_to_dir);

    if !path_to_dir.exists() {
        return Err(ErrorMessage::new_message("Path don't exist".into()));
    }

    let files = path_to_dir.read_dir();

    if let Err(error) = files {
        return Err(ErrorMessage::new_all(
            "Can't get information about files in directory.".into(),
            error.to_string(),
        ));
    }

    let mut dir_entry_info: Vec<FileInfo> = vec![];

    files.unwrap().for_each(|file| {
        if let Ok(file) = file {
            let file_name = file.file_name().to_str().unwrap().to_string();
            let meta = file.metadata().unwrap();

            let is_hidden = (meta.file_attributes() & 0x2) > 0;

            if !is_hidden {
                let file_type = get_file_type(&file.path());

                dir_entry_info.push(FileInfo::new(
                    file_name,
                    file_type.into(),
                    meta.file_size() as usize,
                    meta.permissions().readonly(),
                ));
            }
        }
    });

    Ok(dir_entry_info)
}

#[tauri::command(async)]
fn rename(old_name: String, new_name: String) -> Result<(), ErrorMessage> {
    let old_path = Path::new(&old_name);
    let new_path = Path::new(&new_name);

    if !old_path.exists() {
        return Err(ErrorMessage::new_message("File doesn't exist".into()));
    }

    if new_path.exists() {
        return Err(ErrorMessage::new_message(
            "A file with given name already exists".into(),
        ));
    }

    let result = fs::rename(old_path, new_path);

    match result {
        Ok(_) => Ok(()),
        Err(error) => Err(ErrorMessage::new_all(
            "Can't rename".into(),
            error.kind().to_string(),
        )),
    }
}

#[tauri::command(async)]
fn exists(path_to_file: String) -> bool {
    Path::new(&path_to_file).exists()
}

#[tauri::command(async)]
fn remove_file<R: Runtime>(window: Window<R>, path_to_file: String) -> Result<(), ErrorMessage> {
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
        Err(error) => {
            return Err(ErrorMessage::new_all(
                "Can't remove file.".into(),
                error.to_string(),
            ))
        }
    };
}

#[tauri::command(async)]
fn remove_directory<R: Runtime>(window: Window<R>, path: String) -> Result<(), ErrorMessage> {
    let path_to_dir = Path::new(&path);

    let dir_entries = path_to_dir.read_dir();

    if let Err(error) = dir_entries {
        return Err(ErrorMessage::new_all(
            "Unable to read directory.".into(),
            error.to_string(),
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

    let meta = fs::metadata(path_to_dir).unwrap();

    println!("{}", meta.permissions().readonly());

    match fs::remove_dir_all(path_to_dir) {
        Ok(_) => return Ok(()),
        Err(error) => {
            // if error.raw_os_error().unwrap_or(-1) == 5 {
            //     let output = Command::new("cmd")
            //         .args(&[
            //             "/C",
            //             "runas",
            //             "/user:Administrator",
            //             "cmd.exe",
            //             "/C",
            //             "del",
            //             &path,
            //         ])
            //         .output()
            //         .expect("Failed to execute command.");
            //     if output.status.success() {
            //         return Ok(());
            //     } else {
            //         let a = if !!output.stdout.is_empty() {
            //             output.stdout
            //         } else {
            //             output.stderr
            //         };
            //         let message = format!(
            //             "Error deleting file with administrator rights. Reason: {:#?}",
            //             a
            //         );

            //         return Err(message);
            //     }
            // } else {
            return Err(ErrorMessage::new_all(
                "Can't remove directory.".into(),
                error.to_string(),
            ));
            // }
        }
    }
}

#[tauri::command(async)]
fn remove<R: Runtime>(window: Window<R>, path_to_file: String) -> Result<(), ErrorMessage> {
    let path = Path::new(&path_to_file);

    if path.is_dir() {
        remove_directory(window, path_to_file)
    } else if path.is_file() {
        remove_file(window, path_to_file)
    } else {
        let filename = path.file_name().unwrap().to_string_lossy();

        let message = format!("{} is not removable", filename);

        Err(ErrorMessage::new_message(message))
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("cfs")
        .invoke_handler(tauri::generate_handler![
            remove_directory,
            remove_file,
            watch_dir,
            get_disks,
            read_dir,
            unwatch,
            rename,
            exists,
            remove
        ])
        .setup(|app| {
            // setup plugin specific state here
            app.manage(CFSState::default());
            Ok(())
        })
        .build()
}
