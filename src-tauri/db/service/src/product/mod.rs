use async_trait::async_trait;
use db_entity::{Product, ProductCategory, ProductModel, utils::db_id::DbId};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, ModelTrait,
    QueryFilter, QueryOrder, Set,
};
use serde_json::Value as JsonValue;
use std::sync::Arc;

use crate::error::ServiceError;

/// Repository trait for product operations
#[async_trait]
pub trait ProductRepository: Send + Sync {
    /// Create a new product
    async fn create_product(
        &self,
        name: String,
        generic_name: Option<String>,
        description: Option<String>,
        category: ProductCategory,
        dosage_form: String,
        strength: String,
        manufacturer: String,
        barcode: Option<String>,
        active_ingredients: JsonValue,
    ) -> Result<ProductModel, ServiceError>;

    /// Update an existing product
    async fn update_product(
        &self,
        id: DbId,
        name: Option<String>,
        generic_name: Option<String>,
        description: Option<String>,
        category: Option<ProductCategory>,
        dosage_form: Option<String>,
        strength: Option<String>,
        manufacturer: Option<String>,
        barcode: Option<String>,
        active_ingredients: Option<JsonValue>,
    ) -> Result<ProductModel, ServiceError>;

    /// Delete a product by ID
    async fn delete_product(&self, id: DbId) -> Result<(), ServiceError>;

    /// Get a product by ID
    async fn get_product_by_id(&self, id: DbId) -> Result<Option<ProductModel>, ServiceError>;

    /// Get a product by name
    async fn get_product_by_name(&self, name: &str) -> Result<Option<ProductModel>, ServiceError>;

    /// Get a product by barcode
    async fn get_product_by_barcode(
        &self,
        barcode: &str,
    ) -> Result<Option<ProductModel>, ServiceError>;

    /// Search products by partial name match
    async fn search_products(&self, query: &str) -> Result<Vec<ProductModel>, ServiceError>;

    /// Filter products by criteria
    async fn filter_products(
        &self,
        category: Option<ProductCategory>,
        manufacturer: Option<&str>,
    ) -> Result<Vec<ProductModel>, ServiceError>;
}

/// Sea-ORM implementation of ProductRepository
pub struct SeaOrmProductRepository {
    db: Arc<DatabaseConnection>,
}

