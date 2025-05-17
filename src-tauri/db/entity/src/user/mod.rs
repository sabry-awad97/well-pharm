use std::str::FromStr;

use async_trait::async_trait;
use sea_orm::entity::prelude::*;
use sea_orm::{ActiveValue::Set, ConnectionTrait, DbErr};
use serde::{Deserialize, Serialize};

use crate::utils::db_time::DbTime;

/// Represents user roles in the system with different access levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize)]
#[sea_orm(rs_type = "String", db_type = "Enum")]
pub enum UserRole {
    #[sea_orm(string_value = "Admin")]
    Admin,
    #[sea_orm(string_value = "Pharmacist")]
    Pharmacist,
    #[sea_orm(string_value = "Staff")]
    Staff,
}

impl FromStr for UserRole {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Admin" => Ok(Self::Admin),
            "Pharmacist" => Ok(Self::Pharmacist),
            "Staff" => Ok(Self::Staff),
            _ => Err(format!("Invalid user role: {}", s)),
        }
    }
}

impl std::fmt::Display for UserRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UserRole::Admin => write!(f, "Admin"),
            UserRole::Pharmacist => write!(f, "Pharmacist"),
            UserRole::Staff => write!(f, "Staff"),
        }
    }
}

/// User entity representing system users with role-based access control
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,

    #[sea_orm(unique, column_type = "Text")]
    pub username: String,

    #[sea_orm(unique, column_type = "Text")]
    pub email: String,

    #[sea_orm(column_type = "Text")]
    pub password_hash: String,

    pub role: UserRole,

    pub created_at: DbTime,

    pub updated_at: DbTime,

    #[sea_orm(nullable)]
    pub last_login: Option<DbTime>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

#[async_trait]
impl ActiveModelBehavior for ActiveModel {
    /// Before save hook that automatically updates the updated_at field
    async fn before_save<C>(mut self, _db: &C, insert: bool) -> Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        let now: DbTime = DbTime::now();

        self.updated_at = Set(now.clone());

        if insert {
            self.created_at = Set(now);
        }

        Ok(self)
    }
}

impl Entity {
    /// Creates a new user with the given details
    pub fn create_user(
        username: String,
        email: String,
        password_hash: String,
        role: UserRole,
    ) -> ActiveModel {
        let now: DbTime = DbTime::now();
        ActiveModel {
            username: Set(username),
            email: Set(email),
            password_hash: Set(password_hash),
            role: Set(role),
            created_at: Set(now.clone()),
            updated_at: Set(now),
            last_login: Set(None),
            ..Default::default()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use pretty_assertions::assert_eq;
    use sea_orm::{DbBackend, MockDatabase};
    use std::str::FromStr;

    #[test]
    fn test_create_user() {
        let username = "testuser".to_string();
        let email = "test@example.com".to_string();
        let password_hash = "hashed_password".to_string();
        let role = UserRole::Staff;

        let user =
            Entity::create_user(username.clone(), email.clone(), password_hash.clone(), role);

        // Verify fields are set correctly
        assert_eq!(user.username.unwrap(), username);
        assert_eq!(user.email.unwrap(), email);
        assert_eq!(user.password_hash.unwrap(), password_hash);
        assert_eq!(user.role.unwrap(), role);

        // Verify timestamps are set
        assert!(user.created_at.is_set());
        assert!(user.updated_at.is_set());
        assert!(user.last_login.is_not_set() || user.last_login.unwrap().is_none());
    }

    #[tokio::test]
    async fn test_before_save_hook_insert() {
        let mut user = ActiveModel {
            username: Set("newuser".to_string()),
            email: Set("new@example.com".to_string()),
            password_hash: Set("password123".to_string()),
            role: Set(UserRole::Pharmacist),
            ..Default::default()
        };

        // Simulate before_save hook for insert
        let db = MockDatabase::new(DbBackend::Postgres).into_connection();
        user = user.before_save(&db, true).await.unwrap();

        // Verify timestamps are updated
        assert!(user.created_at.is_set());
        assert!(user.updated_at.is_set());

        // Both timestamps should be set to now
        let created_at = user.created_at.unwrap();
        let updated_at = user.updated_at.unwrap();

        // Timestamps should be very close to each other
        assert!((created_at.timestamp() - updated_at.timestamp()).abs() < 2);
    }

    #[tokio::test]
    async fn test_before_save_hook_update() {
        // Create a user with timestamps in the past
        let past_time = DbTime::now().add_seconds(-3600); // 1 hour ago
        let mut user = ActiveModel {
            username: Set("existinguser".to_string()),
            email: Set("existing@example.com".to_string()),
            password_hash: Set("oldpassword".to_string()),
            role: Set(UserRole::Admin),
            created_at: Set(past_time.clone()),
            updated_at: Set(past_time.clone()),
            ..Default::default()
        };

        // Simulate before_save hook for update
        let db = MockDatabase::new(DbBackend::Postgres).into_connection();
        user = user.before_save(&db, false).await.unwrap();

        // Verify only updated_at is changed
        assert_eq!(user.created_at.unwrap().timestamp(), past_time.timestamp());
        assert!(user.updated_at.unwrap().timestamp() > past_time.timestamp());
    }

    #[test]
    fn test_user_role_enum() {
        // Test conversion between string and enum
        assert_eq!(UserRole::Admin.to_string(), "Admin");
        assert_eq!(UserRole::Pharmacist.to_string(), "Pharmacist");
        assert_eq!(UserRole::Staff.to_string(), "Staff");

        // Test parsing from string
        assert_eq!(UserRole::from_str("Admin").unwrap(), UserRole::Admin);
        assert_eq!(
            UserRole::from_str("Pharmacist").unwrap(),
            UserRole::Pharmacist
        );
        assert_eq!(UserRole::from_str("Staff").unwrap(), UserRole::Staff);

        // Test invalid role
        assert!(UserRole::from_str("InvalidRole").is_err());
    }

    #[test]
    fn test_user_model_serialization() {
        let now = DbTime::now();
        let user = Model {
            id: Uuid::parse_str("01890289-8b6e-7cc3-98c4-dc0c0c07398f").unwrap(),
            username: "testuser".to_string(),
            email: "test@example.com".to_string(),
            password_hash: "hashed_password".to_string(),
            role: UserRole::Admin,
            created_at: now.clone(),
            updated_at: now.clone(),
            last_login: Some(now.clone()),
        };

        // Test serialization
        let serialized = serde_json::to_string(&user).unwrap();

        // Test deserialization
        let deserialized: Model = serde_json::from_str(&serialized).unwrap();

        // Verify the deserialized model matches the original
        assert_eq!(deserialized.id, user.id);
        assert_eq!(deserialized.username, user.username);
        assert_eq!(deserialized.email, user.email);
        assert_eq!(deserialized.password_hash, user.password_hash);
        assert_eq!(deserialized.role, user.role);
        assert_eq!(deserialized.created_at, user.created_at);
        assert_eq!(deserialized.updated_at, user.updated_at);
        assert_eq!(deserialized.last_login, user.last_login);
    }
}
