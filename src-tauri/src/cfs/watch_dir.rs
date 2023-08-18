use notify::{
    Config, Event as NotifyEvent, EventKind as NotifyEventKind, RecommendedWatcher, RecursiveMode,
    Watcher,
};
use rand::random;
use std::{
    borrow::Cow,
    ffi::OsStr,
    os::windows::prelude::MetadataExt,
    path::{Path, PathBuf},
    sync::mpsc::{channel, Receiver},
    thread::spawn,
};
use tauri::{Runtime, State, Window};

use super::{
    get_file_type,
    types::{ErrorMessage, FileChangeEventType, FileChangePayload, FileInfo},
    CFSState, get_file_subtype,
};

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

                let filename: Cow<'_, str> = path_to_file
                    .file_name()
                    .unwrap_or(OsStr::new(""))
                    .to_string_lossy();

                
                let metadata = path_to_file.metadata();
                let mut file_info: Option<FileInfo> = None;
                
                if let Ok(metadata) = metadata {
                    file_info = Some(FileInfo::new(
                        filename.to_string(),
                        get_file_type(path_to_file),
                        metadata.file_size() as usize,
                        metadata.permissions().readonly(),
                        get_file_subtype(path_to_file),
                    ));
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
pub fn watch_dir<R: Runtime>(
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
pub fn unwatch(state: tauri::State<'_, CFSState>, id: usize) -> Result<(), ErrorMessage> {
    if let Some((mut watcher, path)) = state.watcher.lock().unwrap().remove(&id) {
        let path = Path::new(&path);

        let res = watcher.unwatch(&path);

        match res {
            Ok(_) => return Ok(()),
            Err(error) => return Err(ErrorMessage::new_reason(error.to_string())),
        }
    } else {
        // Err(ErrorMessage::new_message("Watcher not found".into()))
        Ok(())
    }
}
