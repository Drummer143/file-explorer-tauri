use crate::cfs::types::ErrorMessage;

pub fn move_to_trash(path_to_file: &str) -> Result<(), ErrorMessage> {
    match trash::delete(path_to_file) {
        Ok(_) => return Ok(()),
        Err(error) => {
            return Err(ErrorMessage::new_all(
                "Can't remove file.",
                &error.to_string(),
            ))
        }
    }
}
