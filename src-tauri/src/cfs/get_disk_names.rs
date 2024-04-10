use sysinfo::{DiskExt, System, SystemExt};

use super::types::ErrorMessage;

#[tauri::command]
pub fn get_disk_names() -> Result<Vec<String>, ErrorMessage> {
    let mut sys = System::new_all();

    sys.refresh_disks();
    sys.refresh_disks_list();

    let mut disks: Vec<String> = vec![];

    for disk in sys.disks() {
        let mount = disk.mount_point().to_str().unwrap_or("").replace("\\", "");

        disks.push(mount);
    }

    Ok(disks)
}