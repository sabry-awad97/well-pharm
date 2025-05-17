use std::{
    fmt::{self, Display},
    str::FromStr,
};

use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;

#[derive(Error, Debug)]
pub enum DbIdError {
    #[error("Invalid ID format: {0}")]
    InvalidFormat(String),
    #[error("UUID parsing error: {0}")]
    UuidParse(#[from] uuid::Error),
}

/// Represents a database ID that ensures type safety and validation.
/// Internally uses UUIDv7 for time-ordered, unique identification.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct DbId(Uuid);

impl DbId {
    /// Creates a new DbId using UUIDv7 (timestamp-ordered UUID).
    #[inline]
    pub fn new() -> Self {
        Self(Uuid::now_v7())
    }

    /// Creates a DbId from a raw UUID.
    #[inline]
    pub fn from_uuid(uuid: Uuid) -> Self {
        Self(uuid)
    }

    /// Returns the underlying UUID.
    #[inline]
    pub fn as_uuid(&self) -> Uuid {
        self.0
    }

    /// Returns the ID as a string.
    #[inline]
    pub fn as_str(&self) -> String {
        self.0.to_string()
    }

    /// Validates if a string is a valid DbId format.
    #[inline]
    pub fn is_valid(s: &str) -> bool {
        Uuid::parse_str(s).is_ok()
    }

    /// Attempts to create a DbId from a string slice.
    /// Returns None if the string is not a valid UUID.
    #[inline]
    pub fn from_str_optional(s: &str) -> Option<Self> {
        Uuid::parse_str(s).ok().map(Self)
    }
}

impl Default for DbId {
    #[inline]
    fn default() -> Self {
        Self::new()
    }
}

impl FromStr for DbId {
    type Err = DbIdError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(Self(Uuid::parse_str(s).map_err(DbIdError::UuidParse)?))
    }
}

impl Display for DbId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<Uuid> for DbId {
    #[inline]
    fn from(uuid: Uuid) -> Self {
        Self(uuid)
    }
}

impl From<DbId> for String {
    #[inline]
    fn from(id: DbId) -> Self {
        id.0.to_string()
    }
}

impl From<DbId> for Uuid {
    #[inline]
    fn from(id: DbId) -> Self {
        id.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use pretty_assertions::assert_eq;

    #[test]
    fn test_new_id_is_valid() {
        let id = DbId::new();
        assert!(DbId::is_valid(&id.to_string()));
    }

    #[test]
    fn test_from_str_valid_uuid() {
        let uuid_str = "01890289-8b6e-7cc3-98c4-dc0c0c07398f";
        let id = DbId::from_str(uuid_str).unwrap();
        assert_eq!(id.to_string(), uuid_str);
    }

    #[test]
    fn test_from_str_invalid_uuid() {
        let result = DbId::from_str("invalid-uuid");
        assert!(result.is_err());
    }

    #[test]
    fn test_display_format() {
        let id = DbId::new();
        let displayed = format!("{}", id);
        assert_eq!(displayed, id.to_string());
    }

    #[test]
    fn test_serde_serialization() {
        let id = DbId::new();
        let serialized = serde_json::to_string(&id).unwrap();
        let deserialized: DbId = serde_json::from_str(&serialized).unwrap();
        assert_eq!(id, deserialized);
    }

    #[test]
    fn test_zero_uuid() {
        let zero_uuid_str = "00000000-0000-0000-0000-000000000000";

        // Test FromStr implementation
        let id = DbId::from_str(zero_uuid_str).unwrap();
        assert_eq!(id.to_string(), zero_uuid_str);

        // Test direct creation from Uuid
        let zero_uuid = Uuid::nil();
        let id_from_uuid = DbId::from_uuid(zero_uuid);
        assert_eq!(id_from_uuid.to_string(), zero_uuid_str);

        // Test equality
        assert_eq!(id, id_from_uuid);

        // Test is_valid
        assert!(DbId::is_valid(zero_uuid_str));

        // Test from_str_optional
        let optional_id = DbId::from_str_optional(zero_uuid_str);
        assert!(optional_id.is_some());
        assert_eq!(optional_id.unwrap(), id);
    }

    #[test]
    fn test_zero_uuid_json_serialization() {
        let zero_uuid_str = "00000000-0000-0000-0000-000000000000";
        let id = DbId::from_str(zero_uuid_str).unwrap();

        // Test JSON serialization
        let serialized = serde_json::to_string(&id).unwrap();
        assert_eq!(serialized, format!("\"{}\"", zero_uuid_str));

        // Test JSON deserialization
        let deserialized: DbId = serde_json::from_str(&serialized).unwrap();
        assert_eq!(deserialized, id);
    }

    #[test]
    fn test_zero_uuid_display() {
        let zero_uuid_str = "00000000-0000-0000-0000-000000000000";
        let id = DbId::from_str(zero_uuid_str).unwrap();

        // Test Display implementation
        assert_eq!(format!("{}", id), zero_uuid_str);
        assert_eq!(id.as_str(), zero_uuid_str);
    }
}
