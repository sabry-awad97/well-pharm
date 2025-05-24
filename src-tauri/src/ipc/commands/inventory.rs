use chrono::NaiveDate;
use db_entity::utils::db_id::DbId;
use db_service::ServiceManager;
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use tauri::State;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LowStockItemResponse {
    id: String,
    name: String,
    stock_level: u32,
    threshold: u32,
    percent_remaining: u32,
    category: Option<String>,
    priority: Option<String>,
    supplier: Option<String>,
    last_ordered: Option<String>,
    stock_history: Option<Vec<u32>>,
    reorder_amount: Option<u32>,
    unit: Option<String>,
    notes: Option<String>,
    expiry_date: Option<String>,
    purchase_price: f64,
    selling_price: f64,
    price_updated_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryItemResponse {
    id: String,
    name: String,
    stock_level: u32,
    threshold: u32,
    category: Option<String>,
    supplier: Option<String>,
    last_ordered: Option<String>,
    stock_history: Option<Vec<u32>>,
    reorder_amount: Option<u32>,
    unit: Option<String>,
    notes: Option<String>,
    expiry_date: Option<String>,
    purchase_price: f64,
    selling_price: f64,
    price_updated_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInventoryRequest {
    product_id: String,
    stock_level: Option<u32>,
    threshold: Option<u32>,
    supplier: Option<String>,
    reorder_amount: Option<u32>,
    unit: Option<String>,
    notes: Option<String>,
    expiry_date: Option<String>,
    purchase_price: Option<f64>,
    selling_price: Option<f64>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StockTransactionRequest {
    product_id: String,
    quantity: i32,
    transaction_type: String,
    notes: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePriceRequest {
    product_id: String,
    purchase_price: Option<f64>,
    selling_price: Option<f64>,
}

#[tauri::command]
pub async fn fetch_low_stock_items(
    service_manager: State<'_, ServiceManager>,
) -> Result<Vec<LowStockItemResponse>, String> {
    let inventory_service = service_manager.inventory_repository();

    // Fetch inventory items that are below their threshold
    let low_stock_items = inventory_service
        .get_low_stock_items()
        .await
        .map_err(|e| e.to_string())?;

    // Transform the database entities into the response format
    let response_items = low_stock_items
        .into_iter()
        .map(|item| {
            // Calculate percent remaining
            let percent_remaining = if item.threshold > 0 {
                ((item.stock_level as f64 / item.threshold as f64) * 100.0) as u32
            } else {
                100
            };

            // Determine priority based on percent remaining
            let priority = if percent_remaining < 20 {
                Some("high".to_string())
            } else if percent_remaining < 50 {
                Some("medium".to_string())
            } else {
                Some("low".to_string())
            };

            LowStockItemResponse {
                id: item.id.to_string(),
                name: item.name,
                stock_level: item.stock_level,
                threshold: item.threshold,
                percent_remaining,
                category: item.category,
                priority,
                supplier: item.supplier,
                last_ordered: item.last_ordered.map(|date| date.to_string()),
                stock_history: item.stock_history,
                reorder_amount: item.reorder_amount,
                unit: item.unit,
                notes: item.notes,
                expiry_date: item.expiry_date,
                purchase_price: item.purchase_price,
                selling_price: item.selling_price,
                price_updated_at: item.price_updated_at.to_string(),
            }
        })
        .collect();

    Ok(response_items)
}

#[tauri::command]
pub async fn get_inventory_item(
    service_manager: State<'_, ServiceManager>,
    product_id: String,
) -> Result<Option<InventoryItemResponse>, String> {
    let inventory_service = service_manager.inventory_repository();

    // Parse UUID from string
    let id = DbId::from_str(&product_id).map_err(|e| format!("Invalid product ID: {}", e))?;

    // Get inventory item
    let item = inventory_service
        .get_inventory_item(id)
        .await
        .map_err(|e| e.to_string())?;

    // Transform to response format
    let response = item.map(|item| InventoryItemResponse {
        id: item.id.to_string(),
        name: item.name,
        stock_level: item.stock_level,
        threshold: item.threshold,
        category: item.category,
        supplier: item.supplier,
        last_ordered: item.last_ordered.map(|date| date.to_string()),
        stock_history: item.stock_history,
        reorder_amount: item.reorder_amount,
        unit: item.unit,
        notes: item.notes,
        expiry_date: item.expiry_date,
        purchase_price: item.purchase_price,
        selling_price: item.selling_price,
        price_updated_at: item.price_updated_at.to_string(),
    });

    Ok(response)
}

#[tauri::command]
pub async fn list_inventory_items(
    service_manager: State<'_, ServiceManager>,
) -> Result<Vec<InventoryItemResponse>, String> {
    let inventory_service = service_manager.inventory_repository();

    // Get all inventory items
    let items = inventory_service
        .list_inventory_items()
        .await
        .map_err(|e| e.to_string())?;

    // Transform to response format
    let response_items = items
        .into_iter()
        .map(|item| InventoryItemResponse {
            id: item.id.to_string(),
            name: item.name,
            stock_level: item.stock_level,
            threshold: item.threshold,
            category: item.category,
            supplier: item.supplier,
            last_ordered: item.last_ordered.map(|date| date.to_string()),
            stock_history: item.stock_history,
            reorder_amount: item.reorder_amount,
            unit: item.unit,
            notes: item.notes,
            expiry_date: item.expiry_date,
            purchase_price: item.purchase_price,
            selling_price: item.selling_price,
            price_updated_at: item.price_updated_at.to_string(),
        })
        .collect();

    Ok(response_items)
}

#[tauri::command]
pub async fn update_inventory_item(
    service_manager: State<'_, ServiceManager>,
    request: UpdateInventoryRequest,
) -> Result<InventoryItemResponse, String> {
    let inventory_service = service_manager.inventory_repository();

    // Parse UUID from string
    let product_id =
        DbId::from_str(&request.product_id).map_err(|e| format!("Invalid product ID: {}", e))?;

    // Get current inventory item to use existing values for fields not being updated
    let current_item = inventory_service
        .get_inventory_item(product_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| {
            format!(
                "Inventory item not found for product ID: {}",
                request.product_id
            )
        })?;

    // Update inventory item
    let updated_item = inventory_service
        .create_or_update_inventory_item(
            product_id,
            request.stock_level.unwrap_or(current_item.stock_level),
            request.threshold.unwrap_or(current_item.threshold),
            request.supplier,
            request.reorder_amount,
            request.unit,
            request.notes,
            request.expiry_date,
            request
                .purchase_price
                .unwrap_or(current_item.purchase_price),
            request.selling_price.unwrap_or(current_item.selling_price),
        )
        .await
        .map_err(|e| e.to_string())?;

    // Transform to response format
    let response = InventoryItemResponse {
        id: updated_item.id.to_string(),
        name: updated_item.name,
        stock_level: updated_item.stock_level,
        threshold: updated_item.threshold,
        category: updated_item.category,
        supplier: updated_item.supplier,
        last_ordered: updated_item.last_ordered.map(|date| date.to_string()),
        stock_history: updated_item.stock_history,
        reorder_amount: updated_item.reorder_amount,
        unit: updated_item.unit,
        notes: updated_item.notes,
        expiry_date: updated_item.expiry_date,
        purchase_price: updated_item.purchase_price,
        selling_price: updated_item.selling_price,
        price_updated_at: updated_item.price_updated_at.to_string(),
    };

    Ok(response)
}

#[tauri::command]
pub async fn record_stock_transaction(
    service_manager: State<'_, ServiceManager>,
    request: StockTransactionRequest,
) -> Result<(), String> {
    let inventory_service = service_manager.inventory_repository();

    // Parse UUID from string
    let product_id =
        DbId::from_str(&request.product_id).map_err(|e| format!("Invalid product ID: {}", e))?;

    // Record stock transaction
    inventory_service
        .record_stock_transaction(
            product_id,
            request.quantity,
            &request.transaction_type,
            request.notes,
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn update_prices(
    service_manager: State<'_, ServiceManager>,
    request: UpdatePriceRequest,
) -> Result<InventoryItemResponse, String> {
    let inventory_service = service_manager.inventory_repository();

    // Parse UUID from string
    let product_id =
        DbId::from_str(&request.product_id).map_err(|e| format!("Invalid product ID: {}", e))?;

    // Update prices
    let updated_item = inventory_service
        .update_prices(product_id, request.purchase_price, request.selling_price)
        .await
        .map_err(|e| e.to_string())?;

    // Transform to response format
    let response = InventoryItemResponse {
        id: updated_item.id.to_string(),
        name: updated_item.name,
        stock_level: updated_item.stock_level,
        threshold: updated_item.threshold,
        category: updated_item.category,
        supplier: updated_item.supplier,
        last_ordered: updated_item.last_ordered.map(|date| date.to_string()),
        stock_history: updated_item.stock_history,
        reorder_amount: updated_item.reorder_amount,
        unit: updated_item.unit,
        notes: updated_item.notes,
        expiry_date: updated_item.expiry_date,
        purchase_price: updated_item.purchase_price,
        selling_price: updated_item.selling_price,
        price_updated_at: updated_item.price_updated_at.to_string(),
    };

    Ok(response)
}

#[tauri::command]
pub async fn get_stock_level(
    service_manager: State<'_, ServiceManager>,
    product_id: String,
) -> Result<u32, String> {
    let inventory_service = service_manager.inventory_repository();

    // Parse UUID from string
    let id = DbId::from_str(&product_id).map_err(|e| format!("Invalid product ID: {}", e))?;

    // Get stock level
    let stock_level = inventory_service
        .get_stock_level(id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(stock_level)
}
