use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create inventory_batches table
        manager
            .create_table(
                Table::create()
                    .table(InventoryBatches::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(InventoryBatches::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(InventoryBatches::ProductId)
                            .uuid()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(InventoryBatches::BatchNumber)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(InventoryBatches::Quantity)
                            .unsigned()
                            .not_null()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new(InventoryBatches::ManufacturingDate)
                            .date()
                            .null(),
                    )
                    .col(ColumnDef::new(InventoryBatches::ExpiryDate).date().null())
                    .col(
                        ColumnDef::new(InventoryBatches::PurchasePrice)
                            .decimal()
                            .not_null()
                            .default(0),
                    )
                    .col(ColumnDef::new(InventoryBatches::Notes).string().null())
                    .col(
                        ColumnDef::new(InventoryBatches::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(InventoryBatches::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_inventory_batches_product")
                            .from(InventoryBatches::Table, InventoryBatches::ProductId)
                            .to(Products::Table, Products::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create index on product_id for quick batch lookup
        manager
            .create_index(
                Index::create()
                    .name("idx_inventory_batches_product_id")
                    .table(InventoryBatches::Table)
                    .col(InventoryBatches::ProductId)
                    .to_owned(),
            )
            .await?;

        // Create index on expiry_date for quick expiry queries
        manager
            .create_index(
                Index::create()
                    .name("idx_inventory_batches_expiry_date")
                    .table(InventoryBatches::Table)
                    .col(InventoryBatches::ExpiryDate)
                    .to_owned(),
            )
            .await?;

        // Create unique index on product_id + batch_number
        manager
            .create_index(
                Index::create()
                    .name("idx_inventory_batches_product_batch")
                    .table(InventoryBatches::Table)
                    .col(InventoryBatches::ProductId)
                    .col(InventoryBatches::BatchNumber)
                    .unique()
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop inventory_batches table
        manager
            .drop_table(Table::drop().table(InventoryBatches::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum InventoryBatches {
    Table,
    Id,
    ProductId,
    BatchNumber,
    Quantity,
    ManufacturingDate,
    ExpiryDate,
    PurchasePrice,
    Notes,
    CreatedAt,
    UpdatedAt,
}

#[derive(Iden)]
enum Products {
    Table,
    Id,
}
