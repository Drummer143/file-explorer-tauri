use std::sync::{Arc, Condvar, Mutex};
use tauri::Runtime;

use crate::cfs::copy::copy_multiple_files::PathFromTo;

#[derive(serde::Deserialize, Clone, Copy, Debug, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum DuplicateFileAction {
    Overwrite,
    SaveBoth,
    Skip,
    Merge,
    #[default]
    Ask,
}

#[derive(serde::Deserialize, Debug, Clone, Copy)]
#[serde(rename_all = "camelCase")]
pub(super) struct DuplicateFileHandleEventPayload {
    pub(super) action: DuplicateFileAction,
    pub(super) do_for_all: bool,
}

pub(super) fn emit_duplicate_file<R: Runtime>(
    to: &str,
    from: &str,
    window: &tauri::Window<R>,
    multiple: bool,
) -> (DuplicateFileAction, bool) {
    let _ = window.emit("file-exists", (PathFromTo::new(&from, &to), multiple));

    let control_vars = Arc::new((
        Mutex::new(DuplicateFileHandleEventPayload {
            action: DuplicateFileAction::Ask,
            do_for_all: false,
        }),
        Condvar::new(),
    ));
    let control_vars_clone = control_vars.clone();

    window.once("file-exists-answer", move |e| {
        let payload_str = e.payload().unwrap();

        let payload = serde_json::from_str::<DuplicateFileHandleEventPayload>(payload_str);

        let &(ref action, ref cvar) = &*control_vars_clone;
        let mut action = action.lock().unwrap();

        if let Ok(payload) = payload {
            *action = payload;
        } else {
            println!("can't parse payload: {:#?}", payload_str);

            action.action = DuplicateFileAction::Skip;
        }

        cvar.notify_one();
    });

    let &(ref action, ref cvar) = &*control_vars;
    let mut action = action.lock().unwrap();

    while action.action == DuplicateFileAction::Ask {
        action = cvar.wait(action).unwrap();
    }

    (action.action, action.do_for_all)
}
