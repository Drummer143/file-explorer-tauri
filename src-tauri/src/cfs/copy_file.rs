use std::path::Path;
use tauri::{Runtime, Window};

use super::types::{CopyCutProgress, ErrorMessage};

#[derive(serde::Deserialize)]
pub struct CopyOptions {
    pub overwrite: bool,
    pub skip_exist: bool,
}

#[tauri::command(async)]
pub fn copy_file<R: Runtime>(
    window: Window<R>,
    from: String,
    to: String,
    copy_options: CopyOptions,
) -> Result<(), ErrorMessage> {
    let path_from = Path::new(&from);
    let path_to = Path::new(&to);

    if copy_options.overwrite && path_to.exists() {
        let result: Result<(), std::io::Error>;

        if path_to.is_file() {
            result = std::fs::remove_file(path_to);
        } else {
            result = std::fs::remove_dir_all(path_to);
        }

        if let Err(error) = result {
            return Err(ErrorMessage::new_all(
                "Can't overwrite file".into(),
                error.to_string(),
            ));
        }
    }

    let options = fs_extra::file::CopyOptions::new()
        .skip_exist(copy_options.skip_exist)
        .overwrite(copy_options.overwrite);

    // println!(
    //     "overwrite: {}, skip_exist: {}",
    //     options.overwrite, options.skip_exist
    // );
    // let options = options
    //     .overwrite(copy_options.overwrite)
    //     .skip_exist(copy_options.skip_exist);
    // println!(
    //     "overwrite: {}, skip_exist: {}",
    //     options.overwrite, options.skip_exist
    // );

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
}
