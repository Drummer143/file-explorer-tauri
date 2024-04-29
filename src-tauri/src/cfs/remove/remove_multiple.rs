use tauri::{Runtime, State, Window};
use tauri_plugin_dialog::DialogExt;

use crate::{cfs::{get_file_size::get_file_size, types::ErrorMessage}, AppState};

use super::move_to_trash::move_to_trash;

#[tauri::command(async)]
pub fn remove_multiple<R: Runtime>(
    window: Window<R>,
    state: State<'_, AppState>,
    paths: Vec<String>,
) -> Result<(), ErrorMessage> {
    let confirmed = window
        .dialog()
        .message(format!("Remove {} files", paths.len()))
        .title("Confirm action")
        .blocking_show();

    if !confirmed {
        return Ok(());
    }

    let mut sum_size: isize = -1;

    for path in paths.clone() {
        sum_size += get_file_size(&path) as isize;
    }

    if sum_size == -1 {
        return Err(ErrorMessage::new_message("Can't remove all files"));
    }

    let sum_size = sum_size as usize;
    let trashcan_limit = state
        .app_config
        .filesystem
        .file_size_in_trashcan_limit_in_bytes;

    let mut remove_permanently = true;

    if sum_size > trashcan_limit {
        remove_permanently = window
            .dialog()
            .message("Remove files permanently?")
            .title("Confirm action")
            .blocking_show();
    }

    for path in paths {
        if remove_permanently {
            let _ = crate::raw_fs::remove(&path);
        } else {
            let _ = move_to_trash(&path);
        }
    }

    Ok(())
}
