use tauri::{Runtime, ipc::Invoke};

mod auth;
mod onboarding;
mod inventory;
mod product;

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
        inventory::get_inventory_item,
        inventory::list_inventory_items,
        inventory::update_inventory_item,
        inventory::record_stock_transaction,
        inventory::update_prices,
        inventory::get_stock_level,
        inventory::add_batch,
        inventory::update_batch,
        inventory::get_batch,
        inventory::list_batches_by_product,
        inventory::list_all_batches,
        inventory::record_batch_transaction,
        inventory::get_expiring_batches,
        product::create_product,
        product::update_product,
        product::delete_product,
        product::get_product_by_id,
        product::get_all_products,
        product::search_products,
        product::filter_products,
    ]
}
