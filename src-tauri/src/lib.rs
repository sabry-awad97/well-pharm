use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Set up database connection in a separate thread
            tokio::spawn(async move {
                // Database URL should come from config
                let db_url = "postgres://postgres:postgres@localhost:5432/well_pharm";
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
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
