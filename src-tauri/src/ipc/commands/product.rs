use std::str::FromStr;

use db_entity::utils::db_id::DbId;
use db_service::ServiceManager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProductRequest {
    name: String,
    generic_name: Option<String>,
    description: Option<String>,
    category: String,
    dosage_form: String,
    strength: String,
    manufacturer: String,
    barcode: Option<String>,
    active_ingredients: serde_json::Value,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProductRequest {
    id: String,
    name: Option<String>,
    generic_name: Option<String>,
    description: Option<String>,
    category: Option<String>,
    dosage_form: Option<String>,
    strength: Option<String>,
    manufacturer: Option<String>,
    barcode: Option<String>,
    active_ingredients: Option<serde_json::Value>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductResponse {
    id: String,
    name: String,
    generic_name: Option<String>,
    description: Option<String>,
    category: String,
    dosage_form: String,
    strength: String,
    manufacturer: String,
    barcode: Option<String>,
    active_ingredients: serde_json::Value,
    created_at: String,
    updated_at: String,
}

#[tauri::command]
pub async fn create_product(
    service_manager: State<'_, ServiceManager>,
    request: CreateProductRequest,
) -> Result<ProductResponse, String> {
    let product_repository = service_manager.product_repository();

    // Parse category string to ProductCategory enum
    let category = parse_product_category(&request.category)?;

    let product = product_repository
        .create_product(
            request.name,
            request.generic_name,
            request.description,
            category,
            request.dosage_form,
            request.strength,
            request.manufacturer,
            request.barcode,
            request.active_ingredients,
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(map_product_to_response(product))
}

#[tauri::command]
pub async fn update_product(
    service_manager: State<'_, ServiceManager>,
    request: UpdateProductRequest,
) -> Result<ProductResponse, String> {
    let product_repository = service_manager.product_repository();

    // Parse UUID from string
    let id = DbId::from_str(&request.id).map_err(|e| format!("Invalid product ID: {}", e))?;

    // Parse category if provided
    let category = match request.category {
        Some(ref cat_str) => Some(parse_product_category(cat_str)?),
        None => None,
    };

    let product = product_repository
        .update_product(
            id,
            request.name,
            request.generic_name,
            request.description,
            category,
            request.dosage_form,
            request.strength,
            request.manufacturer,
            request.barcode,
            request.active_ingredients,
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(map_product_to_response(product))
}

#[tauri::command]
pub async fn delete_product(
    service_manager: State<'_, ServiceManager>,
    id: String,
) -> Result<(), String> {
    let product_repository = service_manager.product_repository();

    // Parse UUID from string
    let product_id = DbId::from_str(&id).map_err(|e| format!("Invalid product ID: {}", e))?;

    product_repository
        .delete_product(product_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_product_by_id(
    service_manager: State<'_, ServiceManager>,
    id: String,
) -> Result<Option<ProductResponse>, String> {
    let product_repository = service_manager.product_repository();

    // Parse UUID from string
    let product_id = DbId::from_str(&id).map_err(|e| format!("Invalid product ID: {}", e))?;

    let product = product_repository
        .get_product_by_id(product_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(product.map(map_product_to_response))
}

#[tauri::command]
pub async fn search_products(
    service_manager: State<'_, ServiceManager>,
    query: String,
) -> Result<Vec<ProductResponse>, String> {
    let product_repository = service_manager.product_repository();

    let products = product_repository
        .search_products(&query)
        .await
        .map_err(|e| e.to_string())?;

    Ok(products.into_iter().map(map_product_to_response).collect())
}

#[tauri::command]
pub async fn filter_products(
    service_manager: State<'_, ServiceManager>,
    category: Option<String>,
    manufacturer: Option<String>,
) -> Result<Vec<ProductResponse>, String> {
    let product_repository = service_manager.product_repository();

    // Parse category if provided
    let parsed_category = match category {
        Some(ref cat_str) => Some(parse_product_category(cat_str)?),
        None => None,
    };

    // Convert Option<String> to Option<&str> for manufacturer
    let manufacturer_ref = manufacturer.as_deref();

    let products = product_repository
        .filter_products(parsed_category, manufacturer_ref)
        .await
        .map_err(|e| e.to_string())?;

    Ok(products.into_iter().map(map_product_to_response).collect())
}

// Helper function to parse product category string to enum
fn parse_product_category(category: &str) -> Result<db_entity::ProductCategory, String> {
    match category.to_lowercase().as_str() {
        "prescription" => Ok(db_entity::ProductCategory::Prescription),
        "otc" => Ok(db_entity::ProductCategory::OTC),
        "supplement" => Ok(db_entity::ProductCategory::Supplement),
        "medical_device" => Ok(db_entity::ProductCategory::MedicalDevice),
        "other" => Ok(db_entity::ProductCategory::Other),
        _ => Err(format!("Invalid product category: {}", category)),
    }
}

// Helper function to map product model to response
fn map_product_to_response(product: db_entity::ProductModel) -> ProductResponse {
    ProductResponse {
        id: product.id.to_string(),
        name: product.name,
        generic_name: product.generic_name,
        description: product.description,
        category: format!("{:?}", product.category),
        dosage_form: product.dosage_form,
        strength: product.strength,
        manufacturer: product.manufacturer,
        barcode: product.barcode,
        active_ingredients: product.active_ingredients,
        created_at: product.created_at.to_string(),
        updated_at: product.updated_at.to_string(),
    }
}
