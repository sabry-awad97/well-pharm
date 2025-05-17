//! A library for managing services in the pharmacy management system.

#![deny(missing_docs)]

use std::{sync::Arc, time::Duration};

use derive_getters::Getters;
use sea_orm::{ConnectOptions, ConnectionTrait, Database, DatabaseConnection};
use tokio::process::Command;
use tracing::{error, info, warn};
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
    url: &str,
    max_connections: u32,
    timeout_seconds: u64,
) -> Result<Arc<DatabaseConnection>, sea_orm::DbErr> {
    // Set up connection options
    let mut opt = ConnectOptions::new(url.to_owned());
    opt.max_connections(max_connections)
        .min_connections(1)
        .connect_timeout(Duration::from_secs(timeout_seconds))
        .acquire_timeout(Duration::from_secs(timeout_seconds))
        .sqlx_logging(true);
    Database::connect(opt).await.map(Into::into)
}

/// Create a PostgreSQL database if it doesn't exist.
/// This function uses the `createdb` command if available, otherwise it falls back to SQL queries.
pub async fn ensure_database_exists(url: &str) -> Result<(), ServiceError> {
    // Parse the database URL to extract components
    let db_url = url::Url::parse(url)
        .map_err(|e| ServiceError::InvalidValue(format!("Invalid database URL: {}", e)))?;

    // Extract database name from the URL path
    let db_name = db_url.path().trim_start_matches('/');
    if db_name.is_empty() {
        return Err(ServiceError::InvalidValue(
            "Database name is missing from URL".into(),
        ));
    }

    // Create a connection URL to the 'postgres' database (which always exists)
    let mut postgres_url = db_url.clone();
    postgres_url.set_path("/postgres");

    info!("Checking if database '{}' exists", db_name);

    // Try to create the database using createdb command first (more reliable)
    match create_database_with_command(db_name).await {
        Ok(_) => {
            info!("Database '{}' created successfully using createdb", db_name);
            return Ok(());
        }
        Err(e) => {
            warn!("Failed to create database using createdb: {}", e);
            info!("Trying SQL method instead...");
        }
    }

    // Try SQL method as fallback
    let postgres_conn_str = postgres_url.as_str();

    // Connect to the postgres database
    let mut opt = ConnectOptions::new(postgres_conn_str.to_owned());
    opt.max_connections(1)
        .min_connections(0)
        .connect_timeout(Duration::from_secs(10))
        .sqlx_logging(false);

    let conn = Database::connect(opt).await?;

    // Check if the database exists
    let query = format!(
        "SELECT 1 FROM pg_database WHERE datname = '{}'",
        db_name.replace('\'', "''")
    );

    let stmt = sea_orm::Statement::from_string(conn.get_database_backend(), query);
    let result = conn.query_one(stmt).await?;

    // If the database doesn't exist, create it
    if result.is_none() {
        info!("Database '{}' does not exist, creating it now", db_name);

        let create_query = format!(
            "CREATE DATABASE \"{}\" ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C' TEMPLATE template0",
            db_name.replace('\"', "\"\"")
        );
        let stmt = sea_orm::Statement::from_string(conn.get_database_backend(), create_query);
        match conn.execute(stmt).await {
            Ok(_) => info!("Database '{}' created successfully", db_name),
            Err(e) => {
                error!("Failed to create database with explicit locale: {}", e);

                // Try with a simpler create statement as fallback
                info!("Trying simpler CREATE DATABASE statement...");
                let simple_create =
                    format!("CREATE DATABASE \"{}\"", db_name.replace('\"', "\"\""));

                let stmt =
                    sea_orm::Statement::from_string(conn.get_database_backend(), simple_create);
                conn.execute(stmt).await?;

                info!(
                    "Database '{}' created successfully with simple CREATE",
                    db_name
                );
            }
        }
    } else {
        info!("Database '{}' already exists", db_name);
    }

    Ok(())
}

/// Drop an existing database and recreate it from scratch
///
/// # Safety
///
/// This function will delete all data in the specified database.
/// It should only be used in development environments.
pub async fn reset_database(url: &str, environment: &str) -> Result<(), ServiceError> {
    // Safety check: only allow in development environment
    if environment != "development" {
        return Err(ServiceError::OperationNotPermitted(
            "Database reset is only allowed in development environment".into(),
        ));
    }

    // Parse the database URL to extract components
    let db_url = url::Url::parse(url)
        .map_err(|e| ServiceError::InvalidValue(format!("Invalid database URL: {}", e)))?;

    // Extract database name from the URL path
    let db_name = db_url.path().trim_start_matches('/');
    if db_name.is_empty() {
        return Err(ServiceError::InvalidValue(
            "Database name is missing from URL".into(),
        ));
    }

    // Additional safety check: database name must contain "dev" or "test"
    if !db_name.contains("dev") && !db_name.contains("test") {
        return Err(ServiceError::OperationNotPermitted(format!(
            "Database '{}' does not appear to be a development or test database",
            db_name
        )));
    }

    info!("Preparing to reset database '{}'", db_name);

    // Create a connection URL to the 'postgres' database (which always exists)
    let mut postgres_url = db_url.clone();
    postgres_url.set_path("/postgres");

    // Try to drop the database using dropdb command first
    match drop_database_with_command(db_name).await {
        Ok(_) => {
            info!("Database '{}' dropped successfully using dropdb", db_name);
        }
        Err(e) => {
            warn!("Failed to drop database using dropdb: {}", e);
            info!("Trying SQL method instead...");

            // Try SQL method as fallback
            let postgres_conn_str = postgres_url.as_str();

            // Connect to the postgres database
            let mut opt = ConnectOptions::new(postgres_conn_str.to_owned());
            opt.max_connections(1)
                .min_connections(0)
                .connect_timeout(Duration::from_secs(10))
                .sqlx_logging(false);

            let conn = Database::connect(opt).await?;

            // Force disconnect all clients
            let disconnect_query = format!(
                "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '{}' AND pid <> pg_backend_pid()",
                db_name.replace('\'', "''")
            );

            let stmt =
                sea_orm::Statement::from_string(conn.get_database_backend(), disconnect_query);
            match conn.execute(stmt).await {
                Ok(_) => info!("Disconnected all clients from database '{}'", db_name),
                Err(e) => warn!("Failed to disconnect clients: {}", e),
            }

            // Drop the database
            let drop_query = format!(
                "DROP DATABASE IF EXISTS \"{}\"",
                db_name.replace('\"', "\"\"")
            );

            let stmt = sea_orm::Statement::from_string(conn.get_database_backend(), drop_query);
            conn.execute(stmt).await?;
            info!("Database '{}' dropped successfully", db_name)
        }
    }

    // Now recreate the database
    ensure_database_exists(url).await?;

    info!("Database '{}' has been reset successfully", db_name);

    Ok(())
}

