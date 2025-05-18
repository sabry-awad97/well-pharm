use ipc::create_handler;
use tauri::Manager;
use tracing::{error, info, warn};

mod ipc;
mod services;

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
            // Manage the AppHandle as state
            app.manage(handle.clone());
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
        .invoke_handler(create_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
