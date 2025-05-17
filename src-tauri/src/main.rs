// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tracing::{error, info};

#[tokio::main]
async fn main() {
    // Initialize the tracing subscriber with a custom format
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::INFO.into()),
        )
        .with_span_events(tracing_subscriber::fmt::format::FmtSpan::CLOSE)
        .with_target(true)
        .with_thread_ids(true)
        .with_thread_names(true)
        .with_file(true)
        .with_line_number(true)
        .with_ansi(true)
        .init();

    // Load environment variables from .env file if it exists
    if let Err(e) = dotenv::dotenv() {
        // It's okay if .env doesn't exist
        info!("No .env file found: {}", e);
    }

    // Check for database reset flag
    if std::env::var("WELL_PHARM_RESET_DB").unwrap_or_default() == "true" {
        info!("Database reset flag detected");

        // Load config to get database URL
        match app_config::load().await {
            Ok(config) => {
                let db_url = &config.database.url;
                let environment = &config.app.environment;

                info!(
                    "Attempting to reset database in {} environment",
                    environment
                );

                match db_service::reset_database(db_url, environment).await {
                    Ok(_) => info!("Database reset completed successfully"),
                    Err(e) => error!("Failed to reset database: {}", e),
                }
            }
            Err(e) => error!("Failed to load config for database reset: {}", e),
        }
    }

    well_pharm_lib::run().await
}
