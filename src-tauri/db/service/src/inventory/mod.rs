use async_trait::async_trait;
use chrono::{DateTime, Utc};
use db_entity::{Product, ProductModel};
use sea_orm::{DatabaseConnection, EntityTrait, QueryOrder};
use serde::Serialize;
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
        let notes = None;
        let expiry_date = None;

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
            notes,
            expiry_date,
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
                id: Uuid::parse_str("a1b2c3d4-e5f6-7890-1234-567890abcdef").unwrap(),
                name: "Insulin Pen (Type A)".to_string(),
                stock_level: 5,
                threshold: 20,
                category: Some("Prescription".to_string()),
                supplier: Some("BioGen Pharma".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(10)),
                stock_history: Some(vec![30, 25, 20, 15, 10, 5]),
                reorder_amount: Some(50),
                unit: Some("pens".to_string()),
                notes: Some("Critical item, reorder immediately".to_string()),
                expiry_date: Some("2024-11-30".to_string()),
            },
            InventoryItem {
                id: Uuid::parse_str("b2c3d4e5-f6a7-8901-2345-67890abcdef0").unwrap(),
                name: "Children's Cough Syrup".to_string(),
                stock_level: 10,
                threshold: 30,
                category: Some("OTC".to_string()),
                supplier: Some("KidCare Health".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(5)),
                stock_history: Some(vec![50, 45, 35, 20, 10]),
                reorder_amount: Some(60),
                unit: Some("bottles".to_string()),
                notes: Some("Seasonal demand increasing".to_string()),
                expiry_date: Some("2025-09-15".to_string()),
            },
            InventoryItem {
                id: Uuid::parse_str("c3d4e5f6-a7b8-9012-3456-7890abcdef01").unwrap(),
                name: "Band-Aids (Assorted)".to_string(),
                stock_level: 25,
                threshold: 50,
                category: Some("First Aid".to_string()),
                supplier: Some("MediSupply Co.".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(20)),
                stock_history: Some(vec![100, 80, 60, 40, 25]),
                reorder_amount: Some(100),
                unit: Some("boxes".to_string()),
                notes: None,
                expiry_date: None, // Non-medicinal item
            },
            InventoryItem {
                id: Uuid::parse_str("d4e5f6a7-b8c9-0123-4567-890abcdef012").unwrap(),
                name: "Vitamin D3 Capsules".to_string(),
                stock_level: 18,
                threshold: 40,
                category: Some("Supplements".to_string()),
                supplier: Some("NutriVita Labs".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(15)),
                stock_history: Some(vec![60, 50, 40, 30, 18]),
                reorder_amount: Some(80),
                unit: Some("bottles".to_string()),
                notes: Some("Check for bulk order discounts".to_string()),
                expiry_date: Some("2026-01-31".to_string()),
            },
            InventoryItem {
                id: Uuid::parse_str("e5f6a7b8-c9d0-1234-5678-90abcdef0123").unwrap(),
                name: "Hydrocortisone Cream 1%".to_string(),
                stock_level: 7,
                threshold: 15,
                category: Some("Topical".to_string()),
                supplier: Some("DermSolutions".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(3)),
                stock_history: Some(vec![20, 15, 10, 7]),
                reorder_amount: Some(30),
                unit: Some("tubes".to_string()),
                notes: None,
                expiry_date: Some("2025-07-22".to_string()),
            },
             InventoryItem {
                id: Uuid::parse_str("f6a7b8c9-d0e1-2345-6789-0abcdef01234").unwrap(),
                name: "Antacid Tablets (Chewable)".to_string(),
                stock_level: 12,
                threshold: 25,
                category: Some("OTC".to_string()),
                supplier: Some("Digestive Aids Inc.".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(8)),
                stock_history: Some(vec![40, 35, 28, 20, 12]),
                reorder_amount: Some(50),
                unit: Some("bottles".to_string()),
                notes: None,
                expiry_date: Some("2025-05-10".to_string()),
            },
             InventoryItem {
                id: Uuid::parse_str("a7b8c9d0-e1f2-3456-7890-abcdef012345").unwrap(),
                name: "Eye Drops (Lubricating)".to_string(),
                stock_level: 9,
                threshold: 20,
                category: Some("Eye Care".to_string()),
                supplier: Some("Vision Pharma".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(6)),
                stock_history: Some(vec![30, 25, 18, 12, 9]),
                reorder_amount: Some(40),
                unit: Some("bottles".to_string()),
                notes: Some("Popular during allergy season".to_string()),
                expiry_date: Some("2024-10-01".to_string()),
            },
            InventoryItem {
                id: Uuid::parse_str("b8c9d0e1-f2a3-4567-8901-bcdef0123456").unwrap(),
                name: "Pain Relief Gel".to_string(),
                stock_level: 15,
                threshold: 30,
                category: Some("Topical".to_string()),
                supplier: Some("MediSupply Co.".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(12)),
                stock_history: Some(vec![50, 40, 30, 20, 15]),
                reorder_amount: Some(50),
                unit: Some("tubes".to_string()),
                notes: None,
                expiry_date: Some("2025-08-01".to_string()),
            },
            InventoryItem {
                id: Uuid::parse_str("c9d0e1f2-a3b4-5678-9012-cdef01234567").unwrap(),
                name: "Allergy Relief Tablets (Non-drowsy)".to_string(),
                stock_level: 6,
                threshold: 20,
                category: Some("OTC".to_string()),
                supplier: Some("AllCare Pharmaceuticals".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(4)),
                stock_history: Some(vec![30, 25, 15, 10, 6]),
                reorder_amount: Some(40),
                unit: Some("packs".to_string()),
                notes: Some("High demand during spring".to_string()),
                expiry_date: Some("2025-04-18".to_string()),
            },
            InventoryItem {
                id: Uuid::parse_str("d0e1f2a3-b4c5-6789-0123-def012345678").unwrap(),
                name: "Blood Pressure Monitor".to_string(),
                stock_level: 3,
                threshold: 10,
                category: Some("Medical Devices".to_string()),
                supplier: Some("HealthTech Solutions".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(30)),
                stock_history: Some(vec![15, 12, 8, 5, 3]),
                reorder_amount: Some(20),
                unit: Some("units".to_string()),
                notes: None,
                expiry_date: None, // Device
            },
            InventoryItem {
                id: Uuid::parse_str("e1f2a3b4-c5d6-7890-1234-ef0123456789").unwrap(),
                name: "Probiotic Capsules".to_string(),
                stock_level: 11,
                threshold: 25,
                category: Some("Supplements".to_string()),
                supplier: Some("NutriVita Labs".to_string()),
                last_ordered: Some(Utc::now() - chrono::Duration::days(9)),
                stock_history: Some(vec![35, 30, 22, 15, 11]),
                reorder_amount: Some(50),
                unit: Some("bottles".to_string()),
                notes: None,
                expiry_date: Some("2025-12-31".to_string()),
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
