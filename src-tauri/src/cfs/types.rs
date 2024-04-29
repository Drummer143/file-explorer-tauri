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
pub enum FileSubtype {
    Image,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum FileType {
    Disk,
    File,
    Folder,
    Unknown,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ErrorMessage {
    pub message: Option<String>,
    pub error: Option<String>,
}

impl ErrorMessage {
    pub fn new_all(message: &str, reason: &str) -> Self {
        Self {
            message: Some(message.into()),
            error: Some(reason.into()),
        }
    }

    pub fn new_reason(reason: &str) -> Self {
        Self {
            message: None,
            error: Some(reason.into()),
        }
    }

    pub fn new_message(message: &str) -> Self {
        Self {
            message: Some(message.into()),
            error: None,
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DiskInfo {
    pub mount_point: String,
    pub name: String,
    pub r#type: FileType,
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
            r#type: FileType::Disk,
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
    pub name: String,
    pub r#type: FileType,
    pub size: usize,
    pub readonly: bool,
    pub ext: Option<String>,
    pub subtype: Option<FileSubtype>,
}

impl FileInfo {
    pub fn new(
        name: String,
        r#type: FileType,
        size: usize,
        readonly: bool,
        subtype: Option<FileSubtype>,
        ext: Option<String>,
    ) -> Self {
        Self {
            name,
            r#type,
            size,
            readonly,
            subtype,
            ext,
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

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct NotificationConfig {
    pub limit: usize,
    pub tickspeed_ms: usize,
    pub lifetime_ms: usize,
}

impl Default for NotificationConfig {
    fn default() -> Self {
        Self {
            limit: 5,
            tickspeed_ms: 200,
            lifetime_ms: 10000,
        }
    }
}

#[derive(serde::Deserialize, serde::Serialize, Debug, PartialEq, Clone, Copy)]
#[serde(rename_all = "camelCase")]
pub enum SortOrder {
    Name,
    Size,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone, Copy)]
pub struct SortConfig {
    pub increasing: bool,
    pub order: SortOrder,
}

#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct FilesystemConfig {
    pub file_size_in_trashcan_limit_in_bytes: usize,
    pub copy_speed_limit_bytes_per_second: usize,
    pub copy_buffer_size_bytes: usize,
    pub sort_config: SortConfig,
}

impl Default for FilesystemConfig {
    fn default() -> Self {
        Self {
            file_size_in_trashcan_limit_in_bytes: 10485760,
            copy_speed_limit_bytes_per_second: 12582912,
            copy_buffer_size_bytes: 65536,
            sort_config: SortConfig {
                increasing: true,
                order: SortOrder::Name,
            },
        }
    }
}

#[derive(Default, serde::Deserialize, serde::Serialize, Clone, Debug)]
pub struct AppSettings {
    pub notification: NotificationConfig,
    pub filesystem: FilesystemConfig,
}

#[derive(PartialEq, Clone, Copy, Debug)]
pub enum CopyActions {
    Pause,
    Exit,
    Run,
}

impl CopyActions {
    pub fn from_window_event_payload(s: &str) -> Result<Self, ()> {
        let lowercased: &str = &s.to_ascii_lowercase();

        match lowercased {
            "\"exit\"" => Ok(CopyActions::Exit),
            "\"pause\"" => Ok(CopyActions::Pause),
            "\"run\"" => Ok(CopyActions::Run),
            _ => Err(()),
        }
    }
}

#[derive(PartialEq)]
pub enum CopyResult {
    Ok,
    Stop,
    Error(ErrorMessage),
}
