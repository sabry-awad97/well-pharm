use crate::utils::db_id::DbId;
use crate::utils::db_time::DbTime;
use async_trait::async_trait;
use sea_orm::entity::prelude::*;
use sea_orm::{ActiveValue::Set, ConnectionTrait, DbErr};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "products")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    #[sea_orm(unique)]
    pub name: String,
    pub generic_name: Option<String>,
    pub description: Option<String>,
    pub category: ProductCategory,
    pub dosage_form: String,
    pub strength: String,
    pub manufacturer: String,
    #[sea_orm(unique)]
    pub barcode: Option<String>,
    pub active_ingredients: JsonValue,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

#[async_trait]
impl ActiveModelBehavior for ActiveModel {
    // Add timestamp before insert
    async fn before_save<C>(mut self, _db: &C, insert: bool) -> Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        let now = DbTime::now().into();
        self.updated_at = Set(now);

        if insert {
            self.id = Set(DbId::new().into());
            self.created_at = Set(now);
        }

        Ok(self)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "product_category")]
pub enum ProductCategory {
    #[sea_orm(string_value = "prescription")]
    Prescription,
    #[sea_orm(string_value = "otc")]
    OTC,
    #[sea_orm(string_value = "supplement")]
    Supplement,
    #[sea_orm(string_value = "medical_device")]
    MedicalDevice,
    #[sea_orm(string_value = "other")]
    Other,
}
