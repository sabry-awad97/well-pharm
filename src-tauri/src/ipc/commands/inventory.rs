use db_service::ServiceManager;
use serde::Serialize;
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
            }
        })
        .collect();

    Ok(response_items)
}
