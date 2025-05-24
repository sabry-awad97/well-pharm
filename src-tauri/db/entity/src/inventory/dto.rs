use crate::utils::db_id::DbId;

/// Data Transfer Object for inventory item creation/update
#[derive(Debug, Clone)]
pub struct InventoryItemUpdateParams {
    pub product_id: DbId,
    pub stock_level: u32,
    pub threshold: u32,
    pub supplier: Option<String>,
    pub reorder_amount: Option<u32>,
    pub unit: Option<String>,
    pub notes: Option<String>,
    pub expiry_date: Option<String>,
    pub purchase_price: f64,
    pub selling_price: f64,
}
