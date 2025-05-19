use tauri::{Runtime, ipc::Invoke};

mod auth;
mod onboarding;
mod inventory;

pub fn create_handler<R: Runtime>() -> impl Fn(Invoke<R>) -> bool + Send + Sync + 'static {
    tauri::generate_handler![
        auth::login,
        auth::refresh_token,
        auth::logout,
        auth::get_current_user,
        onboarding::check_onboarding_status,
        onboarding::configure_database,
        onboarding::create_admin_user,
        onboarding::setup_workspace,
        onboarding::complete_onboarding,
        onboarding::test_database_connection,
        inventory::fetch_low_stock_items,
    ]
}
