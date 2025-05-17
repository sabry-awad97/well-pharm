mod app_dir;
mod error;
mod settings;

use app_dir::get_app_config_dir;
pub use error::ConfigError;
pub use settings::{AppConfig, DatabaseConfig, Settings};
use tracing::info;

use std::path::{Path, PathBuf};

/// Get the path to the config file in the app data directory
pub fn get_config_file_path() -> Result<PathBuf, ConfigError> {
    let app_config_dir = get_app_config_dir()?;
    Ok(app_config_dir.join("config.toml"))
}

/// Load application configuration from various sources with priority:
/// 1. User config file in app data directory
/// 2. Environment variables
/// 3. Default config file in project
pub async fn load() -> Result<Settings, ConfigError> {
    let config_path = get_config_file_path()?;

    // Check if the config file exists in the app data directory
    if !config_path.exists() {
        info!(
            "Config file not found at {:?}, creating default config",
            config_path
        );
        create_default_config(&config_path).await?;
    }

    // Load from the app data directory config file
    info!("Loading config from {:?}", config_path);
    Settings::from_file(&config_path).await
}

/// Load application configuration from a specific file path
pub async fn load_from_file<P: AsRef<Path>>(path: P) -> Result<Settings, ConfigError> {
    Settings::from_file(path).await
}

/// Create a default configuration file at the specified path
async fn create_default_config(path: &Path) -> Result<(), ConfigError> {
    // Ensure the parent directory exists
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    // Create default settings
    let default_settings = Settings::default();

    // Serialize to TOML
    let toml_content = toml::to_string(&default_settings)
        .map_err(|e| ConfigError::Serialization(e.to_string()))?;

    // Write to file
    tokio::fs::write(path, toml_content).await?;

    info!("Created default config file at {:?}", path);
    Ok(())
}

/// Save configuration to the app data directory
pub async fn save_config(settings: &Settings) -> Result<(), ConfigError> {
    let config_path = get_config_file_path()?;

    // Serialize to TOML
    let toml_content =
        toml::to_string(settings).map_err(|e| ConfigError::Serialization(e.to_string()))?;

    // Ensure the parent directory exists
    if let Some(parent) = config_path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    // Write to file
    tokio::fs::write(&config_path, toml_content).await?;

    info!("Saved config to {:?}", config_path);
    Ok(())
}

