use std::path::PathBuf;

use crate::cfs::types::AppSettings;

// pub fn create_js_init(app_config: &str) -> String {
//     format!(
//         r#"
// console.log("log from js init script in rust");

// window.AppSettings = {};

// console.log(window.AppSettings, typeof window.AppSettings);
// "#,
//         app_config
//     )
// }

pub fn init(config_dir: &PathBuf) -> AppSettings {
    if !config_dir.exists() {
        if let Err(error) = std::fs::create_dir_all(config_dir) {
            println!("can't create config dir {}", error.to_string());
        }
    }

    let path_to_app_config = config_dir.join(&super::APP_CONFIG_NAME);

    let data: String;

    if !path_to_app_config.exists() {
        data = String::from("{}");

        let result = std::fs::write(&path_to_app_config, &data);

        if let Err(error) = result {
            println!("can't write file {}", error.to_string());
        }
    } else {
        let result = std::fs::read_to_string(&path_to_app_config);

        match result {
            Ok(str) => {
                if str.len() == 0 {
                    data = String::from("{}");
                } else {
                    data = str;
                }
            }
            Err(error) => {
                println!("error on reading config: {}", error.to_string());

                return AppSettings::default();
            }
        }
    }

    let result = serde_json::from_str::<AppSettings>(&data);

    let app_config: AppSettings = match result {
        Ok(c) => c,
        Err(error) => {
            println!("Error on parsing app config: {}", error);

            let config = AppSettings::default();
            let result = serde_json::to_string_pretty(&config);

            if let Ok(string) = result {
                let _ = std::fs::write(path_to_app_config, string);
            }

            config
        }
    };

    app_config
}
