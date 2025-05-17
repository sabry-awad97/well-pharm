use crate::error::ConfigError;
use directories::ProjectDirs;
use std::path::PathBuf;

/// Get the application's configuration directory
pub fn get_app_config_dir() -> Result<PathBuf, ConfigError> {
    // Get the project directories using the directories crate
    // Format: (qualifier, organization, application)
    let proj_dirs = ProjectDirs::from("com", "well-pharm", "well-pharm")
        .ok_or_else(|| ConfigError::AppDir("Failed to determine app data directory".into()))?;

    // Get the config directory
    let config_dir = proj_dirs.config_dir().to_path_buf();

    Ok(config_dir)
}
