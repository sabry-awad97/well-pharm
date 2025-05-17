use sea_orm::DbErr;
use thiserror::Error;

/// Custom error type for the service layer
#[derive(Error, Debug)]
pub enum ServiceError {
    ///
    #[error("Database error: {0}")]
    Database(#[from] DbErr),

    ///
    #[error("Invalid value: {0}")]
    InvalidValue(String),

    ///
    #[error("Io error: {0}")]
    IO(#[from] std::io::Error),

    ///
    #[error("Command error: {0}")]
    Command(String),
}
