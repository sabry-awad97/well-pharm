pub mod user;

pub mod utils;

// Re-export the user module components for easier access
pub use user::{ActiveModel as UserActiveModel, Entity as User, Model as UserModel, UserRole};
