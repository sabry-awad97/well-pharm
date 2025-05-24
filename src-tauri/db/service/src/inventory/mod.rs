use async_trait::async_trait;
use chrono::{DateTime, NaiveDate, Utc};
use db_entity::inventory::dto::InventoryItemUpdateParams;
use db_entity::inventory_batch::dto::{
    BatchCreateParams, BatchTransactionParams, BatchUpdateParams,
};
use db_entity::utils::db_id::DbId;
use db_entity::{Inventory, InventoryModel, Product, ProductModel};
use rust_decimal::Decimal;
use rust_decimal::prelude::FromPrimitive;
use rust_decimal::prelude::{FromStr, ToPrimitive}; // For Decimal conversion
use sea_orm::ColumnTrait;
use sea_orm::prelude::Expr;
use sea_orm::{
    ActiveModelTrait, ActiveValue, DatabaseConnection, EntityTrait, IntoActiveModel, QueryFilter,
    QueryOrder, Set, TryIntoModel,
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
    pub id: DbId,
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

/// Batch information for inventory items
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchItem {
    pub id: DbId,
    pub product_id: DbId,
    pub batch_number: String,
    pub quantity: u32,
    pub manufacturing_date: Option<String>,
    pub expiry_date: Option<String>,
    pub purchase_price: f64,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Repository trait for inventory operations
#[async_trait]
pub trait InventoryRepository: Send + Sync {
    /// Get inventory items that are below their threshold
    async fn get_low_stock_items(&self) -> Result<Vec<InventoryItem>, ServiceError>;

    /// Update stock level for an inventory item
    async fn update_stock_level(
        &self,
        product_id: DbId,
        new_level: u32,
        record_history: bool,
    ) -> Result<InventoryItem, ServiceError>;

    /// Get current stock level for a product
    async fn get_stock_level(&self, product_id: DbId) -> Result<u32, ServiceError>;

    /// Get inventory item by product ID
    async fn get_inventory_item(
        &self,
        product_id: DbId,
    ) -> Result<Option<InventoryItem>, ServiceError>;

    /// List all inventory items
    async fn list_inventory_items(&self) -> Result<Vec<InventoryItem>, ServiceError>;

    /// Record a stock transaction (purchase, sale, adjustment)
    async fn record_stock_transaction(
        &self,
        product_id: DbId,
        quantity: i32,
        transaction_type: &str,
        notes: Option<String>,
    ) -> Result<(), ServiceError>;

    /// Update product prices
    async fn update_prices(
        &self,
        product_id: DbId,
        purchase_price: Option<f64>,
        selling_price: Option<f64>,
    ) -> Result<InventoryItem, ServiceError>;

    /// Create or update inventory item
    async fn create_or_update_inventory_item(
        &self,
        params: InventoryItemUpdateParams,
    ) -> Result<InventoryItem, ServiceError>;

    // New batch-related methods
    /// Add a new batch for a product
    async fn add_batch(&self, params: BatchCreateParams) -> Result<BatchItem, ServiceError>;

    /// Update an existing batch
    async fn update_batch(&self, params: BatchUpdateParams) -> Result<BatchItem, ServiceError>;

    /// Get a batch by ID
    async fn get_batch(&self, batch_id: DbId) -> Result<Option<BatchItem>, ServiceError>;

    /// List all batches for a product
    async fn list_batches_by_product(
        &self,
        product_id: DbId,
    ) -> Result<Vec<BatchItem>, ServiceError>;

    /// Record a batch transaction (purchase, sale, adjustment)
    async fn record_batch_transaction(
        &self,
        params: BatchTransactionParams,
    ) -> Result<(), ServiceError>;

    /// Get soon-to-expire batches
    async fn get_expiring_batches(&self, days: u32) -> Result<Vec<BatchItem>, ServiceError>;
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
                    id: product.id.into(),
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
            id: product.id.into(),
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

    async fn to_batch_item(
        &self,
        batch: &db_entity::inventory_batch::Model,
    ) -> Result<BatchItem, ServiceError> {
        Ok(BatchItem {
            id: batch.id.into(),
            product_id: batch.product_id.into(),
            batch_number: batch.batch_number.clone(),
            quantity: batch.quantity,
            manufacturing_date: batch.manufacturing_date.map(|d| d.to_string()),
            expiry_date: batch.expiry_date.map(|d| d.to_string()),
            purchase_price: batch.purchase_price.to_f64().unwrap_or(0.0),
            notes: batch.notes.clone(),
            created_at: batch.created_at,
            updated_at: batch.updated_at,
        })
    }

    // Helper method to update total stock level based on batch quantities
    async fn update_product_stock_level(&self, product_id: DbId) -> Result<(), ServiceError> {
        let id: Uuid = product_id.clone().into();
        // Sum all batch quantities for the product
        let batches = db_entity::inventory_batch::Entity::find()
            .filter(db_entity::inventory_batch::Column::ProductId.eq(id))
            .all(&*self.db)
            .await?;

        let total_quantity: u32 = batches.iter().map(|b| b.quantity).sum();

        // Update inventory stock level
        self.update_stock_level(product_id, total_quantity, false)
            .await?;

        Ok(())
    }
}

#[async_trait]
impl InventoryRepository for SeaOrmInventoryRepository {
    async fn get_low_stock_items(&self) -> Result<Vec<InventoryItem>, ServiceError> {
        // Get all inventory items where stock_level <= threshold
        let low_stock_inventory = Inventory::find()
            .filter(
                Expr::col(db_entity::inventory::Column::StockLevel)
                    .lte(Expr::col(db_entity::inventory::Column::Threshold)),
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
        product_id: DbId,
        new_level: u32,
        record_history: bool,
    ) -> Result<InventoryItem, ServiceError> {
        // Find the product
        let product = Product::find_by_id(product_id.clone())
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Product with ID {} not found", product_id))
            })?;

        // Find or create inventory record
        let inventory = Inventory::find_by_id(product_id.clone())
            .one(&*self.db)
            .await?;

        let mut inventory_model = match inventory {
            Some(model) => model.into_active_model(),
            None => {
                // Create new inventory record if it doesn't exist
                let new_model = create_new_inventory_model(product_id);
                new_model.insert(&*self.db).await?.into_active_model()
            }
        };

        // Update stock level
        inventory_model.stock_level = Set(new_level);
        inventory_model.updated_at = Set(Utc::now());

        // Update stock history if requested
        if record_history {
            let current_model = inventory_model.clone().try_into_model()?;
            let history = match current_model.stock_history {
                Some(json) => {
                    let mut history = json.as_array().cloned().unwrap_or_default();
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

    async fn get_stock_level(&self, product_id: DbId) -> Result<u32, ServiceError> {
        // Find the inventory record
        let inventory = Inventory::find_by_id(product_id).one(&*self.db).await?;

        // Return stock level or 0 if no inventory record exists
        Ok(inventory.map(|i| i.stock_level).unwrap_or(0))
    }

    async fn get_inventory_item(
        &self,
        product_id: DbId,
    ) -> Result<Option<InventoryItem>, ServiceError> {
        // Find the product
        let product = match Product::find_by_id(product_id.clone())
            .one(&*self.db)
            .await?
        {
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
        let inventory_map: std::collections::HashMap<DbId, InventoryModel> = inventory_records
            .into_iter()
            .map(|inv| (inv.product_id.into(), inv))
            .collect();

        // Convert to inventory items
        let mut items = Vec::new();
        for product in products {
            let inventory = inventory_map.get(&product.id.into());
            let item = self.to_inventory_item(&product, inventory).await?;
            items.push(item);
        }

        Ok(items)
    }

    async fn record_stock_transaction(
        &self,
        product_id: DbId,
        quantity: i32,
        transaction_type: &str,
        notes: Option<String>,
    ) -> Result<(), ServiceError> {
        // Find the product
        let _product = Product::find_by_id(product_id.clone())
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Product with ID {} not found", product_id))
            })?;

        // Find or create inventory record
        let inventory = Inventory::find_by_id(product_id.clone())
            .one(&*self.db)
            .await?;

        let mut inventory_model = match inventory {
            Some(model) => model.into_active_model(),
            None => {
                // Create new inventory record if it doesn't exist
                let new_model = create_new_inventory_model(product_id);
                new_model.insert(&*self.db).await?.into_active_model()
            }
        };

        // Get current stock level
        let current_stock = match inventory_model.stock_level.clone() {
            ActiveValue::Set(val) => val,
            ActiveValue::Unchanged(val) => val,
            _ => 0,
        };

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
        let history = match current_model.stock_history {
            Some(json) => {
                let mut history = json.as_array().cloned().unwrap_or_default();
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
        product_id: DbId,
        purchase_price: Option<f64>,
        selling_price: Option<f64>,
    ) -> Result<InventoryItem, ServiceError> {
        // Find the product
        let product = Product::find_by_id(product_id.clone())
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Product with ID {} not found", product_id))
            })?;

        // Find or create inventory record
        let inventory = Inventory::find_by_id(product_id.clone())
            .one(&*self.db)
            .await?;

        let mut inventory_model = match inventory {
            Some(model) => model.into_active_model(),
            None => {
                // Create new inventory record if it doesn't exist
                let new_model = create_new_inventory_model(product_id);
                new_model.insert(&*self.db).await?.into_active_model()
            }
        };

        // Update prices if provided
        if let Some(price) = purchase_price {
            // Convert f64 to Decimal using string conversion
            let decimal_price = Decimal::from_str(&price.to_string()).unwrap_or(Decimal::new(0, 0));
            inventory_model.purchase_price = Set(decimal_price);
        }

        if let Some(price) = selling_price {
            // Convert f64 to Decimal using string conversion
            let decimal_price = Decimal::from_str(&price.to_string()).unwrap_or(Decimal::new(0, 0));
            inventory_model.selling_price = Set(decimal_price);
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
        params: InventoryItemUpdateParams,
    ) -> Result<InventoryItem, ServiceError> {
        let InventoryItemUpdateParams {
            product_id,
            stock_level,
            threshold,
            supplier,
            reorder_amount,
            unit,
            notes,
            expiry_date,
            purchase_price,
            selling_price,
        } = params;

        // Find the product
        let product = Product::find_by_id(product_id.clone())
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Product with ID {} not found", product_id))
            })?;

        // Find or create inventory record
        let inventory = Inventory::find_by_id(product_id.clone())
            .one(&*self.db)
            .await?;

        let mut inventory_model = match inventory {
            Some(ref model) => {
                <db_entity::InventoryModel as Clone>::clone(model).into_active_model()
            }
            None => {
                // Create new inventory record if it doesn't exist
                create_new_inventory_model(product_id)
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
        // Convert f64 to Decimal using string conversion
        let purchase_decimal =
            Decimal::from_str(&purchase_price.to_string()).unwrap_or(Decimal::new(0, 0));
        let selling_decimal =
            Decimal::from_str(&selling_price.to_string()).unwrap_or(Decimal::new(0, 0));
        inventory_model.purchase_price = Set(purchase_decimal);
        inventory_model.selling_price = Set(selling_decimal);
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

    async fn add_batch(&self, params: BatchCreateParams) -> Result<BatchItem, ServiceError> {
        // Verify product exists
        let _product = Product::find_by_id(params.product_id.clone())
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Product with ID {} not found", params.product_id))
            })?;

        // Create new batch
        let batch_model = db_entity::inventory_batch::ActiveModel {
            id: Set(Uuid::now_v7()),
            product_id: Set(params.product_id.clone().into()),
            batch_number: Set(params.batch_number),
            quantity: Set(params.quantity),
            manufacturing_date: Set(params.manufacturing_date),
            expiry_date: Set(params.expiry_date),
            purchase_price: Set(
                Decimal::from_f64(params.purchase_price).unwrap_or(Decimal::new(0, 0))
            ),
            notes: Set(params.notes),
            created_at: Set(Utc::now()),
            updated_at: Set(Utc::now()),
        };

        // Insert batch
        let batch = batch_model.insert(&*self.db).await?;

        // Update total stock level
        self.update_product_stock_level(params.product_id).await?;

        // Convert to DTO
        self.to_batch_item(&batch).await
    }

    async fn update_batch(&self, params: BatchUpdateParams) -> Result<BatchItem, ServiceError> {
        // Find batch
        let batch = db_entity::inventory_batch::Entity::find_by_id(params.id.clone())
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Batch with ID {} not found", params.id))
            })?;

        // Update batch
        let mut batch_model = batch.into_active_model();

        if let Some(quantity) = params.quantity {
            batch_model.quantity = Set(quantity);
        }

        if let Some(manufacturing_date) = params.manufacturing_date {
            batch_model.manufacturing_date = Set(Some(manufacturing_date));
        }

        if let Some(expiry_date) = params.expiry_date {
            batch_model.expiry_date = Set(Some(expiry_date));
        }

        if let Some(purchase_price) = params.purchase_price {
            batch_model.purchase_price =
                Set(Decimal::from_f64(purchase_price).unwrap_or(Decimal::new(0, 0)));
        }

        if let Some(notes) = params.notes {
            batch_model.notes = Set(Some(notes));
        }

        batch_model.updated_at = Set(Utc::now());

        // Save changes
        let updated_batch = batch_model.update(&*self.db).await?;

        // Update total stock level
        self.update_product_stock_level(updated_batch.product_id.into())
            .await?;

        // Convert to DTO
        self.to_batch_item(&updated_batch).await
    }

    async fn get_batch(&self, batch_id: DbId) -> Result<Option<BatchItem>, ServiceError> {
        // Find batch
        let batch = db_entity::inventory_batch::Entity::find_by_id(batch_id)
            .one(&*self.db)
            .await?;

        // Convert to DTO if found
        match batch {
            Some(batch) => {
                let batch_item = self.to_batch_item(&batch).await?;
                Ok(Some(batch_item))
            }
            None => Ok(None),
        }
    }

    async fn list_batches_by_product(
        &self,
        product_id: DbId,
    ) -> Result<Vec<BatchItem>, ServiceError> {
        let id: Uuid = product_id.into();
        // Find all batches for product
        let batches = db_entity::inventory_batch::Entity::find()
            .filter(db_entity::inventory_batch::Column::ProductId.eq(id))
            .order_by_desc(db_entity::inventory_batch::Column::ExpiryDate)
            .all(&*self.db)
            .await?;

        // Convert to DTOs
        let mut batch_items = Vec::new();
        for batch in batches {
            let batch_item = self.to_batch_item(&batch).await?;
            batch_items.push(batch_item);
        }

        Ok(batch_items)
    }

    async fn record_batch_transaction(
        &self,
        params: BatchTransactionParams,
    ) -> Result<(), ServiceError> {
        // Find batch
        let batch = db_entity::inventory_batch::Entity::find_by_id(params.batch_id.clone())
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Batch with ID {} not found", params.batch_id))
            })?;

        // Calculate new quantity
        let current_quantity = batch.quantity;
        let new_quantity = match params.transaction_type.as_str() {
            "purchase" | "adjustment_add" => {
                if params.quantity < 0 {
                    return Err(ServiceError::InvalidValue(
                        "Quantity must be positive for purchase or add adjustment".to_string(),
                    ));
                }
                current_quantity.saturating_add(params.quantity as u32)
            }
            "sale" | "adjustment_remove" => {
                if params.quantity < 0 {
                    return Err(ServiceError::InvalidValue(
                        "Quantity must be positive for sale or remove adjustment".to_string(),
                    ));
                }
                current_quantity.saturating_sub(params.quantity as u32)
            }
            _ => {
                return Err(ServiceError::InvalidValue(format!(
                    "Invalid transaction type: {}",
                    params.transaction_type
                )));
            }
        };

        // Update batch quantity
        let mut batch_model = batch.clone().into_active_model();
        batch_model.quantity = Set(new_quantity);
        batch_model.updated_at = Set(Utc::now());

        // Update notes if provided
        if let Some(note) = params.notes {
            batch_model.notes = Set(Some(note));
        }

        // Save changes
        batch_model.update(&*self.db).await?;

        // Update total stock level
        self.update_product_stock_level(batch.product_id.into())
            .await?;

        Ok(())
    }

    async fn get_expiring_batches(&self, days: u32) -> Result<Vec<BatchItem>, ServiceError> {
        // Calculate expiry threshold date
        let now = Utc::now().naive_utc().date();
        let threshold_date = now + chrono::Duration::days(days as i64);

        // Find batches expiring within the threshold
        let batches = db_entity::inventory_batch::Entity::find()
            .filter(
                db_entity::inventory_batch::Column::ExpiryDate
                    .is_not_null()
                    .and(
                        db_entity::inventory_batch::Column::ExpiryDate
                            .lte(threshold_date)
                            .and(db_entity::inventory_batch::Column::ExpiryDate.gte(now)),
                    )
                    .and(db_entity::inventory_batch::Column::Quantity.gt(0)),
            )
            .order_by_asc(db_entity::inventory_batch::Column::ExpiryDate)
            .all(&*self.db)
            .await?;

        // Convert to DTOs
        let mut batch_items = Vec::new();
        for batch in batches {
            let batch_item = self.to_batch_item(&batch).await?;
            batch_items.push(batch_item);
        }

        Ok(batch_items)
    }
}

