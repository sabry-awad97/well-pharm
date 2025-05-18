use tauri::{Runtime, ipc::Invoke};

mod auth;
mod onboarding;

pub fn create_handler<R: Runtime>() -> impl Fn(Invoke<R>) -> bool + Send + Sync + 'static {
    tauri::generate_handler![
        auth::login,
        auth::refresh_token,
        auth::logout,
        onboarding::check_onboarding_status,
        onboarding::configure_database,
        onboarding::create_admin_user,
        onboarding::setup_workspace,
        onboarding::complete_onboarding,
    ]
}
