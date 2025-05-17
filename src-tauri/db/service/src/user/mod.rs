//! User repository for managing user entities in the database.

use argon2::{
    Argon2, PasswordVerifier,
    password_hash::{SaltString, rand_core::OsRng},
};
use async_trait::async_trait;
use db_entity::{User, UserActiveModel, UserModel, UserRole, utils::db_time::DbTime};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set,
    TransactionTrait,
};
use std::sync::Arc;
use tracing::{info, warn};

use crate::ServiceError;

/// Repository interface for user management operations.
#[async_trait]
pub trait UserRepository: Send + Sync + 'static {
    /// Creates a new user in the system.
    async fn create_user(
        &self,
        username: String,
        email: String,
        password: String,
        role: UserRole,
    ) -> Result<UserModel, ServiceError>;

    /// Finds a user by their unique ID.
    async fn find_by_id(&self, id: uuid::Uuid) -> Result<Option<UserModel>, ServiceError>;

    /// Finds a user by their username.
    async fn find_by_username(&self, username: &str) -> Result<Option<UserModel>, ServiceError>;

    /// Finds a user by their email address.
    async fn find_by_email(&self, email: &str) -> Result<Option<UserModel>, ServiceError>;

    /// Updates an existing user's details.
    async fn update_user(&self, user: UserActiveModel) -> Result<UserModel, ServiceError>;

    /// Deletes a user from the system.
    async fn delete_user(&self, id: uuid::Uuid) -> Result<bool, ServiceError>;

    /// Authenticates a user with username/email and password.
    async fn authenticate(
        &self,
        username_or_email: &str,
        password: &str,
    ) -> Result<Option<UserModel>, ServiceError>;

    /// Updates the last login timestamp for a user.
    async fn update_last_login(&self, id: uuid::Uuid) -> Result<(), ServiceError>;

    /// Lists all users with optional role filtering.
    async fn list_users(&self, role: Option<UserRole>) -> Result<Vec<UserModel>, ServiceError>;
}

/// Sea ORM implementation of the UserRepository trait.
pub struct SeaOrmUserRepository {
    db: Arc<DatabaseConnection>,
}

impl SeaOrmUserRepository {
    /// Creates a new SeaOrmUserRepository instance.
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    /// Hashes a password using Argon2.
    fn hash_password(&self, password: &str) -> Result<String, ServiceError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        let password_hash = argon2::password_hash::PasswordHash::generate(argon2, password, &salt)
            .map_err(|e| ServiceError::InvalidValue(format!("Failed to hash password: {}", e)))?
            .to_string();

        Ok(password_hash)
    }

    /// Verifies a password against a hash using Argon2.
    fn verify_password(&self, password: &str, hash: &str) -> Result<bool, ServiceError> {
        let parsed_hash = argon2::password_hash::PasswordHash::new(hash)
            .map_err(|e| ServiceError::InvalidValue(format!("Invalid password hash: {}", e)))?;

        let result = argon2::Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok();

        Ok(result)
    }
}

#[async_trait]
impl UserRepository for SeaOrmUserRepository {
    async fn create_user(
        &self,
        username: String,
        email: String,
        password: String,
        role: UserRole,
    ) -> Result<UserModel, ServiceError> {
        // Check if username or email already exists
        let existing_user = User::find()
            .filter(
                db_entity::user::Column::Username
                    .eq(&username)
                    .or(db_entity::user::Column::Email.eq(&email)),
            )
            .one(&*self.db)
            .await?;

        if let Some(user) = existing_user {
            if user.username == username {
                return Err(ServiceError::InvalidValue(format!(
                    "Username '{}' is already taken",
                    username
                )));
            } else {
                return Err(ServiceError::InvalidValue(format!(
                    "Email '{}' is already registered",
                    email
                )));
            }
        }

        // Hash the password
        let password_hash = self.hash_password(&password)?;

        // Create the user
        let user = User::create_user(username, email, password_hash, role);
        let user = user.insert(&*self.db).await?;

        info!("Created new user with ID: {}", user.id);
        Ok(user)
    }

    async fn find_by_id(&self, id: uuid::Uuid) -> Result<Option<UserModel>, ServiceError> {
        let user = User::find_by_id(id).one(&*self.db).await?;
        Ok(user)
    }

