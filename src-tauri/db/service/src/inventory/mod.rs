use async_trait::async_trait;
use chrono::{DateTime, NaiveDate, Utc};
use db_entity::{Inventory, InventoryModel, Product, ProductModel};
use rust_decimal::prelude::ToPrimitive; // Add this import for Decimal conversion
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, QueryFilter,
    QueryOrder, Set,
};
use serde::Serialize;
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use crate::error::ServiceError;

/// Inventory item with stock information
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryItem {
    pub id: Uuid,
    pub name: String,
    pub stock_level: u32,
    pub threshold: u32,
    pub category: Option<String>,
    pub supplier: Option<String>,
    pub last_ordered: Option<DateTime<Utc>>,
    pub stock_history: Option<Vec<u32>>,
    pub reorder_amount: Option<u32>,
    pub unit: Option<String>,
    pub notes: Option<String>,
    pub expiry_date: Option<String>,
    pub purchase_price: f64,
    pub selling_price: f64,
    pub price_updated_at: DateTime<Utc>,
}

/// Repository trait for inventory operations
#[async_trait]
pub trait InventoryRepository: Send + Sync {
    /// Get inventory items that are below their threshold
    async fn get_low_stock_items(&self) -> Result<Vec<InventoryItem>, ServiceError>;

    /// Update stock level for an inventory item
    async fn update_stock_level(
        &self,
        product_id: Uuid,
        new_level: u32,
        record_history: bool,
    ) -> Result<InventoryItem, ServiceError>;

    /// Get current stock level for a product
    async fn get_stock_level(&self, product_id: Uuid) -> Result<u32, ServiceError>;

    /// Get inventory item by product ID
    async fn get_inventory_item(
        &self,
        product_id: Uuid,
    ) -> Result<Option<InventoryItem>, ServiceError>;

    /// List all inventory items
    async fn list_inventory_items(&self) -> Result<Vec<InventoryItem>, ServiceError>;

    /// Record a stock transaction (purchase, sale, adjustment)
    async fn record_stock_transaction(
        &self,
        product_id: Uuid,
        quantity: i32,
        transaction_type: &str,
        notes: Option<String>,
    ) -> Result<(), ServiceError>;

    /// Update product prices
    async fn update_prices(
        &self,
        product_id: Uuid,
        purchase_price: Option<f64>,
        selling_price: Option<f64>,
    ) -> Result<InventoryItem, ServiceError>;

    /// Create or update inventory item
    async fn create_or_update_inventory_item(
        &self,
        product_id: Uuid,
        stock_level: u32,
        threshold: u32,
        supplier: Option<String>,
        reorder_amount: Option<u32>,
        unit: Option<String>,
        notes: Option<String>,
        expiry_date: Option<String>,
        purchase_price: f64,
        selling_price: f64,
    ) -> Result<InventoryItem, ServiceError>;
}

/// Sea-ORM implementation of InventoryRepository
pub struct SeaOrmInventoryRepository {
    db: Arc<DatabaseConnection>,
}

