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

        let mut total_space = disk.total_space() as usize;
        let mut available_space = disk.available_space() as usize;
        let mut total_space_copy = total_space;

        while total_space_copy > 1024 {
            total_space_copy = total_space_copy / 1024;
            total_space = total_space / 1024 * 1000;
            available_space = available_space / 1024 * 1000;
        }

        disks.push(DiskInfo::new(
            mount,
            disk.name().to_str().unwrap_or("").into(),
            total_space,
            available_space,
        ));
    }

    Ok(disks)
}
