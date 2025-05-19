use async_trait::async_trait;
use chrono::{DateTime, Utc};
use db_entity::{Product, ProductModel};
use sea_orm::{DatabaseConnection, EntityTrait, QueryOrder};
use std::sync::Arc;
use uuid::Uuid;

use crate::error::ServiceError;

/// Inventory item with stock information
#[derive(Debug, Clone)]
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

    /// Helper method to convert a product model to an inventory item
    async fn product_to_inventory_item(
        &self,
        product: &ProductModel,
    ) -> Result<InventoryItem, ServiceError> {
        // For now, we'll use a simple approach where inventory data is stored
        // in the product's metadata. In a real implementation, you would have
        // a separate inventory table with foreign keys to products.

        // Default values if metadata doesn't exist
        let stock_level = 0;
        let threshold = 10;
        let supplier = None;
        let last_ordered = None;
        let stock_history = None;
        let reorder_amount = None;
        let unit = None;

        // Extract category as string
        let category = Some(format!("{:?}", product.category));

        Ok(InventoryItem {
            id: product.id,
            name: product.name.clone(),
            stock_level,
            threshold,
            category,
            supplier,
            last_ordered,
            stock_history,
            reorder_amount,
            unit,
        })
    }
}

#[async_trait]
impl InventoryRepository for SeaOrmInventoryRepository {
    async fn get_low_stock_items(&self) -> Result<Vec<InventoryItem>, ServiceError> {
        // Instead of querying the database, return hardcoded mock data
        // This allows testing the frontend without a fully implemented database schema

        // Create a vector of mock inventory items with various stock levels and properties
        let mock_items = vec![
            InventoryItem {
                id: Uuid::parse_str("f47ac10b-58cc-4372-a567-0e02b2c3d479").unwrap(),
                name: "Paracetamol 500mg".to_string(),
                stock_level: 15,
                threshold: 100,
                category: Some("OTC".to_string()),
                supplier: Some("PharmaMed Supplies".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(14)),
                stock_history: Some(vec![120, 100, 80, 50, 30, 15]),
                reorder_amount: Some(200),
                unit: Some("boxes".to_string()),
            },
            InventoryItem {
                id: Uuid::parse_str("f47ac10b-58cc-4372-a567-0e02b2c3d480").unwrap(),
                name: "Amoxicillin 250mg".to_string(),
                stock_level: 32,
                threshold: 100,
                category: Some("Prescription".to_string()),
                supplier: Some("MediSource Inc.".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(30)),
                stock_history: Some(vec![150, 120, 90, 60, 32]),
                reorder_amount: Some(150),
                unit: Some("bottles".to_string()),
            },
            InventoryItem {
                id: Uuid::parse_str("f47ac10b-58cc-4372-a567-0e02b2c3d481").unwrap(),
                name: "Ibuprofen 400mg".to_string(),
                stock_level: 78,
                threshold: 100,
                category: Some("OTC".to_string()),
                supplier: Some("PharmaMed Supplies".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(45)),
                stock_history: Some(vec![200, 180, 150, 120, 100, 78]),
                reorder_amount: Some(150),
                unit: Some("boxes".to_string()),
            },
            InventoryItem {
                id: Uuid::parse_str("f47ac10b-58cc-4372-a567-0e02b2c3d482").unwrap(),
                name: "Cetirizine 10mg".to_string(),
                stock_level: 8,
                threshold: 50,
                category: Some("OTC".to_string()),
                supplier: Some("AllCare Pharmaceuticals".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(60)),
                stock_history: Some(vec![80, 60, 40, 25, 8]),
                reorder_amount: Some(100),
                unit: Some("packs".to_string()),
            },
            InventoryItem {
                id: Uuid::parse_str("f47ac10b-58cc-4372-a567-0e02b2c3d483").unwrap(),
                name: "Metformin 500mg".to_string(),
                stock_level: 5,
                threshold: 75,
                category: Some("Prescription".to_string()),
                supplier: Some("MediSource Inc.".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(21)),
                stock_history: Some(vec![100, 80, 50, 30, 5]),
                reorder_amount: Some(100),
                unit: Some("bottles".to_string()),
            },
            InventoryItem {
                id: Uuid::parse_str("f47ac10b-58cc-4372-a567-0e02b2c3d484").unwrap(),
                name: "Aspirin 75mg".to_string(),
                stock_level: 25,
                threshold: 60,
                category: Some("OTC".to_string()),
                supplier: Some("PharmaMed Supplies".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(10)),
                stock_history: Some(vec![100, 75, 50, 25]),
                reorder_amount: Some(100),
                unit: Some("boxes".to_string()),
            },
            InventoryItem {
                id: Uuid::parse_str("f47ac10b-58cc-4372-a567-0e02b2c3d485").unwrap(),
                name: "Omeprazole 20mg".to_string(),
                stock_level: 12,
                threshold: 40,
                category: Some("Prescription".to_string()),
                supplier: Some("AllCare Pharmaceuticals".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(7)),
                stock_history: Some(vec![50, 40, 30, 20, 12]),
                reorder_amount: Some(50),
                unit: Some("packs".to_string()),
            },
            InventoryItem {
                id: Uuid::parse_str("f47ac10b-58cc-4372-a567-0e02b2c3d486").unwrap(),
                name: "Simvastatin 40mg".to_string(),
                stock_level: 3,
                threshold: 30,
                category: Some("Prescription".to_string()),
                supplier: Some("MediSource Inc.".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(90)),
                stock_history: Some(vec![40, 30, 20, 10, 3]),
                reorder_amount: Some(40),
                unit: Some("bottles".to_string()),
            },
        ];

        Ok(mock_items)
    }

