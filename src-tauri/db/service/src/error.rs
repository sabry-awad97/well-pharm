use sea_orm::DbErr;
use thiserror::Error;

/// Custom error type for the service layer
#[derive(Error, Debug)]
pub enum ServiceError {
    /// Error related to the database connection or operations
    #[error("Database error: {0}")]
    Database(#[from] DbErr),
}