/// Try to create the database using the createdb command
async fn create_database_with_command(db_name: &str) -> Result<(), ServiceError> {
    let output = Command::new("createdb").arg(db_name).output().await?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        // If the error contains "already exists", that's fine
        if error.contains("already exists") {
            info!("Database '{}' already exists", db_name);
            return Ok(());
        }
        return Err(ServiceError::Command(format!(
            "createdb command failed: {}",
            error
        )));
    }

    Ok(())
}

/// Try to drop the database using the dropdb command
async fn drop_database_with_command(db_name: &str) -> Result<(), ServiceError> {
    // Try to find the dropdb executable
    let dropdb_cmd = if cfg!(windows) {
        "dropdb.exe"
    } else {
        "dropdb"
    };

    let output = Command::new(dropdb_cmd)
        .arg("--if-exists")
        .arg(db_name)
        .output()
        .await?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        // If the error contains "does not exist", that's fine
        if error.contains("does not exist") {
            info!("Database '{}' does not exist, nothing to drop", db_name);
            return Ok(());
        }
        return Err(ServiceError::Command(format!(
            "dropdb command failed: {}",
            error
        )));
    }

    Ok(())
}

/// Fix collation issues in an existing database
pub async fn fix_database_collation(url: &str) -> Result<(), ServiceError> {
    // Parse the database URL to extract components
    let db_url = url::Url::parse(url)
        .map_err(|e| ServiceError::InvalidValue(format!("Invalid database URL: {}", e)))?;

    // Extract database name from the URL path
    let db_name = db_url.path().trim_start_matches('/');
    if db_name.is_empty() {
        return Err(ServiceError::InvalidValue(
            "Database name is missing from URL".into(),
        ));
    }

    // Create a connection URL to the 'postgres' database (which always exists)
    let mut postgres_url = db_url.clone();
    postgres_url.set_path("/postgres");

    // Connect to the postgres database
    let mut opt = ConnectOptions::new(postgres_url.as_str().to_owned());
    opt.max_connections(1)
        .min_connections(0)
        .connect_timeout(Duration::from_secs(10))
        .sqlx_logging(false);

    let conn = Database::connect(opt).await?;

    // Check if the database exists
    let query = format!(
        "SELECT 1 FROM pg_database WHERE datname = '{}'",
        db_name.replace('\'', "''")
    );

    let stmt = sea_orm::Statement::from_string(conn.get_database_backend(), query);
    let result = conn.query_one(stmt).await?;

    if result.is_some() {
        // Database exists, try to refresh collation versions
        info!(
            "Attempting to refresh collation versions for database '{}'",
            db_name
        );

        // First try to refresh the postgres database collation
        let refresh_postgres = "ALTER COLLATION \"default\" REFRESH VERSION";
        let stmt = sea_orm::Statement::from_string(conn.get_database_backend(), refresh_postgres);
        match conn.execute(stmt).await {
            Ok(_) => info!("Refreshed collation version for postgres database"),
            Err(e) => warn!("Failed to refresh postgres collation: {}", e),
        }

        // Now connect to the target database and refresh its collation
        let mut target_opt = ConnectOptions::new(url.to_owned());
        target_opt
            .max_connections(1)
            .min_connections(0)
            .connect_timeout(Duration::from_secs(10))
            .sqlx_logging(false);

        match Database::connect(target_opt).await {
            Ok(target_conn) => {
                let refresh_target = "ALTER COLLATION \"default\" REFRESH VERSION";
                let stmt = sea_orm::Statement::from_string(
                    target_conn.get_database_backend(),
                    refresh_target,
                );
                match target_conn.execute(stmt).await {
                    Ok(_) => info!("Refreshed collation version for '{}' database", db_name),
                    Err(e) => warn!("Failed to refresh target database collation: {}", e),
                }
            }
            Err(e) => warn!(
                "Could not connect to target database to refresh collation: {}",
                e
            ),
        }
    }

    Ok(())
}
