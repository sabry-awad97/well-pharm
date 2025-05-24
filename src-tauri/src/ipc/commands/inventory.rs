use chrono::NaiveDate;
use db_entity::inventory_batch::dto::{BatchCreateParams, BatchUpdateParams};
use db_entity::utils::db_id::DbId;
use db_entity::{
    inventory::dto::InventoryItemUpdateParams, inventory_batch::dto::BatchTransactionParams,
};
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
        .get_inventory_item(product_id.clone())
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
        .create_or_update_inventory_item(InventoryItemUpdateParams {
            product_id: product_id.clone(),
            stock_level: request.stock_level.unwrap_or(current_item.stock_level),
            threshold: request.threshold.unwrap_or(current_item.threshold),
            supplier: request.supplier,
            reorder_amount: request.reorder_amount,
            unit: request.unit,
            notes: request.notes,
            expiry_date: request.expiry_date,
            purchase_price: request
                .purchase_price
                .unwrap_or(current_item.purchase_price),
            selling_price: request.selling_price.unwrap_or(current_item.selling_price),
        })
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

// Add batch-related request/response structs

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddBatchRequest {
    product_id: String,
    batch_number: String,
    quantity: u32,
    manufacturing_date: Option<String>,
    expiry_date: Option<String>,
    purchase_price: f64,
    notes: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateBatchRequest {
    id: String,
    quantity: Option<u32>,
    manufacturing_date: Option<String>,
    expiry_date: Option<String>,
    purchase_price: Option<f64>,
    notes: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchTransactionRequest {
    batch_id: String,
    quantity: i32,
    transaction_type: String,
    notes: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchItemResponse {
    id: String,
    product_id: String,
    batch_number: String,
    quantity: u32,
    manufacturing_date: Option<String>,
    expiry_date: Option<String>,
    purchase_price: f64,
    notes: Option<String>,
    created_at: String,
    updated_at: String,
}

// Add batch-related commands

#[tauri::command]
pub async fn add_batch(
    service_manager: State<'_, ServiceManager>,
    request: AddBatchRequest,
) -> Result<BatchItemResponse, String> {
    let inventory_service = service_manager.inventory_repository();

    // Parse UUID from string
    let product_id =
        DbId::from_str(&request.product_id).map_err(|e| format!("Invalid product ID: {}", e))?;

    // Parse dates if provided
    let manufacturing_date = if let Some(date_str) = &request.manufacturing_date {
        Some(
            NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
                .map_err(|e| format!("Invalid manufacturing date format: {}", e))?,
        )
    } else {
        None
    };

    let expiry_date = if let Some(date_str) = &request.expiry_date {
        Some(
            NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
                .map_err(|e| format!("Invalid expiry date format: {}", e))?,
        )
    } else {
        None
    };

    // Add batch
    let batch = inventory_service
        .add_batch(BatchCreateParams {
            product_id,
            batch_number: request.batch_number,
            quantity: request.quantity,
            manufacturing_date,
            expiry_date,
            purchase_price: request.purchase_price,
            notes: request.notes,
        })
        .await
        .map_err(|e| e.to_string())?;

    // Convert to response
    Ok(BatchItemResponse {
        id: batch.id.to_string(),
        product_id: batch.product_id.to_string(),
        batch_number: batch.batch_number,
        quantity: batch.quantity,
        manufacturing_date: batch.manufacturing_date,
        expiry_date: batch.expiry_date,
        purchase_price: batch.purchase_price,
        notes: batch.notes,
        created_at: batch.created_at.to_rfc3339(),
        updated_at: batch.updated_at.to_rfc3339(),
    })
}

#[tauri::command]
pub async fn update_batch(
    service_manager: State<'_, ServiceManager>,
    request: UpdateBatchRequest,
) -> Result<BatchItemResponse, String> {
    let inventory_service = service_manager.inventory_repository();

    // Parse UUID from string
    let batch_id = DbId::from_str(&request.id).map_err(|e| format!("Invalid batch ID: {}", e))?;

    // Parse dates if provided
    let manufacturing_date = if let Some(date_str) = &request.manufacturing_date {
        Some(
            NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
                .map_err(|e| format!("Invalid manufacturing date format: {}", e))?,
        )
    } else {
        None
    };

    let expiry_date = if let Some(date_str) = &request.expiry_date {
        Some(
            NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
                .map_err(|e| format!("Invalid expiry date format: {}", e))?,
        )
    } else {
        None
    };

    // Update batch
    let batch = inventory_service
        .update_batch(BatchUpdateParams {
            id: batch_id,
            quantity: request.quantity,
            manufacturing_date,
            expiry_date,
            purchase_price: request.purchase_price,
            notes: request.notes,
        })
        .await
        .map_err(|e| e.to_string())?;

    // Convert to response
    Ok(BatchItemResponse {
        id: batch.id.to_string(),
        product_id: batch.product_id.to_string(),
        batch_number: batch.batch_number,
        quantity: batch.quantity,
        manufacturing_date: batch.manufacturing_date,
        expiry_date: batch.expiry_date,
        purchase_price: batch.purchase_price,
        notes: batch.notes,
        created_at: batch.created_at.to_rfc3339(),
        updated_at: batch.updated_at.to_rfc3339(),
    })
}

#[tauri::command]
pub async fn get_batch(
    service_manager: State<'_, ServiceManager>,
    batch_id: String,
) -> Result<Option<BatchItemResponse>, String> {
    let inventory_service = service_manager.inventory_repository();

    // Parse UUID from string
    let id = DbId::from_str(&batch_id).map_err(|e| format!("Invalid batch ID: {}", e))?;

    // Get batch
    let batch_option = inventory_service
        .get_batch(id)
        .await
        .map_err(|e| e.to_string())?;

    // Convert to response if found
    match batch_option {
        Some(batch) => Ok(Some(BatchItemResponse {
            id: batch.id.to_string(),
            product_id: batch.product_id.to_string(),
            batch_number: batch.batch_number,
            quantity: batch.quantity,
            manufacturing_date: batch.manufacturing_date,
            expiry_date: batch.expiry_date,
            purchase_price: batch.purchase_price,
            notes: batch.notes,
            created_at: batch.created_at.to_rfc3339(),
            updated_at: batch.updated_at.to_rfc3339(),
        })),
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn list_batches_by_product(
    service_manager: State<'_, ServiceManager>,
    product_id: String,
) -> Result<Vec<BatchItemResponse>, String> {
    let inventory_service = service_manager.inventory_repository();

    // Parse UUID from string
    let id = DbId::from_str(&product_id).map_err(|e| format!("Invalid product ID: {}", e))?;

    // List batches
    let batches = inventory_service
        .list_batches_by_product(id)
        .await
        .map_err(|e| e.to_string())?;

    // Convert to responses
    let responses = batches
        .into_iter()
        .map(|batch| BatchItemResponse {
            id: batch.id.to_string(),
            product_id: batch.product_id.to_string(),
            batch_number: batch.batch_number,
            quantity: batch.quantity,
            manufacturing_date: batch.manufacturing_date,
            expiry_date: batch.expiry_date,
            purchase_price: batch.purchase_price,
            notes: batch.notes,
            created_at: batch.created_at.to_rfc3339(),
            updated_at: batch.updated_at.to_rfc3339(),
        })
        .collect();

    Ok(responses)
}

#[tauri::command]
pub async fn record_batch_transaction(
    service_manager: State<'_, ServiceManager>,
    request: BatchTransactionRequest,
) -> Result<(), String> {
    let inventory_service = service_manager.inventory_repository();

    // Parse UUID from string
    let batch_id =
        DbId::from_str(&request.batch_id).map_err(|e| format!("Invalid batch ID: {}", e))?;

    // Record transaction
    inventory_service
        .record_batch_transaction(BatchTransactionParams {
            batch_id,
            quantity: request.quantity,
            transaction_type: request.transaction_type,
            notes: request.notes,
        })
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_expiring_batches(
    service_manager: State<'_, ServiceManager>,
    days: u32,
) -> Result<Vec<BatchItemResponse>, String> {
    let inventory_service = service_manager.inventory_repository();

    // Get expiring batches
    let batches = inventory_service
        .get_expiring_batches(days)
        .await
        .map_err(|e| e.to_string())?;

    // Convert to responses
    let responses = batches
        .into_iter()
        .map(|batch| BatchItemResponse {
            id: batch.id.to_string(),
            product_id: batch.product_id.to_string(),
            batch_number: batch.batch_number,
            quantity: batch.quantity,
            manufacturing_date: batch.manufacturing_date,
            expiry_date: batch.expiry_date,
            purchase_price: batch.purchase_price,
            notes: batch.notes,
            created_at: batch.created_at.to_rfc3339(),
            updated_at: batch.updated_at.to_rfc3339(),
        })
        .collect();

    Ok(responses)
}
