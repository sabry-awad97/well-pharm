use std::path::PathBuf;

use app_config::Settings;
use db_entity::UserRole;
use db_service::{ServiceManager, ensure_database_exists, establish_connection};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use thiserror::Error;
use tokio::fs;
use tracing::{error, info};

#[derive(Debug, Error)]
pub enum OnboardingError {
    #[error("Failed to save configuration: {0}")]
    ConfigError(String),

    #[error("Failed to connect to database: {0}")]
    DatabaseError(String),

    #[error("Failed to create user: {0}")]
    UserCreationError(String),

    #[error("Failed to save workspace settings: {0}")]
    WorkspaceError(String),

    #[error("Onboarding already completed")]
    AlreadyCompleted,
}

impl From<db_service::ServiceError> for OnboardingError {
    fn from(err: db_service::ServiceError) -> Self {
        OnboardingError::DatabaseError(err.to_string())
    }
}

impl From<std::io::Error> for OnboardingError {
    fn from(err: std::io::Error) -> Self {
        OnboardingError::ConfigError(err.to_string())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceSettings {
    pub name: String,
    pub address: String,
    pub phone: String,
    pub email: String,
    pub license: String,
}

#[derive(Serialize, Deserialize)]
pub struct DbConfig {
    pub host: String,
    pub port: u16,
    pub name: String,
    pub user: String,
    pub password: String,
}

pub struct OnboardingManager {
    app_handle: AppHandle,
}

impl OnboardingManager {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    pub fn get_onboarding_status_file(&self) -> PathBuf {
        let app_dir = self.app_handle.path().app_data_dir().unwrap();
        app_dir.join("onboarding_completed")
    }

    pub async fn is_onboarding_completed(&self) -> bool {
        // First check if the onboarding_completed file exists
        let file_exists = self.get_onboarding_status_file().exists();

        if !file_exists {
            // If the file doesn't exist, onboarding is not completed
            return false;
        }

        // Additional check: verify that the database has the required tables
        // This helps detect cases where the database was reset but the onboarding file still exists
        if let Some(service_manager) = self.app_handle.try_state::<ServiceManager>() {
            let user_repo = service_manager.user_repository();

            // Check if we can access a critical table like users
            match user_repo.count().await {
                Ok(_) => {
                    // Database seems to be working, onboarding is completed
                    true
                }
                Err(e) => {
                    // Database error - likely reset or not properly set up
                    tracing::warn!(
                        "Database check failed during onboarding status check: {}",
                        e
                    );
                    // Delete the onboarding file since the database is not in a good state
                    if let Err(e) = std::fs::remove_file(self.get_onboarding_status_file()) {
                        tracing::error!("Failed to remove onboarding status file: {}", e);
                    }
                    false
                }
            }
        } else {
            // If we can't access the service manager, assume onboarding is not complete
            tracing::warn!("Could not access service manager during onboarding status check");
            false
        }
    }

    pub async fn configure_database(
        &self,
        host: String,
        port: u16,
        name: String,
        user: String,
        password: String,
    ) -> Result<(), OnboardingError> {
        if self.is_onboarding_completed().await {
            return Err(OnboardingError::AlreadyCompleted);
        }

        // Construct database URL
        let db_url = format!(
            "postgres://{}:{}@{}:{}/{}",
            user, password, host, port, name
        );

        // Ensure database exists
        ensure_database_exists(&db_url).await.map_err(|e| {
            OnboardingError::DatabaseError(format!("Failed to create database: {}", e))
        })?;

        // Test connection
        let max_connections = 5;
        let timeout_seconds = 30;
        let conn = establish_connection(&db_url, max_connections, timeout_seconds)
            .await
            .map_err(|e| {
                OnboardingError::DatabaseError(format!("Failed to connect to database: {}", e))
            })?;

        // Run migrations
        info!("Running database migrations...");
        db_migration::run_migrations(&conn).await.map_err(|e| {
            OnboardingError::DatabaseError(format!("Failed to run migrations: {}", e))
        })?;
        info!("Database migrations completed successfully");

        // Update config
        let mut config = self.app_handle.state::<Settings>().inner().clone();
        config.database.url = db_url;
        config.database.max_connections = max_connections;
        config.database.timeout_seconds = timeout_seconds;

        // Save config to file
        let config_path = self
            .app_handle
            .path()
            .app_config_dir()
            .unwrap()
            .join("config.toml");
        let config_str = toml::to_string(&config).map_err(|e| {
            OnboardingError::ConfigError(format!("Failed to serialize config: {}", e))
        })?;

        fs::write(config_path, config_str).await.map_err(|e| {
            OnboardingError::ConfigError(format!("Failed to write config file: {}", e))
        })?;

        info!("Database configuration saved successfully");
        Ok(())
    }

    pub async fn create_admin_user(
        &self,
        name: String,
        email: String,
        password: String,
    ) -> Result<(), OnboardingError> {
        if self.is_onboarding_completed().await {
            return Err(OnboardingError::AlreadyCompleted);
        }

        // Get service manager from app state
        let service_manager = self.app_handle.state::<db_service::ServiceManager>();
        let user_repo = service_manager.user_repository();

        // Create admin user
        user_repo
            .create_user(name, email, password, UserRole::Admin)
            .await
            .map_err(|e| {
                OnboardingError::UserCreationError(format!("Failed to create admin user: {}", e))
            })?;

        info!("Admin user created successfully");
        Ok(())
    }

    pub async fn setup_workspace(
        &self,
        settings: WorkspaceSettings,
    ) -> Result<(), OnboardingError> {
        if self.is_onboarding_completed().await {
            return Err(OnboardingError::AlreadyCompleted);
        }

        // Update config with workspace settings
        let mut config = self.app_handle.state::<Settings>().inner().clone();
        config.app.workspace_name = settings.name;
        config.app.workspace_address = Some(settings.address);
        config.app.workspace_phone = Some(settings.phone);
        config.app.workspace_email = Some(settings.email);
        config.app.workspace_license = Some(settings.license);

        // Save config to file
        let config_path = self
            .app_handle
            .path()
            .app_config_dir()
            .unwrap()
            .join("config.toml");
        let config_str = toml::to_string(&config).map_err(|e| {
            OnboardingError::WorkspaceError(format!("Failed to serialize config: {}", e))
        })?;

        fs::write(config_path, config_str).await.map_err(|e| {
            OnboardingError::WorkspaceError(format!("Failed to write config file: {}", e))
        })?;

        info!("Workspace settings saved successfully");
        Ok(())
    }

    pub async fn complete_onboarding(&self) -> Result<(), OnboardingError> {
        // Create the onboarding completion marker file
        let status_file = self.get_onboarding_status_file();

        // Create parent directories if they don't exist
        if let Some(parent) = status_file.parent() {
            fs::create_dir_all(parent)
                .await
                .map_err(|e| OnboardingError::ConfigError(e.to_string()))?;
        }

        // Write the completion timestamp to the file
        let timestamp = chrono::Utc::now().to_rfc3339();
        fs::write(status_file, timestamp)
            .await
            .map_err(|e| OnboardingError::ConfigError(e.to_string()))?;

        info!("Onboarding completed successfully");
        Ok(())
    }
}
