use serde_json::Value as JsonValue;

use crate::utils::db_id::DbId;

use super::ProductCategory;

#[derive(Debug, Clone)]
pub struct CreateProductParams {
    pub name: String,
    pub generic_name: Option<String>,
    pub description: Option<String>,
    pub category: ProductCategory,
    pub dosage_form: String,
    pub strength: String,
    pub manufacturer: String,
    pub barcode: Option<String>,
    pub active_ingredients: JsonValue,
}

#[derive(Debug, Clone)]
pub struct UpdateProductParams {
    pub id: DbId,
    pub name: Option<String>,
    pub generic_name: Option<String>,
    pub description: Option<String>,
    pub category: Option<ProductCategory>,
    pub dosage_form: Option<String>,
    pub strength: Option<String>,
    pub manufacturer: Option<String>,
    pub barcode: Option<String>,
    pub active_ingredients: Option<JsonValue>,
}
