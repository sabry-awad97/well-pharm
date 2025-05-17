use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    // Load configuration
    let config = app_config::load()
        .await
        .expect("Failed to load configuration");

    tracing::info!("Configuration loaded: {:?}", config);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Set up database connection in a separate thread
            tokio::spawn(async move {
                let db_url = &config.database.url;
                let conn_arc = db_service::establish_connection(db_url)
                    .await
                    .expect("Failed to connect to database");

                // Run migrations
                db_migration::run_migrations(&conn_arc)
                    .await
                    .expect("Failed to run migrations");

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
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
