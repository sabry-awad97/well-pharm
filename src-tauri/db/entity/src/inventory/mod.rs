use async_trait::async_trait;
use chrono::{DateTime, NaiveDate, Utc};
use sea_orm::{entity::prelude::*, ActiveValue::Set};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

use crate::product::Entity as Product;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "inventory")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub product_id: Uuid,
    pub stock_level: u32,
    pub threshold: u32,
    pub supplier: Option<String>,
    pub last_ordered: Option<DateTime<Utc>>,
    pub stock_history: Option<JsonValue>,
    pub reorder_amount: Option<u32>,
    pub unit: Option<String>,
    pub notes: Option<String>,
    pub expiry_date: Option<NaiveDate>,
    pub purchase_price: Decimal,
    pub selling_price: Decimal,
    pub price_updated_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "Product",
        from = "Column::ProductId",
        to = "crate::product::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Product,
}

impl Related<Product> for Entity {
    fn to() -> RelationDef {
        Relation::Product.def()
    }
}

#[async_trait]
impl ActiveModelBehavior for ActiveModel {
    /// Before save hook that automatically updates the updated_at field
    async fn before_save<C>(mut self, _db: &C, insert: bool) -> Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        self.updated_at = Set(Utc::now());

        if insert {
            self.created_at = Set(Utc::now());
            self.price_updated_at = Set(Utc::now());
        }

        Ok(self)
    }
}
