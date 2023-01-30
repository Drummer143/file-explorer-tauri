use std::{path::Path, ffi::OsStr};

const IMAGE_EXTENSIONS: [&str; 3] = ["png", "jpg", "jpeg"];

pub fn is_image(path_to_file: &str) -> bool {
    let p = Path::new(path_to_file);

    if p.exists() {
        let ext = p.extension().and_then(OsStr::to_str).unwrap_or("empty");

        IMAGE_EXTENSIONS.contains(&ext)
    } else {
        println!("file does not exist");

        false
    }
}