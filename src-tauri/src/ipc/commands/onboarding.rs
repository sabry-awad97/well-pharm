use db_service::establish_connection;
use tauri::{AppHandle, State};

use crate::services::{DbConfig, OnboardingManager, WorkspaceSettings};

#[tauri::command]
pub async fn check_onboarding_status(app_state: State<'_, AppHandle>) -> Result<bool, String> {
    let onboarding = OnboardingManager::new(app_state.inner().clone());
    Ok(onboarding.is_onboarding_completed().await)
}

#[tauri::command]
pub async fn configure_database(
    app_state: State<'_, AppHandle>,
    host: String,
    port: u16,
    name: String,
    user: String,
    password: String,
) -> Result<(), String> {
    let onboarding = OnboardingManager::new(app_state.inner().clone());
    onboarding
        .configure_database(host, port, name, user, password)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_admin_user(
    app_state: State<'_, AppHandle>,
    name: String,
    email: String,
    password: String,
) -> Result<(), String> {
    let onboarding = OnboardingManager::new(app_state.inner().clone());
    onboarding
        .create_admin_user(name, email, password)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setup_workspace(
    app_state: State<'_, AppHandle>,
    name: String,
    address: String,
    phone: String,
    email: String,
    license: String,
) -> Result<(), String> {
    let onboarding = OnboardingManager::new(app_state.inner().clone());
    let settings = WorkspaceSettings {
        name,
        address,
        phone,
        email,
        license,
    };

    onboarding
        .setup_workspace(settings)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn complete_onboarding(app_state: State<'_, AppHandle>) -> Result<(), String> {
    let onboarding = OnboardingManager::new(app_state.inner().clone());
    onboarding
        .complete_onboarding()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn test_database_connection(db_config: DbConfig) -> Result<(), String> {
    // Create a connection string
    let connection_string = format!(
        "postgres://{}:{}@{}:{}/{}",
        db_config.user, db_config.password, db_config.host, db_config.port, db_config.name
    );

    // Try to establish a connection
    match establish_connection(&connection_string, 1, 30).await {
        Ok(_) => {
            // Connection successful
            Ok(())
        }
        Err(err) => {
            // Connection failed
            Err(format!("Database connection failed: {}", err))
        }
    }
}
