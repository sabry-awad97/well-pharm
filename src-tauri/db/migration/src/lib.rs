use sea_orm_migration::{DbErr, MigrationTrait, MigratorTrait, sea_orm::DatabaseConnection};

mod m20240601_000001_create_user_table;
mod m20240601_000002_create_product_table;
mod m20240610_000003_create_inventory_table;
mod m20240701_000001_create_inventory_batches_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20240601_000001_create_user_table::Migration),
            Box::new(m20240601_000002_create_product_table::Migration),
            Box::new(m20240610_000003_create_inventory_table::Migration),
            Box::new(m20240701_000001_create_inventory_batches_table::Migration),
        ]
    }
}

pub async fn run_migrations(db: &DatabaseConnection) -> Result<(), DbErr> {
    Migrator::up(db, None).await
}
