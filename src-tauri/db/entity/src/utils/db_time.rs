use chrono::{DateTime, FixedOffset, Utc};
use sea_orm::Value;
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum TimeError {
    #[error("Failed to parse time: {0}")]
    ParseError(String),
    #[error("Chrono error: {0}")]
    ChronoError(#[from] chrono::ParseError),
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub struct DbTime(DateTime<FixedOffset>);

impl DbTime {
    /// Creates a new Time instance from the current UTC time
    pub fn now() -> Self {
        let now: DateTime<Utc> = Utc::now();
        Self(now.into())
    }

    /// Creates a Time instance from a timestamp (seconds since Unix epoch)
    pub fn from_timestamp(timestamp: i64) -> Option<Self> {
        DateTime::from_timestamp(timestamp, 0).map(|dt| Self(dt.into()))
    }

    /// Returns the timestamp in seconds since Unix epoch
    pub fn timestamp(&self) -> i64 {
        self.0.timestamp()
    }

    /// Returns an ISO 8601 formatted string
    pub fn to_iso8601(&self) -> String {
        self.0.to_rfc3339()
    }

    /// Returns true if this time is in the future
    pub fn is_future(&self) -> bool {
        let now: DateTime<FixedOffset> = Utc::now().into();
        self.0 > now
    }

    /// Returns true if this time is in the past
    pub fn is_past(&self) -> bool {
        let now: DateTime<FixedOffset> = Utc::now().into();
        self.0 < now
    }

    /// Adds the specified number of seconds to the time
    pub fn add_seconds(&self, seconds: i64) -> Self {
        Self(self.0 + chrono::Duration::seconds(seconds))
    }

    /// Returns the underlying DateTime
    pub fn inner(&self) -> &DateTime<FixedOffset> {
        &self.0
    }
}

impl FromStr for DbTime {
    type Err = TimeError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        DateTime::parse_from_rfc3339(s)
            .map(Self)
            .map_err(|e| TimeError::ParseError(e.to_string()))
    }
}

impl std::fmt::Display for DbTime {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.to_iso8601())
    }
}

impl From<DateTime<FixedOffset>> for DbTime {
    fn from(dt: DateTime<FixedOffset>) -> Self {
        Self(dt)
    }
}

impl From<DbTime> for DateTime<FixedOffset> {
    fn from(time: DbTime) -> Self {
        time.0
    }
}

impl From<DbTime> for Value {
    fn from(time: DbTime) -> Self {
        Value::ChronoDateTime(Some(Box::new(time.0.naive_utc())))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::SecondsFormat;
    use sea_orm::Value;

    #[test]
    fn test_time_now() {
        let time = DbTime::now();
        assert!(time.is_past() || time.timestamp() == Utc::now().timestamp());
    }

    #[test]
    fn test_from_timestamp() {
        let timestamp = 1609459200; // 2021-01-01 00:00:00
        let time = DbTime::from_timestamp(timestamp).unwrap();
        assert_eq!(time.timestamp(), timestamp);
    }

    #[test]
    fn test_iso8601() {
        let time = DbTime::now();
        let iso = time.to_iso8601();
        let parsed = DbTime::from_str(&iso).unwrap();
        assert_eq!(time, parsed);
    }

    #[test]
    fn test_add_seconds() {
        let time = DbTime::now();
        let later = time.add_seconds(60);
        assert!(later.timestamp() - time.timestamp() == 60);
    }

    #[test]
    fn test_past_future() {
        let past = DbTime::now().add_seconds(-60);
        let future = DbTime::now().add_seconds(60);
        assert!(past.is_past());
        assert!(future.is_future());
    }

    #[test]
    fn test_ordering() {
        let now = DbTime::now();
        let later = now.add_seconds(60);
        let earlier = now.add_seconds(-60);

        assert!(earlier < now);
        assert!(now < later);
        assert!(earlier <= now);
        assert!(now <= now);
        assert!(later > now);
        assert!(later >= now);

        // Test sorting
        let mut times = vec![later.clone(), earlier.clone(), now.clone()];
        times.sort();
        assert_eq!(times, vec![earlier, now, later]);
    }

    #[test]
    fn test_time_serialize() {
        let datetime = Utc::now().into();
        let time = DbTime(datetime);
        let expected_json = format!(
            "\"{}\"",
            datetime.to_rfc3339_opts(SecondsFormat::Nanos, true)
        );
        let serialized_json = serde_json::to_string(&time).unwrap();
        assert_eq!(serialized_json, expected_json);
    }

    #[test]
    fn test_time_deserialize() {
        let datetime = Utc::now().into();
        let time = DbTime(datetime);
        let json = format!("\"{}\"", datetime.to_rfc3339());
        let deserialized_time: DbTime = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized_time, time);
    }

    #[test]
    fn test_from_str_error() {
        let result = DbTime::from_str("invalid-time-format");
        assert!(result.is_err());
        match result {
            Err(TimeError::ParseError(_)) => (),
            _ => panic!("Expected ParseError"),
        }
    }

    #[test]
    fn test_display_implementation() {
        let time = DbTime::now();
        let displayed = format!("{}", time);
        assert_eq!(displayed, time.to_iso8601());
    }

    #[test]
    fn test_from_timestamp_edge_cases() {
        // Test with very old timestamp
        let ancient_time = DbTime::from_timestamp(0).unwrap(); // 1970-01-01
        assert_eq!(ancient_time.timestamp(), 0);

        // Test with future timestamp
        let future_time = DbTime::from_timestamp(32503680000).unwrap(); // Year 3000
        assert_eq!(future_time.timestamp(), 32503680000);

        // Test with negative timestamp (before 1970)
        let past_time = DbTime::from_timestamp(-31536000).unwrap(); // 1969-01-01
        assert_eq!(past_time.timestamp(), -31536000);
    }

    #[test]
    fn test_inner_method() {
        let time = DbTime::now();
        let inner = time.inner();
        assert_eq!(inner.timestamp(), time.timestamp());
    }

    #[test]
    fn test_conversion_from_datetime() {
        let dt: DateTime<FixedOffset> = Utc::now().into();
        let time = DbTime::from(dt);
        assert_eq!(time.inner().timestamp(), dt.timestamp());
    }

    #[test]
    fn test_conversion_to_datetime() {
        let time = DbTime::now();
        let dt: DateTime<FixedOffset> = time.clone().into();
        assert_eq!(dt.timestamp(), time.timestamp());
    }

    #[test]
    fn test_conversion_to_value() {
        let time = DbTime::now();
        let value: Value = time.clone().into();

        match value {
            Value::ChronoDateTime(Some(boxed_dt)) => {
                assert_eq!(boxed_dt.and_utc().timestamp(), time.timestamp());
            }
            _ => panic!("Expected ChronoDateTime variant"),
        }
    }
}
