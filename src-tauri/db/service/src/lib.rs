//! A library for managing services in the pharmacy management system.

#![deny(missing_docs)]

use std::sync::Arc;

use derive_getters::Getters;
use sea_orm::{Database, DatabaseConnection};
use typed_builder::TypedBuilder;

mod error;
pub use error::ServiceError;

/// ServiceManager is the central service coordinator for the pharmacy management system.
/// It maintains thread-safe references to all service implementations and manages their lifecycle.
///
/// # Thread Safety
/// All services are wrapped in [`Arc`] (Atomic Reference Counting) to ensure thread-safe sharing
/// across multiple parts of the application.
///
#[derive(Clone, Getters, TypedBuilder)]
pub struct ServiceManager {}

impl ServiceManager {
    /// Creates a new instance of ServiceManager with all required services.
    ///
    /// This method initializes all service implementations with a shared database connection.
    /// The connection is wrapped in an Arc to allow safe sharing across services.
    ///
    /// # Arguments
    /// * `db` - Thread-safe reference to the database connection
    ///
    /// # Returns
    /// * `Result<Self, ServiceError>` - New ServiceManager instance or error if initialization fails
    ///
    /// # Errors
    /// Returns `ServiceError` if any service initialization fails
    async fn try_new(_db: Arc<DatabaseConnection>) -> Result<Self, ServiceError> {
        // Initialize services here

        Ok(Self::builder().build())
    }
}

/// Creates and initializes a new ServiceManager with all required services.
///
/// This function serves as the main entry point for setting up the service layer.
/// It establishes the database connection and initializes the ServiceManager.
///
/// # Arguments
/// * `url` - Database connection URL string
///
/// # Returns
/// * `Result<ServiceManager, ServiceError>` - Initialized ServiceManager or error
///
/// # Errors
/// Returns `ServiceError` if:
/// - Database connection fails
/// - Service initialization fails
///
pub async fn setup_services(db: &Arc<DatabaseConnection>) -> Result<ServiceManager, ServiceError> {
    ServiceManager::try_new(db.clone()).await
}

/// Establishes a connection to the database using the provided URL.
pub async fn establish_connection(
    database_url: &str,
) -> Result<Arc<DatabaseConnection>, sea_orm::DbErr> {
    Database::connect(database_url).await.map(Into::into)
}
