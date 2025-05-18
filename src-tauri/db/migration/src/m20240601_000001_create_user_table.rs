use sea_orm_migration::prelude::{extension::postgres::Type, *};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create user_role enum type with lowercase values
        manager
            .create_type(
                Type::create()
                    .as_enum(UserRole::Table)
                    .values([
                        Alias::new("admin"),      // Lowercase values
                        Alias::new("pharmacist"), // Lowercase values
                        Alias::new("staff"),      // Lowercase values
                    ])
                    .to_owned(),
            )
            .await?;

        // Create users table
        manager
            .create_table(
                Table::create()
                    .table(Users::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Users::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(Users::Username)
                            .text()
                            .not_null()
                            .unique_key(),
                    )
                    .col(
                        ColumnDef::new(Users::Email)
                            .text()
                            .not_null()
                            .unique_key(),
                    )
                    .col(
                        ColumnDef::new(Users::PasswordHash)
                            .text()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Users::Role)
                            .custom(UserRole::Table)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Users::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Users::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(Users::LastLogin)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop users table
        manager
            .drop_table(Table::drop().table(Users::Table).to_owned())
            .await?;

        // Drop user_role enum type
        manager
            .drop_type(Type::drop().name(UserRole::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum Users {
    Table,
    Id,
    Username,
    Email,
    PasswordHash,
    Role,
    CreatedAt,
    UpdatedAt,
    LastLogin,
}

#[derive(Iden)]
enum UserRole {
    #[iden = "user_role"]
    Table,
    Admin,
    Pharmacist,
    Staff,
}


