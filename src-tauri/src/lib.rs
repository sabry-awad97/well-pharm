use tauri::Manager;
use tracing::{error, info, warn};
use db_service::{ServiceManager, };
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Serialize)]
struct LoginResponse {
    user: UserResponse,
    access_token: String,
    refresh_token: String,
}

#[derive(Serialize)]
struct UserResponse {
    id: String,
    username: String,
    email: String,
    role: String,
}

#[derive(Deserialize)]
struct LoginRequest {
    username_or_email: String,
    password: String,
}

#[derive(Deserialize)]
struct RefreshTokenRequest {
    refresh_token: String,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn login(
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
        Some((user, access_token, refresh_token)) => {
            Ok(LoginResponse {
                user: UserResponse {
                    id: user.id.to_string(),
                    username: user.username,
                    email: user.email,
                    role: user.role.to_string(),
                },
                access_token,
                refresh_token,
            })
        },
        None => Err("Invalid credentials".to_string()),
    }
}

#[tauri::command]
async fn refresh_token(
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
        Some((user, access_token)) => {
            Ok(LoginResponse {
                user: UserResponse {
                    id: user.id.to_string(),
                    username: user.username,
                    email: user.email,
                    role: user.role.to_string(),
                },
                access_token,
                refresh_token: request.refresh_token,
            })
        },
        None => Err("Invalid refresh token".to_string()),
    }
}

#[tauri::command]
async fn logout(
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    // Load configuration
    let config = app_config::load()
        .await
        .expect("Failed to load configuration");

    info!("Application starting with config: {:?}", config);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Set up database connection in a separate thread
            tokio::spawn(async move {
                let db_url = &config.database.url.to_owned();

                // Try to fix collation issues first
                match db_service::fix_database_collation(db_url).await {
                    Ok(_) => info!("Checked and attempted to fix collation issues"),
                    Err(e) => warn!("Failed to fix collation issues: {}", e),
                }

                // Ensure the database exists before trying to connect
                match db_service::ensure_database_exists(db_url).await {
                    Ok(_) => info!("Database exists or was created successfully"),
                    Err(e) => {
                        error!("Failed to ensure database exists: {}", e);
                        // Continue anyway, as the error might be due to permissions
                        // and the database might actually exist

                        // Try a different approach - connect directly and let migrations create tables
                        warn!("Will attempt to connect directly and let migrations handle schema creation");
                    }
                }

                let max_connections = config.database.max_connections;
                let timeout_seconds = config.database.timeout_seconds;

                // Now try to connect to the database
                let conn_arc = match db_service::establish_connection(db_url, max_connections, timeout_seconds).await {
                    Ok(conn) => {
                        info!("Connected to database successfully");
                        conn
                    },
                    Err(e) => {
                        error!("Failed to connect to database: {}", e);

                        // Try with a modified connection string as a last resort
                        warn!("Attempting connection with modified parameters...");

                        // Parse the URL and modify it to use template0
                        let mut url = url::Url::parse(db_url)
                            .expect("Invalid database URL");

                        // Add template0 parameter
                        url.query_pairs_mut()
                            .append_pair("options", "--template=template0");

                        match db_service::establish_connection(url.as_str(), max_connections, timeout_seconds).await {
                            Ok(conn) => {
                                info!("Connected to database with modified parameters");
                                conn
                            },
                            Err(e) => {
                                error!("All connection attempts failed: {}", e);
                                panic!("Database connection is required for the application to function");
                            }
                        }
                    }
                };

                // Run migrations
                match db_migration::run_migrations(&conn_arc).await {
                    Ok(_) => info!("Database migrations completed successfully"),
                    Err(e) => {
                        error!("Failed to run migrations: {}", e);
                        panic!("Database migrations are required for the application to function");
                    }
                }

                // Initialize services
                let service_manager = db_service::setup_services(&conn_arc)
                    .await
                    .expect("Failed to set up services");

                // Store the service manager in the app state
                handle.manage(service_manager);

                // Store config in app state
                handle.manage(config);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet, 
            login, 
            refresh_token, 
            logout
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