impl SeaOrmProductRepository {
    /// Create a new SeaOrmProductRepository
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl ProductRepository for SeaOrmProductRepository {
    async fn create_product(
        &self,
        name: String,
        generic_name: Option<String>,
        description: Option<String>,
        category: ProductCategory,
        dosage_form: String,
        strength: String,
        manufacturer: String,
        barcode: Option<String>,
        active_ingredients: JsonValue,
    ) -> Result<ProductModel, ServiceError> {
        // Check if product with same name already exists
        if self.get_product_by_name(&name).await?.is_some() {
            return Err(ServiceError::DuplicateEntry(format!(
                "Product with name '{}' already exists",
                name
            )));
        }

        // Check if product with same barcode already exists (if barcode provided)
        if let Some(barcode_val) = &barcode {
            if self.get_product_by_barcode(barcode_val).await?.is_some() {
                return Err(ServiceError::DuplicateEntry(format!(
                    "Product with barcode '{}' already exists",
                    barcode_val
                )));
            }
        }

        // Create new product
        let product = db_entity::product::ActiveModel {
            name: Set(name),
            generic_name: Set(generic_name),
            description: Set(description),
            category: Set(category),
            dosage_form: Set(dosage_form),
            strength: Set(strength),
            manufacturer: Set(manufacturer),
            barcode: Set(barcode),
            active_ingredients: Set(active_ingredients),
            ..Default::default()
        }
        .insert(&*self.db)
        .await?;

        Ok(product)
    }

    async fn update_product(
        &self,
        id: DbId,
        name: Option<String>,
        generic_name: Option<String>,
        description: Option<String>,
        category: Option<ProductCategory>,
        dosage_form: Option<String>,
        strength: Option<String>,
        manufacturer: Option<String>,
        barcode: Option<String>,
        active_ingredients: Option<JsonValue>,
    ) -> Result<ProductModel, ServiceError> {
        // Find product by ID
        let product = Product::find_by_id(id.clone())
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Product with ID {} not found", id)))?;

        // Check name uniqueness if updating name
        if let Some(new_name) = &name {
            if new_name != &product.name && self.get_product_by_name(new_name).await?.is_some() {
                return Err(ServiceError::DuplicateEntry(format!(
                    "Product with name '{}' already exists",
                    new_name
                )));
            }
        }

        // Check barcode uniqueness if updating barcode
        if let Some(new_barcode) = &barcode {
            if Some(new_barcode) != product.barcode.as_ref()
                && self.get_product_by_barcode(new_barcode).await?.is_some()
            {
                return Err(ServiceError::DuplicateEntry(format!(
                    "Product with barcode '{}' already exists",
                    new_barcode
                )));
            }
        }

        // Update product
        let mut product_active: db_entity::product::ActiveModel = product.into_active_model();

        if let Some(name_val) = name {
            product_active.name = Set(name_val);
        }
        if let Some(generic_name_val) = generic_name {
            product_active.generic_name = Set(Some(generic_name_val));
        }
        if let Some(description_val) = description {
            product_active.description = Set(Some(description_val));
        }
        if let Some(category_val) = category {
            product_active.category = Set(category_val);
        }
        if let Some(dosage_form_val) = dosage_form {
            product_active.dosage_form = Set(dosage_form_val);
        }
        if let Some(strength_val) = strength {
            product_active.strength = Set(strength_val);
        }
        if let Some(manufacturer_val) = manufacturer {
            product_active.manufacturer = Set(manufacturer_val);
        }
        if let Some(barcode_val) = barcode {
            product_active.barcode = Set(Some(barcode_val));
        }
        if let Some(active_ingredients_val) = active_ingredients {
            product_active.active_ingredients = Set(active_ingredients_val);
        }

        let updated_product = product_active.update(&*self.db).await?;
        Ok(updated_product)
    }

    async fn delete_product(&self, id: DbId) -> Result<(), ServiceError> {
        let product = Product::find_by_id(id.clone())
            .one(&*self.db)
            .await?
            .ok_or_else(|| ServiceError::NotFound(format!("Product with ID {} not found", id)))?;

        product.delete(&*self.db).await?;
        Ok(())
    }

    async fn get_product_by_id(&self, id: DbId) -> Result<Option<ProductModel>, ServiceError> {
        let product = Product::find_by_id(id).one(&*self.db).await?;
        Ok(product)
    }

    async fn get_product_by_name(&self, name: &str) -> Result<Option<ProductModel>, ServiceError> {
        let product = Product::find()
            .filter(db_entity::product::Column::Name.eq(name))
            .one(&*self.db)
            .await?;
        Ok(product)
    }

    async fn get_product_by_barcode(
        &self,
        barcode: &str,
    ) -> Result<Option<ProductModel>, ServiceError> {
        let product = Product::find()
            .filter(db_entity::product::Column::Barcode.eq(barcode))
            .one(&*self.db)
            .await?;
        Ok(product)
    }

    async fn search_products(&self, query: &str) -> Result<Vec<ProductModel>, ServiceError> {
        let products = Product::find()
            .filter(
                db_entity::product::Column::Name
                    .contains(query)
                    .or(db_entity::product::Column::GenericName.contains(query))
                    .or(db_entity::product::Column::Description.contains(query)),
            )
            .order_by_asc(db_entity::product::Column::Name)
            .all(&*self.db)
            .await?;
        Ok(products)
    }

    async fn filter_products(
        &self,
        category: Option<ProductCategory>,
        manufacturer: Option<&str>,
    ) -> Result<Vec<ProductModel>, ServiceError> {
        let mut query = Product::find();

        if let Some(category_val) = category {
            query = query.filter(db_entity::product::Column::Category.eq(category_val));
        }

        if let Some(manufacturer_val) = manufacturer {
            query = query.filter(db_entity::product::Column::Manufacturer.eq(manufacturer_val));
        }

        let products = query
            .order_by_asc(db_entity::product::Column::Name)
            .all(&*self.db)
            .await?;
        Ok(products)
    }
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use super::*;
    use sea_orm::{DatabaseBackend, MockDatabase};
    use serde_json::json;

    #[tokio::test]
    async fn test_create_product() {
        // Create a mock product that will be returned after insertion
        let product_id = DbId::from_str("01890289-8b6e-7cc3-98c4-dc0c0c07398f").unwrap().into();
        let now = chrono::Utc::now().into();
        let mock_product = ProductModel {
            id: product_id,
            name: "Test Product".to_string(),
            generic_name: Some("Generic Test".to_string()),
            description: Some("Test description".to_string()),
            category: ProductCategory::OTC,
            dosage_form: "Tablet".to_string(),
            strength: "500mg".to_string(),
            manufacturer: "Test Manufacturer".to_string(),
            barcode: Some("1234567890".to_string()),
            active_ingredients: json!(["ingredient1", "ingredient2"]),
            created_at: now,
            updated_at: now,
        };

        // Create a mock database
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            .append_query_results::<ProductModel, _, _>(vec![vec![]]) // For get_product_by_name check
            .append_query_results::<ProductModel, _, _>(vec![vec![]]) // For get_product_by_barcode check
            .append_query_results::<ProductModel, _, _>(vec![vec![mock_product.clone()]]) // For insert operation
            .into_connection();

        let repo = SeaOrmProductRepository::new(Arc::new(db));

        // Test creating a product
        let result = repo
            .create_product(
                "Test Product".to_string(),
                Some("Generic Test".to_string()),
                Some("Test description".to_string()),
                ProductCategory::OTC,
                "Tablet".to_string(),
                "500mg".to_string(),
                "Test Manufacturer".to_string(),
                Some("1234567890".to_string()),
                json!(["ingredient1", "ingredient2"]),
            )
            .await;

        assert!(result.is_ok());

        // Verify the returned product matches our mock
        if let Ok(product) = result {
            assert_eq!(product.id, mock_product.id);
            assert_eq!(product.name, "Test Product");
            assert_eq!(product.category, ProductCategory::OTC);
        }
    }
}
