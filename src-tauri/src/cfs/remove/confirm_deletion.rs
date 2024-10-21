use tauri::{Runtime, Window};
use tauri_plugin_dialog::DialogExt;

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

        let confirmed = window
            .dialog()
            .message(dialog_message)
            .cancel_button_label("Cancel")
            .kind(tauri_plugin_dialog::MessageDialogKind::Warning)
            .ok_button_label("Remove")
            .title(dialog_title)
            .blocking_show();

        if !confirmed {
            return RemoveFileOptions::Cancel;
        }
    }

    if ask_about_deletion_options {
        let remove_permanently = window
            .dialog()
            .message(format!("{filename} deletion"))
            .cancel_button_label("Cancel")
            .kind(tauri_plugin_dialog::MessageDialogKind::Warning)
            .ok_button_label("Remove permanently")
            .title(format!("{filename} is too large. Remove permanently?"))
            .blocking_show();

        if remove_permanently {
            return RemoveFileOptions::Permanent;
        } else {
            return RemoveFileOptions::Trash;
        }
    }

    RemoveFileOptions::Trash
}
