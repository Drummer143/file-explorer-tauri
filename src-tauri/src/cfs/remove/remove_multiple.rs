use tauri::{api::dialog, Runtime, State, Window};

use crate::cfs::{get_file_size::get_file_size, types::ErrorMessage, CFSState};

use super::move_to_trash::move_to_trash;

#[tauri::command(async)]
pub fn remove_multiple<R: Runtime>(
    window: Window<R>,
    state: State<'_, CFSState>,
    paths: Vec<String>,
) -> Result<(), ErrorMessage> {
    let _ = crate::print_in_js(
        &window,
        &format!("multiple removing is not implemented. paths: {:#?}", paths),
    );

    let confirmed = dialog::blocking::ask(
        Some(&window),
        "Confirm action",
        format!("Remove {} files", paths.len()),
    );

    if !confirmed {
        return Ok(());
    }

    let mut sum_size: u64 = 0;

    for path in paths.clone() {
        sum_size += get_file_size(&path);
    }

    if sum_size == 0 {
        return Err(ErrorMessage::new_message("Can't remove all files"));
    }

    let trashcan_limit = state
        .app_config
        .filesystem
        .file_size_in_trashcan_limit_in_bytes as u64;

    let mut remove_permanently = true;

    if sum_size > trashcan_limit {
        remove_permanently =
            dialog::blocking::ask(Some(&window), "Confirm action", "Remove files permanently?");
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
