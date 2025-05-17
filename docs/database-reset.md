# Database Reset Feature

This document describes the database reset feature for development environments in the WellPharm application.

## Overview

The database reset feature allows developers to completely delete and recreate the database to start from a clean state. This is useful for testing, development, and troubleshooting.

## Safety Measures

To prevent accidental data loss, the following safety measures are in place:

1. **Environment Restriction**: The reset feature only works in development environments.
2. **Database Name Check**: The database name must contain "dev" or "test" to be eligible for reset.
3. **Command-line Flag**: When using the CLI, an explicit flag must be provided. (WELL_PHARM_RESET_DB=true)

## Usage

### From the Command Line

```bash
# Using environment variables with the main application
WELL_PHARM_RESET_DB=true well-pharm
```

## Implementation Details

The database reset functionality is implemented in the `db_service` crate:

- `reset_database(url: &str, environment: &str)` - Core function that handles the reset process
- Safety checks ensure the operation is only performed in development environments
- Both command-line tools and PostgreSQL SQL commands are used for maximum compatibility

## Troubleshooting

If you encounter issues with the database reset:

1. Ensure you're in a development environment
2. Check that your database name contains "dev" or "test"
3. Verify that you have sufficient permissions to drop and create databases
4. Check the logs for detailed error messages

## Adding Reset Support to New Database Entities

When adding new database entities, no special handling is needed for reset support. The reset process drops and recreates the entire database, so all tables will be recreated through the standard migration process.
