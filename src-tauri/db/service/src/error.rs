//! Error types for the service layer

use sea_orm::DbErr;
use thiserror::Error;

/// Custom error type for the service layer
#[derive(Error, Debug)]
pub enum ServiceError {
    /// Database connection error
    #[error("Database error: {0}")]
    Database(#[from] DbErr),

    /// Configuration error
    #[error("Invalid value: {0}")]
    InvalidValue(String),

    /// I/O error
    #[error("Io error: {0}")]
    Io(#[from] std::io::Error),

    /// Command error
    #[error("Command error: {0}")]
    Command(String),

    /// Operation not permitted
    #[error("Operation not permitted: {0}")]
    OperationNotPermitted(String),

    /// Authentication error
    #[error("Authentication error: {0}")]
    AuthenticationError(String),

    /// Authorization error
    #[error("Authorization error: {0}")]
    AuthorizationError(String),
}
