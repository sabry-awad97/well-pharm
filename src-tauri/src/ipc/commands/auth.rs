use std::str::FromStr;

use db_entity::utils::db_id::DbId;
use db_service::ServiceManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Serialize)]
pub struct LoginResponse {
    user: UserResponse,
    access_token: String,
    refresh_token: String,
}

#[derive(Serialize)]
pub struct UserResponse {
    id: String,
    username: String,
    email: String,
    role: String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    username_or_email: String,
    password: String,
}

#[derive(Deserialize)]
pub struct RefreshTokenRequest {
    refresh_token: String,
}

#[tauri::command]
pub async fn login(
    request: LoginRequest,
    service_manager: State<'_, ServiceManager>,
) -> Result<LoginResponse, String> {
    let user_repo = service_manager.user_repository();
    let jwt_manager = service_manager.jwt_manager();

    let result = user_repo
        .login(&request.username_or_email, &request.password, jwt_manager)
        .await
        .map_err(|e| e.to_string())?;

    match result {
        Some((user, access_token, refresh_token)) => Ok(LoginResponse {
            user: UserResponse {
                id: user.id.to_string(),
                username: user.username,
                email: user.email,
                role: user.role.to_string(),
            },
            access_token,
            refresh_token,
        }),
        None => Err("Invalid credentials".to_string()),
    }
}

#[tauri::command]
pub async fn refresh_token(
    request: RefreshTokenRequest,
    service_manager: State<'_, ServiceManager>,
) -> Result<LoginResponse, String> {
    let user_repo = service_manager.user_repository();
    let jwt_manager = service_manager.jwt_manager();
    let token_store = service_manager.token_store();

    let result = user_repo
        .refresh_token(&request.refresh_token, jwt_manager, token_store)
        .await
        .map_err(|e| e.to_string())?;

    match result {
        Some((user, access_token)) => Ok(LoginResponse {
            user: UserResponse {
                id: user.id.to_string(),
                username: user.username,
                email: user.email,
                role: user.role.to_string(),
            },
            access_token,
            refresh_token: request.refresh_token,
        }),
        None => Err("Invalid refresh token".to_string()),
    }
}

#[tauri::command]
pub async fn logout(
    token: String,
    service_manager: State<'_, ServiceManager>,
) -> Result<(), String> {
    let user_repo = service_manager.user_repository();
    let jwt_manager = service_manager.jwt_manager();
    let token_store = service_manager.token_store();

    user_repo
        .logout(&token, jwt_manager, token_store)
        .await
        .map_err(|e| e.to_string())
}

/// Get the current user information from a valid token
#[tauri::command]
pub async fn get_current_user(
    token: String,
    service_manager: State<'_, ServiceManager>,
) -> Result<UserResponse, String> {
    let jwt_manager = service_manager.jwt_manager();
    let user_repo = service_manager.user_repository();

    // Validate the token
    let claims = jwt_manager
        .validate_token(&token)
        .map_err(|e| e.to_string())?;

    // Parse user ID from claims
    let user_id =
        DbId::from_str(&claims.sub).map_err(|_| "Invalid user ID in token".to_string())?;

    // Get the user from the repository
    let user = user_repo
        .find_by_id(user_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "User not found".to_string())?;

    // Return user information
    Ok(UserResponse {
        id: user.id.to_string(),
        username: user.username,
        email: user.email,
        role: user.role.to_string(),
    })
}
