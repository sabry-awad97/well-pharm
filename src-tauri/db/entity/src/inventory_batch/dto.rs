use crate::utils::db_id::DbId;
use chrono::NaiveDate;

// Add batch-related DTOs
#[derive(Debug, Clone)]
pub struct BatchCreateParams {
    pub product_id: DbId,
    pub batch_number: String,
    pub quantity: u32,
    pub manufacturing_date: Option<NaiveDate>,
    pub expiry_date: Option<NaiveDate>,
    pub purchase_price: f64,
    pub notes: Option<String>,
}

#[derive(Debug, Clone)]
pub struct BatchUpdateParams {
    pub id: DbId,
    pub quantity: Option<u32>,
    pub manufacturing_date: Option<NaiveDate>,
    pub expiry_date: Option<NaiveDate>,
    pub purchase_price: Option<f64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone)]
pub struct BatchTransactionParams {
    pub batch_id: DbId,
    pub quantity: i32,
    pub transaction_type: String,
    pub notes: Option<String>,
}