    async fn update_stock_level(
        &self,
        product_id: Uuid,
        new_level: u32,
        _record_history: bool,
    ) -> Result<InventoryItem, ServiceError> {
        // Find the product
        let product = Product::find_by_id(product_id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Product with ID {} not found", product_id))
            })?;

        // Convert to inventory item
        let mut item = self.product_to_inventory_item(&product).await?;

        // Update stock level
        item.stock_level = new_level;

        // In a real implementation, you would update the inventory table
        // and optionally record in history table if record_history is true

        Ok(item)
    }

    async fn get_stock_level(&self, product_id: Uuid) -> Result<u32, ServiceError> {
        // Find the product
        let product = Product::find_by_id(product_id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Product with ID {} not found", product_id))
            })?;

        // Get inventory item
        let item = self.product_to_inventory_item(&product).await?;

        Ok(item.stock_level)
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

        // Convert to inventory item
        let item = self.product_to_inventory_item(&product).await?;

        Ok(Some(item))
    }

    async fn list_inventory_items(&self) -> Result<Vec<InventoryItem>, ServiceError> {
        // Get all products
        let products = Product::find()
            .order_by_asc(db_entity::product::Column::Name)
            .all(&*self.db)
            .await?;

        // Convert to inventory items
        let mut items = Vec::new();
        for product in products {
            let item = self.product_to_inventory_item(&product).await?;
            items.push(item);
        }

        Ok(items)
    }

    async fn record_stock_transaction(
        &self,
        product_id: Uuid,
        quantity: i32,
        transaction_type: &str,
        _notes: Option<String>,
    ) -> Result<(), ServiceError> {
        // Find the product
        let product = Product::find_by_id(product_id)
            .one(&*self.db)
            .await?
            .ok_or_else(|| {
                ServiceError::NotFound(format!("Product with ID {} not found", product_id))
            })?;

        // Get current inventory item
        let mut item = self.product_to_inventory_item(&product).await?;

        // Update stock level based on transaction type
        match transaction_type {
            "purchase" | "adjustment_add" => {
                item.stock_level = item.stock_level.saturating_add(quantity as u32);
            }
            "sale" | "adjustment_subtract" => {
                item.stock_level = item.stock_level.saturating_sub(quantity as u32);
            }
            _ => {
                return Err(ServiceError::InvalidValue(format!(
                    "Invalid transaction type: {}",
                    transaction_type
                )));
            }
        }

        // In a real implementation, you would:
        // 1. Update the inventory table with new stock level
        // 2. Record the transaction in a transaction history table
        // 3. Update the stock_history array

        Ok(())
    }
}