impl SeaOrmInventoryRepository {
    /// Create a new SeaOrmInventoryRepository
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    /// Helper method to convert a product model and inventory model to an inventory item
    async fn to_inventory_item(
        &self,
        product: &ProductModel,
        inventory: Option<&InventoryModel>,
    ) -> Result<InventoryItem, ServiceError> {
        let inventory = match inventory {
            Some(inv) => inv,
            None => {
                // Return default values if no inventory record exists
                return Ok(InventoryItem {
                    id: product.id,
                    name: product.name.clone(),
                    stock_level: 0,
                    threshold: 10,
                    category: Some(product.category.to_string()),
                    supplier: None,
                    last_ordered: None,
                    stock_history: None,
                    reorder_amount: None,
                    unit: None,
                    notes: None,
                    expiry_date: None,
                    purchase_price: 0.0,
                    selling_price: 0.0,
                    price_updated_at: Utc::now(),
                });
            }
        };

        // Convert stock history JSON to Vec<u32> if it exists
        let stock_history = inventory.stock_history.as_ref().and_then(|json| {
            json.as_array().map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_u64().map(|n| n as u32))
                    .collect::<Vec<u32>>()
            })
        });

        // Format expiry date as string if it exists
        let expiry_date = inventory
            .expiry_date
            .map(|date| date.format("%Y-%m-%d").to_string());

        // Convert decimal to f64 for prices using ToPrimitive trait
        let purchase_price = inventory.purchase_price.to_f64().unwrap_or(0.0);
        let selling_price = inventory.selling_price.to_f64().unwrap_or(0.0);

        Ok(InventoryItem {
            id: product.id,
            name: product.name.clone(),
            stock_level: inventory.stock_level,
            threshold: inventory.threshold,
            category: Some(product.category.to_string()), // Fix: Use to_string() instead of format!
            supplier: inventory.supplier.clone(),
            last_ordered: inventory.last_ordered,
            stock_history,
            reorder_amount: inventory.reorder_amount,
            unit: inventory.unit.clone(),
            notes: inventory.notes.clone(),
            expiry_date,
            purchase_price,
            selling_price,
            price_updated_at: inventory.price_updated_at,
        })
    }
}

#[async_trait]
impl InventoryRepository for SeaOrmInventoryRepository {
    async fn get_low_stock_items(&self) -> Result<Vec<InventoryItem>, ServiceError> {
        // Get all inventory items where stock_level <= threshold
        let low_stock_inventory = Inventory::find()
            .filter(
                db_entity::inventory::Column::StockLevel
                    .lte(db_entity::inventory::Column::Threshold),
            )
            .all(&*self.db)
            .await?;

        // Get the associated products
        let mut result = Vec::new();
        for inventory in low_stock_inventory {
            let product = Product::find_by_id(inventory.product_id)
                .one(&*self.db)
                .await?
                .ok_or_else(|| {
                    ServiceError::NotFound(format!(
                        "Product with ID {} not found",
                        inventory.product_id
                    ))
                })?;

            let item = self.to_inventory_item(&product, Some(&inventory)).await?;
            result.push(item);
        }

        Ok(result)
    }

    async fn update_stock_level(
        &self,
        product_id: Uuid,
        new_level: u32,
        record_history: bool,
    ) -> Result<InventoryItem, ServiceError> {
        // Find the product
        let product = Product::find_by_id(product_id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Product with ID {} not found", product_id))
            })?;

        // Find or create inventory record
        let inventory = Inventory::find_by_id(product_id).one(&*self.db).await?;

        let mut inventory_model = match inventory {
            Some(model) => model.into_active_model(),
            None => {
                // Create new inventory record if it doesn't exist
                let mut new_model = db_entity::inventory::ActiveModel::default();
                new_model.product_id = Set(product_id);
                new_model.stock_level = Set(0); // Will be updated below
                new_model.threshold = Set(10); // Default threshold
                new_model.created_at = Set(Utc::now());
                new_model.updated_at = Set(Utc::now());
                new_model.price_updated_at = Set(Utc::now());
                new_model.purchase_price = Set(0.0.into());
                new_model.selling_price = Set(0.0.into());
                new_model.insert(&*self.db).await?.into_active_model()
            }
        };

        // Update stock level
        inventory_model.stock_level = Set(new_level);
        inventory_model.updated_at = Set(Utc::now());

        // Update stock history if requested
        if record_history {
            let current_model = inventory_model.clone().try_into_model()?;
            let mut history = match current_model.stock_history {
                Some(json) => {
                    let mut history = json.as_array().map(|arr| arr.clone()).unwrap_or_default();
                    history.push(new_level.into());
                    json!(history)
                }
                None => {
                    json!([new_level])
                }
            };

            inventory_model.stock_history = Set(Some(history));
        }

        // Save changes
        let updated_inventory = inventory_model.update(&*self.db).await?;