    async fn find_by_username(&self, username: &str) -> Result<Option<UserModel>, ServiceError> {
        let user = User::find()
            .filter(db_entity::user::Column::Username.eq(username))
            .one(&*self.db)
            .await?;
        Ok(user)
    }

    async fn find_by_email(&self, email: &str) -> Result<Option<UserModel>, ServiceError> {
        let user = User::find()
            .filter(db_entity::user::Column::Email.eq(email))
            .one(&*self.db)
            .await?;
        Ok(user)
    }

    async fn update_user(&self, user: UserActiveModel) -> Result<UserModel, ServiceError> {
        let user = user.update(&*self.db).await?;
        Ok(user)
    }

    async fn delete_user(&self, id: uuid::Uuid) -> Result<bool, ServiceError> {
        let result = User::delete_by_id(id).exec(&*self.db).await?;
        Ok(result.rows_affected > 0)
    }

    async fn authenticate(
        &self,
        username_or_email: &str,
        password: &str,
    ) -> Result<Option<UserModel>, ServiceError> {
        // Find user by username or email
        let user = User::find()
            .filter(
                db_entity::user::Column::Username
                    .eq(username_or_email)
                    .or(db_entity::user::Column::Email.eq(username_or_email)),
            )
            .one(&*self.db)
            .await?;

        match user {
            Some(user) => {
                // Verify password
                if self.verify_password(password, &user.password_hash)? {
                    // Update last login time
                    self.update_last_login(user.id).await?;
                    Ok(Some(user))
                } else {
                    warn!("Failed login attempt for user: {}", username_or_email);
                    Ok(None)
                }
            }
            None => Ok(None),
        }
    }

    async fn update_last_login(&self, id: uuid::Uuid) -> Result<(), ServiceError> {
        let txn = self.db.begin().await?;

        let user = User::find_by_id(id).one(&txn).await?;

        if let Some(user) = user {
            let mut user: UserActiveModel = user.into();
            user.last_login = Set(Some(DbTime::now().into()));
            user.update(&txn).await?;
        }

        txn.commit().await?;
        Ok(())
    }

    async fn list_users(&self, role: Option<UserRole>) -> Result<Vec<UserModel>, ServiceError> {
        let mut query = User::find();

        if let Some(role) = role {
            query = query.filter(db_entity::user::Column::Role.eq(role));
        }

        let users = query.all(&*self.db).await?;
        Ok(users)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use db_entity::utils::db_time::DbTime;
    use pretty_assertions::assert_eq;
    use sea_orm::{DatabaseBackend, MockDatabase, MockExecResult};
    use uuid::Uuid;

    #[tokio::test]
    async fn test_create_user() {
        // Create fixed timestamps for testing
        let db_time = DbTime::now().into();

        // Mock the database behavior more precisely
        let db = MockDatabase::new(DatabaseBackend::Postgres)
            // First query: check if user exists (return empty result)
            .append_query_results::<UserModel, _, _>(vec![vec![]])
            // Second query: insert user (return success with ID)
            .append_exec_results(vec![MockExecResult {
                last_insert_id: 1,
                rows_affected: 1,
            }])
            // Third query: get the created user by ID
            .append_query_results(vec![vec![UserModel {
                id: Uuid::parse_str("01890289-8b6e-7cc3-98c4-dc0c0c07398f").unwrap(),
                username: "testuser".to_string(),
                email: "test@example.com".to_string(),
                password_hash: "hashed_password".to_string(), // This will be different in actual implementation
                role: UserRole::Staff,
                created_at: db_time,
                updated_at: db_time,
                last_login: None,
            }]])
            .into_connection();

        // Create a repository with the mock database
        let repo = SeaOrmUserRepository::new(Arc::new(db));

        // Mock the password hashing function
        // This is a key part - we need to intercept the password hashing
        // You may need to refactor your code to make this testable

        // Test create user
        let result = repo
            .create_user(
                "testuser".to_string(),
                "test@example.com".to_string(),
                "password123".to_string(),
                UserRole::Staff,
            )
            .await;

        assert!(result.is_ok(), "Failed to create user: {:?}", result.err());

        let user = result.unwrap();
        assert_eq!(user.username, "testuser");
        assert_eq!(user.email, "test@example.com");
        assert_eq!(user.role, UserRole::Staff);

        // Verify the mock database received the expected queries
        // This would require capturing the queries the mock DB received
    }

    // Additional tests would be implemented here
}
