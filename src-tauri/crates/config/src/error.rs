use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("Failed to load configuration: {0}")]
    Load(String),

    #[error("Missing required configuration value: {0}")]
    Missing(String),

    #[error("Invalid configuration value: {0}")]
    Invalid(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Environment variable error: {0}")]
    Env(#[from] std::env::VarError),

    #[error("Config error: {0}")]
    Config(#[from] config::ConfigError),

    #[error("App directory error: {0}")]
    AppDir(String),

    #[error("Serialization error: {0}")]
    Serialization(String),
}
