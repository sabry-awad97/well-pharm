use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create inventory table
        manager
            .create_table(
                Table::create()
                    .table(Inventory::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Inventory::ProductId)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(Inventory::StockLevel)
                            .unsigned()
                            .not_null()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new(Inventory::Threshold)
                            .unsigned()
                            .not_null()
                            .default(10),
                    )
                    .col(ColumnDef::new(Inventory::Supplier).string().null())
                    .col(
                        ColumnDef::new(Inventory::LastOrdered)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .col(ColumnDef::new(Inventory::StockHistory).json().null())
                    .col(ColumnDef::new(Inventory::ReorderAmount).unsigned().null())
                    .col(ColumnDef::new(Inventory::Unit).string().null())
                    .col(ColumnDef::new(Inventory::Notes).text().null())
                    .col(ColumnDef::new(Inventory::ExpiryDate).date().null())
                    .col(
                        ColumnDef::new(Inventory::PurchasePrice)
                            .decimal_len(10, 2)
                            .not_null()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new(Inventory::SellingPrice)
                            .decimal_len(10, 2)
                            .not_null()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new(Inventory::PriceUpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Inventory::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(Inventory::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_inventory_product")
                            .from(Inventory::Table, Inventory::ProductId)
                            .to(Products::Table, Products::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Create index on stock_level for quick low stock queries
        manager
            .create_index(
                Index::create()
                    .name("idx_inventory_stock_level")
                    .table(Inventory::Table)
                    .col(Inventory::StockLevel)
                    .to_owned(),
            )
            .await?;

        // Create index on expiry_date for quick expiry queries
        manager
            .create_index(
                Index::create()
                    .name("idx_inventory_expiry_date")
                    .table(Inventory::Table)
                    .col(Inventory::ExpiryDate)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop inventory table
        manager
            .drop_table(Table::drop().table(Inventory::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum Inventory {
    Table,
    ProductId,
    StockLevel,
    Threshold,
    Supplier,
    LastOrdered,
    StockHistory,
    ReorderAmount,
    Unit,
    Notes,
    ExpiryDate,
    PurchasePrice,
    SellingPrice,
    PriceUpdatedAt,
    CreatedAt,
    UpdatedAt,
}

#[derive(Iden)]
enum Products {
    Table,
    Id,
}