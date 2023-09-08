use tauri::{api::dialog, Runtime, Window};

pub(crate) enum RemoveFileOptions {
    Permanent,
    Trash,
    Cancel,
}

pub(super) fn confirm_deletion<R: Runtime>(
    window: &Window<R>,
    filename: &str,
    ask_about_deletion: bool,
    ask_about_deletion_options: bool,
) -> RemoveFileOptions {
    if ask_about_deletion {
        let dialog_title = format!("Remove {filename}");
        let dialog_message = format!("Remove {}?", filename);

        let confirmed = dialog::blocking::confirm(Some(&window), dialog_title, dialog_message);

        if !confirmed {
            return RemoveFileOptions::Cancel;
        }
    }

    if ask_about_deletion_options {
        let remove_permanently = dialog::blocking::ask(
            Some(&window),
            format!("{filename} deletion"),
            format!("{filename} is too large. Remove permanently?"),
        );

        if remove_permanently {
            return RemoveFileOptions::Permanent;
        } else {
            return RemoveFileOptions::Trash;
        }
    }

    RemoveFileOptions::Trash
}
