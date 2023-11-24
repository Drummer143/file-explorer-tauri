use super::AppConfig;

pub fn init(config: &tauri::Config, app_config_name: &str) -> (String, AppConfig) {
    let config_dir = tauri::api::path::app_config_dir(&config);

    let create_js_init = |app_config: &str| {
        format!(
            r#"
console.log("log from js init script in rust");

window.c = {};

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

    if config_dir.is_none() {
        return create_default_values();
    }

    let config_dir = config_dir.unwrap();
    let config_dir = config_dir.as_path();

    let path_to_app_config = config_dir.join(app_config_name);

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
