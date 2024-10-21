interface NotificationConfig {
    limit: number;
    tickspeed_ms: number;
    lifetime_ms: number;
}

type SortOrder = "name" | "size";

interface SortConfig {
    order: SortOrder;
    increasing: boolean;
}

interface FilesystemConfig {
    file_size_in_trashcan_limit_in_bytes: number;
    copy_speed_limit_bytes_per_second: number;
    copy_buffer_size_bytes: number;
    sort_config: SortConfig;
}

interface AppConfig {
    notification: NotificationConfig;
    filesystem: FilesystemConfig;
}
