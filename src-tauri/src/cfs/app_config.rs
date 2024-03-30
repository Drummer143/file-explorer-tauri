use std::path::PathBuf;

use super::AppConfig;

pub fn init(config_dir: Option<PathBuf>) -> (String, AppConfig) {
    let create_js_init = |app_config: &str| {
        format!(
            r#"
console.log("log from js init script in rust");

window.appConfig = {};

console.log(window.appConfig, typeof window.appConfig);
"#,
            app_config
        )
    };

    let create_default_values = || {
        let default_config = AppConfig::default();
        let str_config = serde_json::to_string(&default_config).unwrap();

        (create_js_init(&str_config), default_config)
    };

    println!("config_dir_is_none: {:?}", config_dir.is_none());

    if config_dir.is_none() {
        return create_default_values();
    }

    let config_dir = config_dir.unwrap();
    let config_dir = config_dir.as_path();

    println!("config_dir: {:?}", config_dir);

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

                return create_default_values();
            }
        }
    }

    let result = serde_json::from_str::<AppConfig>(&data);

    let app_config: AppConfig = match result {
        Ok(c) => c,
        Err(error) => {
            println!("Error on parsing app config: {}", error);

            let config = AppConfig::default();
            let result = serde_json::to_string_pretty(&config);

            if let Ok(string) = result {
                let _ = std::fs::write(path_to_app_config, string);                
            }

            config
        }
    };

    (create_js_init(&data), app_config)
}
