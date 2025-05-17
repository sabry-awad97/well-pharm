//! Application configuration settings

use crate::error::ConfigError;
use config::{Config, Environment, File};
use serde::{Deserialize, Serialize};
use std::path::Path;
use tracing::info;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct JwtConfig {
    /// Secret key for JWT signing (will be generated if not provided)
    pub secret: Option<String>,
    /// Access token expiration in minutes
    pub token_expiration_minutes: i64,
    /// Refresh token expiration in days
    pub refresh_expiration_days: i64,
}

impl Default for JwtConfig {
    fn default() -> Self {
        Self {
            secret: None,
            token_expiration_minutes: 60,
            refresh_expiration_days: 7,
        }
    }
}

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
    /// JWT configuration
    #[serde(default)]
    pub jwt: JwtConfig,
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
                Environment::with_prefix("WELL_PHARM")
                    .separator("_")
                    .try_parsing(true),
            );

        let config = config_builder.build()?;
        let settings: Settings = config.try_deserialize()?;

        Ok(settings)
    }

    /// Validate the settings
    pub fn validate(&self) -> Result<(), ConfigError> {
        // Validate database URL
        if self.database.url.is_empty() {
            return Err(ConfigError::Missing("database.url".into()));
        }

        // Validate environment
        match self.app.environment.as_str() {
            "development" | "test" | "production" => {}
            _ => {
                return Err(ConfigError::Invalid(format!(
                    "Invalid environment: {}. Must be one of: development, test, production",
                    self.app.environment
                )));
            }
        }

        Ok(())
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
                jwt: JwtConfig::default(),
            },
            database: DatabaseConfig {
                url: "postgres://postgres:postgres@localhost:5432/well_pharm".to_string(),
                max_connections: 5,
                timeout_seconds: 30,
            },
        }
    }
}
