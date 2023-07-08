use sysinfo::{System, SystemExt, DiskExt};

use super::types::{DiskInfo, ErrorMessage};

#[tauri::command(async)]
pub fn get_disks() -> Result<Vec<DiskInfo>, ErrorMessage> {
    let mut sys = System::new_all();

    sys.refresh_disks();
    sys.refresh_disks_list();

    let mut disks: Vec<DiskInfo> = vec![];

    for disk in sys.disks() {
        let mount = disk.mount_point().to_str().unwrap_or("").replace("\\", "");

        disks.push(DiskInfo::new(
            mount,
            disk.name().to_str().unwrap_or("").into(),
            disk.total_space() as usize,
            disk.available_space() as usize,
        ));
    }

    Ok(disks)
}