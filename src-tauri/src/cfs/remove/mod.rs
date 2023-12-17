mod confirm_deletion;
mod move_to_trash;
mod remove_directory;
mod remove_file;
mod remove_multiple;

pub use self::{
    remove_directory::{__cmd__remove_directory, remove_directory},
    remove_file::{__cmd__remove_file, remove_file},
    remove_multiple::{__cmd__remove_multiple, remove_multiple},
};
