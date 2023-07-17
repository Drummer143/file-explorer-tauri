#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub enum FileChangeEventType {
    Access,
    Any,
    Create,
    Modify,
    Remove,
    Other,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub enum FileTypes {
    Disk,
    File,
    Folder,
    Image,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ErrorMessage {
    pub message: Option<String>,
    pub error: Option<String>,
}

impl ErrorMessage {
    pub fn new_all(message: String, reason: String) -> Self {
        Self {
            message: Some(message),
            error: Some(reason),
        }
    }

    pub fn new_reason(reason: String) -> Self {
        Self {
            message: None,
            error: Some(reason),
        }
    }

    pub fn new_message(message: String) -> Self {
        Self {
            message: Some(message),
            error: None,
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DiskInfo {
    pub mount_point: String,
    pub name: String,
    pub r#type: FileTypes,
    pub total_space: usize,
    pub available_space: usize,
}

impl DiskInfo {
    pub fn new(
        mount_point: String,
        name: String,
        total_space: usize,
        available_space: usize,
    ) -> Self {
        Self {
            mount_point,
            name,
            total_space,
            available_space,
            r#type: FileTypes::Disk,
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
    pub name: String,
    pub r#type: FileTypes,
    pub size: usize,
    pub is_removable: bool,
}

impl FileInfo {
    pub fn new(name: String, r#type: FileTypes, size: usize, is_removable: bool) -> FileInfo {
        FileInfo {
            name,
            r#type,
            size,
            is_removable,
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FileChangePayload {
    pub r#type: FileChangeEventType,
    pub kind: notify::EventKind,
    pub paths: Vec<std::path::PathBuf>,
    pub attrs: notify::event::EventAttributes,
    pub name: String,
    pub file_info: Option<FileInfo>,
}

#[derive(Clone, serde::Serialize)]
pub struct CopyCutProgress {
    pub total: usize,
    pub done: usize,
}