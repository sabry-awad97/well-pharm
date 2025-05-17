pub mod user;
pub mod utils;

// New product module
pub mod product;

// Re-export entities
pub use product::{
    ActiveModel as ProductActiveModel, Entity as Product, Model as ProductModel, ProductCategory,
};
pub use user::{ActiveModel as UserActiveModel, Entity as User, Model as UserModel, UserRole};
