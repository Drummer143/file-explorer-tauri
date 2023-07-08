use std::path::Path;
use tauri::{Runtime, Window};

use super::types::{CopyCutProgress, ErrorMessage};

#[tauri::command(async)]
pub fn copy_file<R: Runtime>(
    window: Window<R>,
    from: String,
    to: String,
) -> Result<(), ErrorMessage> {
    let path_from = Path::new(&from);
    let path_to = Path::new(&to);

    // TODO: to check if file with exists in `to`

    if path_from.is_file() {
        let options = fs_extra::file::CopyOptions::new();

        let result = fs_extra::file::copy_with_progress(path_from, path_to, &options, |progress| {
            window
                .emit(
                    "copy-progress",
                    CopyCutProgress {
                        done: progress.copied_bytes as usize,
                        total: progress.total_bytes as usize,
                    },
                )
                .unwrap(); // FIXME: ?
        });

        match result {
            Ok(res) => {
                window.emit("copy-finished", res).unwrap(); // FIXME: ?
                Ok(())
            }
            Err(error) => {
                window.emit("copy-finished", -1).unwrap(); // FIXME: ?

                Err(ErrorMessage::new_all(
                    "Error while copying files".into(),
                    error.to_string(),
                ))
            }
        }
    } else {
        return Err(ErrorMessage::new_message("it is not file".into()));
    }
}
