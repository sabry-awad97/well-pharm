use sea_orm_migration::prelude::{extension::postgres::Type, *};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create product_category enum type
        manager
            .create_type(
                Type::create()
                    .as_enum(ProductCategory::Table)
                    .values([
                        ProductCategory::Prescription,
                        ProductCategory::OTC,
                        ProductCategory::Supplement,
                        ProductCategory::MedicalDevice,
                        ProductCategory::Other,
                    ])
                    .to_owned(),
            )
            .await?;

        // Create products table
        manager
            .create_table(
                Table::create()
                    .table(Products::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Products::Id).uuid().not_null().primary_key())
                    .col(
                        ColumnDef::new(Products::Name)
                            .string()
                            .not_null()
                            .unique_key(),
                    )
                    .col(ColumnDef::new(Products::GenericName).string().null())
                    .col(ColumnDef::new(Products::Description).text().null())
                    .col(
                        ColumnDef::new(Products::Category)
                            .custom(ProductCategory::Table)
                            .not_null(),
                    )
                    .col(ColumnDef::new(Products::DosageForm).string().not_null())
                    .col(ColumnDef::new(Products::Strength).string().not_null())
                    .col(ColumnDef::new(Products::Manufacturer).string().not_null())
                    .col(
                        ColumnDef::new(Products::Barcode)
                            .string()
                            .null()
                            .unique_key(),
                    )
                    .col(
                        ColumnDef::new(Products::ActiveIngredients)
                            .json()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Products::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Products::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop products table
        manager
            .drop_table(Table::drop().table(Products::Table).to_owned())
            .await?;

        // Drop product_category enum type
        manager
            .drop_type(Type::drop().name(ProductCategory::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum Products {
    Table,
    Id,
    Name,
    GenericName,
    Description,
    Category,
    DosageForm,
    Strength,
    Manufacturer,
    Barcode,
    ActiveIngredients,
    CreatedAt,
    UpdatedAt,
}

#[derive(Iden)]
enum ProductCategory {
    Table,
    Prescription,
    #[allow(clippy::upper_case_acronyms)]
    OTC,
    Supplement,
    MedicalDevice,
    Other,
}
