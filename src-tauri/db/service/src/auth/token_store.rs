//! Token store for blacklisting tokens

use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Simple in-memory token store for blacklisting tokens
pub struct TokenStore {
    blacklisted_tokens: Arc<RwLock<HashSet<String>>>,
}

impl TokenStore {
    /// Create a new token store
    pub fn new() -> Self {
        Self {
            blacklisted_tokens: Arc::new(RwLock::new(HashSet::new())),
        }
    }

    /// Add a token to the blacklist
    pub async fn blacklist_token(&self, token_id: String) {
        let mut tokens = self.blacklisted_tokens.write().await;
        tokens.insert(token_id);
    }

    /// Check if a token is blacklisted
    pub async fn is_blacklisted(&self, token_id: &str) -> bool {
        let tokens = self.blacklisted_tokens.read().await;
        tokens.contains(token_id)
    }
}

impl Default for TokenStore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[tokio::test]
    async fn test_blacklist_token() {
        let store = TokenStore::new();
        let token_id = Uuid::now_v7().to_string();

        // Initially token should not be blacklisted
        assert!(!store.is_blacklisted(&token_id).await);

        // Blacklist the token
        store.blacklist_token(token_id.clone()).await;

        // Now it should be blacklisted
        assert!(store.is_blacklisted(&token_id).await);
    }

    #[tokio::test]
    async fn test_multiple_tokens() {
        let store = TokenStore::new();
        let token1 = Uuid::now_v7().to_string();
        let token2 = Uuid::now_v7().to_string();
        let token3 = Uuid::now_v7().to_string();

        // Blacklist two tokens
        store.blacklist_token(token1.clone()).await;
        store.blacklist_token(token2.clone()).await;

        // Verify blacklisted status
        assert!(store.is_blacklisted(&token1).await);
        assert!(store.is_blacklisted(&token2).await);
        assert!(!store.is_blacklisted(&token3).await);
    }

    #[tokio::test]
    async fn test_blacklist_same_token_twice() {
        let store = TokenStore::new();
        let token_id = Uuid::now_v7().to_string();

        // Blacklist the token twice
        store.blacklist_token(token_id.clone()).await;
        store.blacklist_token(token_id.clone()).await;

        // Should still be blacklisted
        assert!(store.is_blacklisted(&token_id).await);
    }

    #[tokio::test]
    async fn test_concurrent_access() {
        let store = Arc::new(TokenStore::new());
        let token_id = Uuid::now_v7().to_string();

        // Create multiple tasks that check and blacklist tokens
        let mut handles = vec![];

        for _ in 0..10 {
            let store_clone = store.clone();
            let token_clone = token_id.clone();

            let handle = tokio::spawn(async move {
                // Check if blacklisted
                let was_blacklisted = store_clone.is_blacklisted(&token_clone).await;

                // Blacklist the token
                store_clone.blacklist_token(token_clone.clone()).await;

                was_blacklisted
            });

            handles.push(handle);
        }

        // Collect results
        let mut results = vec![];
        for handle in handles {
            results.push(handle.await.unwrap());
        }

        // Only the first task should have found the token not blacklisted
        assert_eq!(
            results
                .iter()
                .filter(|&&was_blacklisted| !was_blacklisted)
                .count(),
            1
        );

        // Final check - token should be blacklisted
        assert!(store.is_blacklisted(&token_id).await);
    }
}
