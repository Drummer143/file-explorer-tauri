use std::cmp::Ordering;

use super::types::{FileInfo, SortOrder};

pub fn sort_files(mut files: Vec<FileInfo>, order: SortOrder, increasing: bool) -> Vec<FileInfo> {
    let comparator: fn(&FileInfo, &FileInfo) -> Ordering = match order {
        SortOrder::Name => |a, b| {
            if a.name > b.name {
                Ordering::Greater
            } else if a.name < b.name {
                Ordering::Less
            } else {
                Ordering::Equal
            }
        },
        SortOrder::Size => |a, b| {
            if a.size > b.size {
                Ordering::Greater
            } else if a.size < b.size {
                Ordering::Less
            } else {
                Ordering::Equal
            }
        },
    };

    files.sort_by(comparator);

    if !increasing {
        files.reverse();
    }

    files
}
