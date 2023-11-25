use std::cmp::Ordering;

use super::types::{FileInfo, SortOrder};

fn get_ordering(increasing: bool) -> (Ordering, Ordering) {
    if increasing {
        (Ordering::Less, Ordering::Greater)
    } else {
        (Ordering::Greater, Ordering::Less)
    }
}

fn concat_files(files: Vec<FileInfo>, folders: Vec<FileInfo>, increasing: bool) -> Vec<FileInfo> {
    if increasing {
        [folders, files].concat()
    } else {
        [files, folders].concat()
    }
}

fn sort_by_name(
    mut files: Vec<FileInfo>,
    mut folders: Vec<FileInfo>,
    increasing: bool,
) -> Vec<FileInfo> {
    let (less, greater) = get_ordering(increasing);

    files.sort_by(|a, b| {
        if a.name > b.name {
            greater
        } else if a.name < b.name {
            less
        } else {
            Ordering::Equal
        }
    });

    folders.sort_by(|a, b| {
        if a.name > b.name {
            greater
        } else if a.name < b.name {
            less
        } else {
            Ordering::Equal
        }
    });

    concat_files(files, folders, increasing)
}

fn sort_by_size(
    mut files: Vec<FileInfo>,
    folders: Vec<FileInfo>,
    increasing: bool,
) -> Vec<FileInfo> {
    let (less, greater) = get_ordering(increasing);

    files.sort_by(|a, b| {
        if a.size > b.size {
            greater
        } else if a.size < b.size {
            less
        } else {
            Ordering::Equal
        }
    });

    concat_files(files, folders, increasing)
}

pub fn sort_files(
    files: Vec<FileInfo>,
    folders: Vec<FileInfo>,
    order: SortOrder,
    increasing: bool,
) -> Vec<FileInfo> {
    match order {
        SortOrder::Name => sort_by_name(files, folders, increasing),
        SortOrder::Size => sort_by_size(files, folders, increasing),
    }
}
