use std::sync::{Arc, Condvar, Mutex};
use tauri::Runtime;

#[derive(serde::Deserialize, Clone, Debug, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum DuplicateFileAction {
    Overwrite,
    SaveBoth,
    Skip,
    Merge,
    #[default]
    Ask,
}

pub(super) enum HandleDuplicateFileAnswer {
    Merge,
    New(String),
    Skip,
    Error(ErrorMessage)
}

use crate::cfs::{
    add_index_to_filename, copy::copy_multiple_files::PathFromTo, types::ErrorMessage,
};

pub(super) fn handle_duplicate_file<R: Runtime>(
    to: &str,
    from: &str,
    window: &tauri::Window<R>,
) -> HandleDuplicateFileAnswer {
    let _ = window.emit("file-exists", PathFromTo::new(&from, &to));

    let control_vars = Arc::new((Mutex::new(DuplicateFileAction::Ask), Condvar::new()));
    let control_vars_clone = control_vars.clone();

    window.once("file-exists-answer", move |e| {
        let payload_str = e.payload().unwrap();

        let payload = serde_json::from_str::<DuplicateFileAction>(payload_str);

        let &(ref action, ref cvar) = &*control_vars_clone;
        let mut action = action.lock().unwrap();

        if let Ok(payload) = payload {
            *action = payload;
        } else {
            println!("can't parse payload: {:#?}", payload_str);

            *action = DuplicateFileAction::Skip;
        }

        cvar.notify_one();
    });

    let &(ref action, ref cvar) = &*control_vars;
    let mut action = action.lock().unwrap();

    while *action == DuplicateFileAction::Ask {
        action = cvar.wait(action).unwrap();
    }

    match *action {
        DuplicateFileAction::Overwrite => {
            let result = crate::raw_fs::remove(to.into());

            match result {
                Err(error) => return HandleDuplicateFileAnswer::Error(error),
                Ok(_) => return HandleDuplicateFileAnswer::New(to.into()),
            }
        }
        DuplicateFileAction::SaveBoth => {
            let result = add_index_to_filename(to.into());

            match result {
                Err(error) => return HandleDuplicateFileAnswer::Error(error),
                Ok(to) => return HandleDuplicateFileAnswer::New(to),
            }
        }
        DuplicateFileAction::Ask => return HandleDuplicateFileAnswer::Skip,
        DuplicateFileAction::Skip => return HandleDuplicateFileAnswer::Skip,
        DuplicateFileAction::Merge => return HandleDuplicateFileAnswer::Merge
    }
}
