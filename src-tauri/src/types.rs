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

type AppResult<T> = Result<T, ErrorMessage>;

#[derive(serde::Deserialize, serde::Serialize, Debug)]
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

#[derive(serde::Deserialize, serde::Serialize, Debug)]
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

#[derive(Default, serde::Deserialize, serde::Serialize, Debug)]
pub struct AppConfig {
    pub notification: NotificationConfig,
    pub filesystem: FilesystemConfig,
}
