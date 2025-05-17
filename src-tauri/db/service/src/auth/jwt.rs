//! JWT authentication services

use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::ServiceError;
use db_entity::UserRole;

/// JWT claims structure
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    /// Subject (user ID)
    pub sub: String,
    /// User role
    pub role: UserRole,
    /// Issued at timestamp
    pub iat: i64,
    /// Expiration timestamp
    pub exp: i64,
    /// JWT ID (for token tracking/revocation)
    pub jti: String,
}

/// JWT token manager
pub struct JwtManager {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    token_expiration: Duration,
    refresh_expiration: Duration,
}

impl JwtManager {
    /// Create a new JWT manager
    pub fn new(secret: &[u8], token_expiration_minutes: i64, refresh_expiration_days: i64) -> Self {
        // Handle special case for tests with very short expiration times
        let token_expiration = if token_expiration_minutes == 0 {
            Duration::seconds(1) // Use 1 second for tests
        } else {
            Duration::minutes(token_expiration_minutes)
        };

        let refresh_expiration = if refresh_expiration_days == 0 {
            Duration::seconds(1) // Use 1 second for tests
        } else {
            Duration::days(refresh_expiration_days)
        };

        Self {
            encoding_key: EncodingKey::from_secret(secret),
            decoding_key: DecodingKey::from_secret(secret),
            token_expiration,
            refresh_expiration,
        }
    }

    /// Generate a new access token
    pub fn generate_token(&self, user_id: Uuid, role: UserRole) -> Result<String, ServiceError> {
        let now = Utc::now();
        let claims = Claims {
            sub: user_id.to_string(),
            role,
            iat: now.timestamp(),
            exp: (now + self.token_expiration).timestamp(),
            jti: Uuid::now_v7().to_string(),
        };

        encode(&Header::default(), &claims, &self.encoding_key).map_err(|e| {
            ServiceError::AuthenticationError(format!("Token generation failed: {}", e))
        })
    }

    /// Generate a refresh token with longer expiration
    pub fn generate_refresh_token(
        &self,
        user_id: Uuid,
        role: UserRole,
    ) -> Result<String, ServiceError> {
        let now = Utc::now();
        let claims = Claims {
            sub: user_id.to_string(),
            role,
            iat: now.timestamp(),
            exp: (now + self.refresh_expiration).timestamp(),
            jti: Uuid::now_v7().to_string(),
        };

        encode(&Header::default(), &claims, &self.encoding_key).map_err(|e| {
            ServiceError::AuthenticationError(format!("Refresh token generation failed: {}", e))
        })
    }

    /// Validate a token and return the claims if valid
    pub fn validate_token(&self, token: &str) -> Result<Claims, ServiceError> {
        decode::<Claims>(token, &self.decoding_key, &Validation::default())
            .map(|data| data.claims)
            .map_err(|e| match e.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
                    ServiceError::AuthenticationError("Token expired".to_string())
                }
                _ => ServiceError::AuthenticationError(format!("Invalid token: {}", e)),
            })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use pretty_assertions::assert_eq;

    const TEST_SECRET: &[u8] = b"test_secret_for_jwt_unit_tests";
    const USER_ID: &str = "01890289-8b6e-7cc3-98c4-dc0c0c07398f";

    #[test]
    fn test_generate_token() {
        let jwt_manager = JwtManager::new(TEST_SECRET, 60, 7);
        let user_id = Uuid::parse_str(USER_ID).unwrap();
        let role = UserRole::Admin;

        let token = jwt_manager.generate_token(user_id, role).unwrap();
        assert!(!token.is_empty());

        // Verify token can be decoded
        let claims = jwt_manager.validate_token(&token).unwrap();
        assert_eq!(claims.sub, USER_ID);
        assert_eq!(claims.role, role);
    }

    #[test]
    fn test_generate_refresh_token() {
        let jwt_manager = JwtManager::new(TEST_SECRET, 60, 7);
        let user_id = Uuid::parse_str(USER_ID).unwrap();
        let role = UserRole::Staff;

        let token = jwt_manager.generate_refresh_token(user_id, role).unwrap();
        assert!(!token.is_empty());

        // Verify token can be decoded
        let claims = jwt_manager.validate_token(&token).unwrap();
        assert_eq!(claims.sub, USER_ID);
        assert_eq!(claims.role, role);
    }

    #[test]
    fn test_token_expiration() {
        // Create a JWT manager
        let jwt_manager = JwtManager::new(TEST_SECRET, 60, 7);
        let user_id = Uuid::parse_str(USER_ID).unwrap();

        // Create a token with an expiration time in the past
        let now = Utc::now();
        let expired_time = now - Duration::hours(1); // 1 hour in the past

        // Create claims with past expiration
        let claims = Claims {
            sub: user_id.to_string(),
            role: UserRole::Pharmacist,
            iat: expired_time.timestamp(),
            exp: expired_time.timestamp(), // Expired already
            jti: Uuid::now_v7().to_string(),
        };

        // Encode the token with expired claims
        let token = encode(&Header::default(), &claims, &jwt_manager.encoding_key).unwrap();

        // Validate the token - should fail with expiration error
        let result = jwt_manager.validate_token(&token);

        // Assert that validation fails
        assert!(result.is_err());

        // Check that it's the right error type
        match result {
            Err(ServiceError::AuthenticationError(msg)) => {
                assert!(
                    msg.contains("expired"),
                    "Error message should mention expiration: {}",
                    msg
                );
            }
            _ => panic!("Expected AuthenticationError with expired message"),
        }
    }

    #[test]
    fn test_invalid_token() {
        let jwt_manager = JwtManager::new(TEST_SECRET, 60, 7);

        // Test with completely invalid token
        let result = jwt_manager.validate_token("invalid.token.format");
        assert!(result.is_err());

        // Test with valid format but wrong signature
        let result = jwt_manager.validate_token(
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_different_secrets() {
        // Create two JWT managers with different secrets
        let jwt_manager1 = JwtManager::new(b"secret1", 60, 7);
        let jwt_manager2 = JwtManager::new(b"secret2", 60, 7);

        let user_id = Uuid::parse_str(USER_ID).unwrap();
        let token = jwt_manager1
            .generate_token(user_id, UserRole::Admin)
            .unwrap();

        // Token should be valid with the first manager
        assert!(jwt_manager1.validate_token(&token).is_ok());

        // Token should be invalid with the second manager
        assert!(jwt_manager2.validate_token(&token).is_err());
    }

    #[test]
    fn test_token_claims() {
        let jwt_manager = JwtManager::new(TEST_SECRET, 60, 7);
        let user_id = Uuid::parse_str(USER_ID).unwrap();
        let role = UserRole::Pharmacist;

        let token = jwt_manager.generate_token(user_id, role).unwrap();
        let claims = jwt_manager.validate_token(&token).unwrap();

        // Verify all claims
        assert_eq!(claims.sub, USER_ID);
        assert_eq!(claims.role, role);

        // Verify timestamps
        let now = Utc::now().timestamp();
        assert!(claims.iat <= now);
        assert!(claims.exp > now);
        assert!(claims.exp - claims.iat <= 60 * 60 + 5); // 60 minutes + 5 seconds buffer

        // Verify JTI is a valid UUID
        assert!(Uuid::parse_str(&claims.jti).is_ok());
    }
}