fn create_new_inventory_model(product_id: DbId) -> db_entity::inventory::ActiveModel {
    db_entity::inventory::ActiveModel {
        product_id: Set(product_id.into()),
        stock_level: Set(0),
        threshold: Set(10),
        created_at: Set(Utc::now()),
        updated_at: Set(Utc::now()),
        price_updated_at: Set(Utc::now()),
        purchase_price: Set(Decimal::new(0, 0)),
        selling_price: Set(Decimal::new(0, 0)),
        ..Default::default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::NaiveDate;
    use db_entity::utils::db_id::DbId;
    use pretty_assertions::assert_eq;
    use sea_orm::{DatabaseBackend, MockDatabase};
    use std::str::FromStr;

    const TEST_PRODUCT_ID: &str = "01890289-8b6e-7cc3-98c4-dc0c0c07398f";

    fn create_test_product() -> db_entity::ProductModel {
        let product_id = DbId::from_str(TEST_PRODUCT_ID).unwrap().into();
        let now = Utc::now();
        db_entity::ProductModel {
            id: product_id,
            name: "Test Product".to_string(),
            generic_name: Some("Generic Test".to_string()),
            description: Some("Test description".to_string()),
            category: db_entity::ProductCategory::OTC,
            dosage_form: "Tablet".to_string(),
            strength: "500mg".to_string(),
            manufacturer: "Test Manufacturer".to_string(),
            barcode: Some("1234567890".to_string()),
            active_ingredients: json!(["ingredient1", "ingredient2"]),
            created_at: now.into(),
            updated_at: now.into(),
        }
    }

    fn create_test_inventory() -> db_entity::InventoryModel {
        let product_id = DbId::from_str(TEST_PRODUCT_ID).unwrap().into();
        let now = Utc::now();
        db_entity::InventoryModel {
            product_id,
            stock_level: 50,
            threshold: 10,
            supplier: Some("Test Supplier".to_string()),
            last_ordered: Some(now),
            stock_history: Some(json!([50])),
            reorder_amount: Some(20),
            unit: Some("Box".to_string()),
            notes: Some("Test notes".to_string()),
            expiry_date: Some(NaiveDate::from_ymd_opt(2025, 12, 31).unwrap()),
            purchase_price: Decimal::from_str("10.50").unwrap(),
            selling_price: Decimal::from_str("15.75").unwrap(),
            price_updated_at: now,
            created_at: now,
            updated_at: now,
        }
    }

    #[tokio::test]
    async fn test_get_inventory_item() {
        // Create test data
        let product = create_test_product();
        let inventory = create_test_inventory();
        let product_id = DbId::from_str(TEST_PRODUCT_ID).unwrap();

        // Mock database
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results(vec![vec![product.clone()]])
            .append_query_results(vec![vec![inventory.clone()]])
            .into_connection();

        let repo = SeaOrmInventoryRepository::new(Arc::new(db));

        // Test get_inventory_item
        let result = repo.get_inventory_item(product_id.clone()).await;
        assert!(result.is_ok());

        let item = result.unwrap().unwrap();
        assert_eq!(item.id, product_id);
        assert_eq!(item.name, "Test Product");
        assert_eq!(item.stock_level, 50);
        assert_eq!(item.purchase_price, 10.50);
        assert_eq!(item.selling_price, 15.75);
    }

    #[tokio::test]
    async fn test_update_stock_level() {
        // Create test data
        let product = create_test_product();
        let inventory = create_test_inventory();
        let updated_inventory = {
            let mut inv = inventory.clone();
            inv.stock_level = 75;
            inv.stock_history = Some(json!([50, 75]));
            inv
        };
        let product_id = DbId::from_str(TEST_PRODUCT_ID).unwrap();

        // Mock database
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results(vec![vec![product.clone()]])
            .append_query_results(vec![vec![inventory.clone()]])
            .append_query_results(vec![vec![updated_inventory.clone()]])
            .into_connection();

        let repo = SeaOrmInventoryRepository::new(Arc::new(db));

        // Test update_stock_level
        let result = repo.update_stock_level(product_id, 75, true).await;
        assert!(result.is_ok());

        let item = result.unwrap();
        assert_eq!(item.stock_level, 75);
    }

    #[tokio::test]
    async fn test_update_prices() {
        // Create test data
        let product = create_test_product();
        let inventory = create_test_inventory();
        let updated_inventory = {
            let mut inv = inventory.clone();
            inv.purchase_price = Decimal::from_str("12.50").unwrap();
            inv.selling_price = Decimal::from_str("18.75").unwrap();
            inv
        };
        let product_id = DbId::from_str(TEST_PRODUCT_ID).unwrap();

        // Mock database
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results(vec![vec![product.clone()]])
            .append_query_results(vec![vec![inventory.clone()]])
            .append_query_results(vec![vec![updated_inventory.clone()]])
            .into_connection();

        let repo = SeaOrmInventoryRepository::new(Arc::new(db));

        // Test update_prices
        let result = repo
            .update_prices(product_id, Some(12.50), Some(18.75))
            .await;
        assert!(result.is_ok());

        let item = result.unwrap();
        assert_eq!(item.purchase_price, 12.50);
        assert_eq!(item.selling_price, 18.75);
    }

    #[tokio::test]
    async fn test_record_stock_transaction() {
        // Create test data
        let product = create_test_product();
        let inventory = create_test_inventory();
        let updated_inventory = {
            let mut inv = inventory.clone();
            inv.stock_level = 60;
            inv.stock_history = Some(json!([50, 60]));
            inv
        };
        let product_id = DbId::from_str(TEST_PRODUCT_ID).unwrap();

        // Mock database
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results(vec![vec![product.clone()]])
            .append_query_results(vec![vec![inventory.clone()]])
            .append_query_results(vec![vec![updated_inventory.clone()]])
            .into_connection();

        let repo = SeaOrmInventoryRepository::new(Arc::new(db));

        // Test record_stock_transaction for purchase
        let result = repo
            .record_stock_transaction(product_id, 10, "purchase", None)
            .await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_record_stock_transaction_invalid_type() {
        // Create test data
        let product = create_test_product();
        let inventory = create_test_inventory();
        let product_id = DbId::from_str(TEST_PRODUCT_ID).unwrap();

        // Mock database
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results(vec![vec![product.clone()]])
            .append_query_results(vec![vec![inventory.clone()]])
            .into_connection();

        let repo = SeaOrmInventoryRepository::new(Arc::new(db));

        // Test record_stock_transaction with invalid type
        let result = repo
            .record_stock_transaction(product_id, 10, "invalid_type", None)
            .await;
        assert!(result.is_err());
        if let Err(err) = result {
            match err {
                ServiceError::InvalidValue(msg) => {
                    assert!(msg.contains("Invalid transaction type"));
                }
                _ => panic!("Expected InvalidValue error"),
            }
        }
    }

    #[tokio::test]
    async fn test_create_or_update_inventory_item() {
        // Create test data
        let product = create_test_product();
        let inventory = create_test_inventory();
        let updated_inventory = {
            let mut inv = inventory.clone();
            inv.stock_level = 100;
            inv.threshold = 20;
            inv.supplier = Some("New Supplier".to_string());
            inv.purchase_price = Decimal::from_str("20.00").unwrap();
            inv.selling_price = Decimal::from_str("30.00").unwrap();
            inv
        };
        let product_id = DbId::from_str(TEST_PRODUCT_ID).unwrap();

        // Mock database
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results(vec![vec![product.clone()]])
            .append_query_results(vec![vec![inventory.clone()]])
            .append_query_results(vec![vec![updated_inventory.clone()]])
            .into_connection();

        let repo = SeaOrmInventoryRepository::new(Arc::new(db));

        // Test create_or_update_inventory_item
        let result = repo
            .create_or_update_inventory_item(InventoryItemUpdateParams {
                product_id,
                stock_level: 100,
                threshold: 20,
                supplier: Some("New Supplier".to_string()),
                reorder_amount: Some(30),
                unit: Some("Box".to_string()),
                notes: Some("Updated notes".to_string()),
                expiry_date: Some("2025-12-31".to_string()),
                purchase_price: 20.00,
                selling_price: 30.00,
            })
            .await;
        assert!(result.is_ok());

        let item = result.unwrap();
        assert_eq!(item.stock_level, 100);
        assert_eq!(item.threshold, 20);
        assert_eq!(item.supplier, Some("New Supplier".to_string()));
        assert_eq!(item.purchase_price, 20.00);
        assert_eq!(item.selling_price, 30.00);
    }

    #[tokio::test]
    async fn test_create_new_inventory_item() {
        // Create test data
        let product = create_test_product();
        let new_inventory = create_test_inventory();
        let product_id: DbId = DbId::from_str(TEST_PRODUCT_ID).unwrap();

        // Mock database
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results(vec![vec![product.clone()]])
            .append_query_results::<InventoryModel, _, _>(vec![vec![]]) // No existing inventory
            .append_query_results::<InventoryModel, _, _>(vec![vec![new_inventory.clone()]])
            .into_connection();

        let repo = SeaOrmInventoryRepository::new(Arc::new(db));

        // Test create_or_update_inventory_item for new item
        let result = repo
            .create_or_update_inventory_item(InventoryItemUpdateParams {
                product_id: product_id.clone(),
                stock_level: 50,
                threshold: 10,
                supplier: Some("Test Supplier".to_string()),
                reorder_amount: Some(20),
                unit: Some("Box".to_string()),
                notes: Some("Test notes".to_string()),
                expiry_date: Some("2025-12-31".to_string()),
                purchase_price: 10.50,
                selling_price: 15.75,
            })
            .await;
        assert!(result.is_ok());

        let item = result.unwrap();
        assert_eq!(item.stock_level, 50);
        assert_eq!(item.purchase_price, 10.50);
        assert_eq!(item.selling_price, 15.75);
    }

    #[tokio::test]
    async fn test_get_low_stock_items() {
        // Create test data
        let product = create_test_product();
        let inventory = {
            let mut inv = create_test_inventory();
            inv.stock_level = 5; // Below threshold of 10
            inv
        };

        // Mock database
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results(vec![vec![inventory.clone()]])
            .append_query_results(vec![vec![product.clone()]])
            .into_connection();

        let repo = SeaOrmInventoryRepository::new(Arc::new(db));

        // Test get_low_stock_items
        let result = repo.get_low_stock_items().await;
        assert!(result.is_ok());

        let items = result.unwrap();
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].stock_level, 5);
        assert_eq!(items[0].threshold, 10);
    }

    #[tokio::test]
    async fn test_invalid_expiry_date() {
        // Create test data
        let product = create_test_product();
        let product_id = DbId::from_str(TEST_PRODUCT_ID).unwrap();

        // Mock database
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<ProductModel, _, _>(vec![vec![product.clone()]])
            .append_query_results::<InventoryModel, _, _>(vec![vec![]])
            .into_connection();

        let repo = SeaOrmInventoryRepository::new(Arc::new(db));

        // Test with invalid expiry date format
        let result = repo
            .create_or_update_inventory_item(InventoryItemUpdateParams {
                product_id: product_id.clone(),
                stock_level: 50,
                threshold: 10,
                supplier: Some("Test Supplier".to_string()),
                reorder_amount: Some(20),
                unit: Some("Box".to_string()),
                notes: Some("Test notes".to_string()),
                expiry_date: Some("Invalid Date".to_string()), // Invalid date
                purchase_price: 10.50,
                selling_price: 15.75,
            })
            .await;

        assert!(result.is_err());
        if let Err(err) = result {
            match err {
                ServiceError::InvalidValue(msg) => {
                    assert!(msg.contains("Invalid expiry date format"));
                }
                _ => panic!("Expected InvalidValue error"),
            }
        }
    }
}