        // Return updated inventory item
        self.to_inventory_item(&product, Some(&updated_inventory))
            .await
    }

    async fn get_stock_level(&self, product_id: Uuid) -> Result<u32, ServiceError> {
        // Find the inventory record
        let inventory = Inventory::find_by_id(product_id).one(&*self.db).await?;

        // Return stock level or 0 if no inventory record exists
        Ok(inventory.map(|i| i.stock_level).unwrap_or(0))
    }

    async fn get_inventory_item(
        &self,
        product_id: Uuid,
    ) -> Result<Option<InventoryItem>, ServiceError> {
        // Find the product
        let product = match Product::find_by_id(product_id).one(&*self.db).await? {
            Some(p) => p,
            None => return Ok(None),
        };

        // Find the inventory record
        let inventory = Inventory::find_by_id(product_id).one(&*self.db).await?;

        // Convert to inventory item
        let item = self.to_inventory_item(&product, inventory.as_ref()).await?;

        Ok(Some(item))
    }

    async fn list_inventory_items(&self) -> Result<Vec<InventoryItem>, ServiceError> {
        // Get all products
        let products = Product::find()
            .order_by_asc(db_entity::product::Column::Name)
            .all(&*self.db)
            .await?;

        // Get all inventory records
        let inventory_records = Inventory::find().all(&*self.db).await?;

        // Create a map of product_id to inventory record for quick lookup
        let inventory_map: std::collections::HashMap<Uuid, InventoryModel> = inventory_records
            .into_iter()
            .map(|inv| (inv.product_id, inv))
            .collect();

        // Convert to inventory items
        let mut items = Vec::new();
        for product in products {
            let inventory = inventory_map.get(&product.id);
            let item = self.to_inventory_item(&product, inventory).await?;
            items.push(item);
        }

        Ok(items)
    }

    async fn record_stock_transaction(
        &self,
        product_id: Uuid,
        quantity: i32,
        transaction_type: &str,
        notes: Option<String>,
    ) -> Result<(), ServiceError> {
        // Find the product
        let product = Product::find_by_id(product_id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Product with ID {} not found", product_id))
            })?;

        // Find or create inventory record
        let inventory = Inventory::find_by_id(product_id).one(&*self.db).await?;

        let mut inventory_model = match inventory {
            Some(model) => model.into_active_model(),
            None => {
                // Create new inventory record if it doesn't exist
                let new_model = create_new_inventory_model(product_id).await;
                new_model.insert(&*self.db).await?.into_active_model()
            }
        };

        // Get current stock level
        let current_stock = inventory_model.stock_level.clone().unwrap_or(0);

        // Update stock level based on transaction type
        let new_stock = match transaction_type {
            "purchase" | "adjustment_add" => {
                if quantity < 0 {
                    return Err(ServiceError::InvalidValue(
                        "Quantity must be positive for purchase or add adjustment".to_string(),
                    ));
                }
                current_stock.saturating_add(quantity as u32)
            }
            "sale" | "adjustment_subtract" => {
                if quantity < 0 {
                    return Err(ServiceError::InvalidValue(
                        "Quantity must be positive for sale or subtract adjustment".to_string(),
                    ));
                }
                current_stock.saturating_sub(quantity as u32)
            }
            _ => {
                return Err(ServiceError::InvalidValue(format!(
                    "Invalid transaction type: {}",
                    transaction_type
                )));
            }
        };

        // Update stock level
        inventory_model.stock_level = Set(new_stock);

        // Update last_ordered if this is a purchase
        if transaction_type == "purchase" {
            inventory_model.last_ordered = Set(Some(Utc::now()));
        }

        // Update notes if provided
        if let Some(note) = notes {
            inventory_model.notes = Set(Some(note));
        }

        // Update stock history
        let current_model = inventory_model.clone().try_into_model()?;
        let mut history = match current_model.stock_history {
            Some(json) => {
                let mut history = json.as_array().map(|arr| arr.clone()).unwrap_or_default();
                history.push(new_stock.into());
                json!(history)
            }
            None => {
                json!([new_stock])
            }
        };

        inventory_model.stock_history = Set(Some(history));
        inventory_model.updated_at = Set(Utc::now());

        // Save changes
        inventory_model.update(&*self.db).await?;

        Ok(())
    }

    async fn update_prices(
        &self,
        product_id: Uuid,
        purchase_price: Option<f64>,
        selling_price: Option<f64>,
    ) -> Result<InventoryItem, ServiceError> {
        // Find the product
        let product = Product::find_by_id(product_id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Product with ID {} not found", product_id))
            })?;

        // Find or create inventory record
        let inventory = Inventory::find_by_id(product_id).one(&*self.db).await?;

        let mut inventory_model = match inventory {
            Some(model) => model.into_active_model(),
            None => {
                // Create new inventory record if it doesn't exist
                let new_model = create_new_inventory_model(product_id).await;
                new_model.insert(&*self.db).await?.into_active_model()
            }
        };

        // Update prices if provided
        if let Some(price) = purchase_price {
            inventory_model.purchase_price = Set(price.into());
        }

        if let Some(price) = selling_price {
            inventory_model.selling_price = Set(price.into());
        }

        // Update price_updated_at and updated_at
        if purchase_price.is_some() || selling_price.is_some() {
            inventory_model.price_updated_at = Set(Utc::now());
            inventory_model.updated_at = Set(Utc::now());
        }

        // Save changes
        let updated_inventory = inventory_model.update(&*self.db).await?;

        // Return updated inventory item
        self.to_inventory_item(&product, Some(&updated_inventory))
            .await
    }

    async fn create_or_update_inventory_item(
        &self,
        product_id: Uuid,
        stock_level: u32,
        threshold: u32,
        supplier: Option<String>,
        reorder_amount: Option<u32>,
        unit: Option<String>,
        notes: Option<String>,
        expiry_date: Option<String>,
        purchase_price: f64,
        selling_price: f64,
    ) -> Result<InventoryItem, ServiceError> {
        // Find the product
        let product = Product::find_by_id(product_id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Product with ID {} not found", product_id))
            })?;

        // Find or create inventory record
        let inventory = Inventory::find_by_id(product_id).one(&*self.db).await?;

        let mut inventory_model = match inventory {
            Some(model) => model.into_active_model(),
            None => {
                // Create new inventory record if it doesn't exist
                let mut new_model = db_entity::inventory::ActiveModel::default();
                new_model.product_id = Set(product_id);
                new_model.created_at = Set(Utc::now());
                new_model
            }
        };

        // Parse expiry date if provided
        let expiry_date = if let Some(date_str) = expiry_date {
            match NaiveDate::parse_from_str(&date_str, "%Y-%m-%d") {
                Ok(date) => Some(date),
                Err(_) => {
                    return Err(ServiceError::InvalidValue(format!(
                        "Invalid expiry date format: {}. Expected YYYY-MM-DD",
                        date_str
                    )));
                }
            }
        } else {
            None
        };

        // Update all fields
        inventory_model.stock_level = Set(stock_level);
        inventory_model.threshold = Set(threshold);
        inventory_model.supplier = Set(supplier);
        inventory_model.reorder_amount = Set(reorder_amount);
        inventory_model.unit = Set(unit);
        inventory_model.notes = Set(notes);
        inventory_model.expiry_date = Set(expiry_date);
        inventory_model.purchase_price = Set(purchase_price.into());
        inventory_model.selling_price = Set(selling_price.into());
        inventory_model.price_updated_at = Set(Utc::now());
        inventory_model.updated_at = Set(Utc::now());

        // Save changes
        let updated_inventory = if inventory.is_some() {
            inventory_model.update(&*self.db).await?
        } else {
            inventory_model.insert(&*self.db).await?
        };

        // Return updated inventory item
        self.to_inventory_item(&product, Some(&updated_inventory))
            .await
    }
}

async fn create_new_inventory_model(product_id: Uuid) -> db_entity::inventory::ActiveModel {
    let mut new_model = db_entity::inventory::ActiveModel::default();
    new_model.product_id = Set(product_id);
    new_model.stock_level = Set(0);
    new_model.threshold = Set(10);
    new_model.created_at = Set(Utc::now());
    new_model.updated_at = Set(Utc::now());
    new_model.price_updated_at = Set(Utc::now());
    new_model.purchase_price = Set(0.0.into());
    new_model.selling_price = Set(0.0.into());
    new_model
}
