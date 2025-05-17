use crate::error::ConfigError;
use config::{Config, Environment, File};
use serde::{Deserialize, Serialize};
use std::path::Path;
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub app: AppConfig,
    pub database: DatabaseConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub name: String,
    pub version: String,
    pub environment: String,
    pub log_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub timeout_seconds: u64,
}

impl Settings {
    pub async fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, ConfigError> {
        let path_ref = path.as_ref();
        info!("Loading config from file: {:?}", path_ref);

        let config_builder = Config::builder()
            .add_source(File::from(path_ref))
            .add_source(
                Environment::with_prefix("APP")
                    .separator("_")
                    .try_parsing(true),
            )
            .add_source(
                Environment::with_prefix("DATABASE")
                    .separator("_")
                    .try_parsing(true),
            );

        let config = config_builder.build()?;
        let settings: Settings = config.try_deserialize()?;

        // Validate required settings
        if settings.database.url.is_empty() {
            return Err(ConfigError::Missing("DATABASE_URL".to_string()));
        }

        Ok(settings)
    }
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            app: AppConfig {
                name: "well-pharm".to_string(),
                version: "0.1.0".to_string(),
                environment: "development".to_string(),
                log_level: "info".to_string(),
            },
            database: DatabaseConfig {
                url: "postgres://postgres:postgres@localhost:5432/well_pharm".to_string(),
                max_connections: 5,
                timeout_seconds: 30,
            },
        }
    }
}
