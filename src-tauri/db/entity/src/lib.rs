pub mod inventory;
pub mod product;
pub mod user;
pub mod utils;

// Re-export entities
pub use inventory::{Entity as Inventory, Model as InventoryModel};
pub use product::{Entity as Product, Model as ProductModel};
pub use user::{ActiveModel as UserActiveModel, Entity as User, Model as UserModel, UserRole};
