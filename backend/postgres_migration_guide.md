# PostgreSQL Migration Guide

This guide provides step-by-step instructions for migrating the Banking Application from SQLite to PostgreSQL.

## Prerequisites

1. PostgreSQL server installed and running
2. Python environment with required packages installed:
   - sqlalchemy
   - psycopg2-binary
   - sqlalchemy-utils

If not installed, run:

```bash
pip install psycopg2-binary sqlalchemy-utils
```

## Migration Steps

### 1. Configure PostgreSQL Connection

The application is already configured to use PostgreSQL in `config.py`. If you need to modify connection parameters, edit the following:

```python
# PostgreSQL connection parameters
POSTGRES_SERVER = os.environ.get("POSTGRES_SERVER", "localhost")
POSTGRES_PORT = os.environ.get("POSTGRES_PORT", "5432")
POSTGRES_DB = os.environ.get("POSTGRES_DB", "bankingapp")
POSTGRES_USER = os.environ.get("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "3277212382")
```

You can also set these as environment variables.

### 2. Initialize the PostgreSQL Database

Run the initialization script to create the database and tables:

```bash
python init_postgres.py
```

This script will:
- Create the `bankingapp` database if it doesn't exist
- Create all the necessary tables using SQLAlchemy models

### 3. Migrate Data from SQLite to PostgreSQL

Run the migration script to transfer all data:

```bash
python migrate_to_postgres.py
```

This script will:
- Connect to both SQLite and PostgreSQL databases
- Transfer data table by table, respecting foreign key dependencies
- Report progress and validate data counts

### 4. Optimize PostgreSQL Performance

Add indexes to improve query performance:

```bash
python add_postgres_indexes.py
```

This script will:
- Create indexes on frequently queried columns
- Run ANALYZE to update statistics for the query planner

### 5. Test PostgreSQL Connection and Basic Operations

Verify that the database is working correctly:

```bash
python test_postgres_connection.py
```

This script will:
- Test the database connection
- Run basic queries on all tables
- Test transaction operations with retry logic

## Verification

After completing the migration, verify that:

1. All tables exist in PostgreSQL
2. All data has been transferred correctly
3. The application runs without errors using PostgreSQL

You can use the following SQL queries in PostgreSQL to verify the data:

```sql
-- Count records in main tables
SELECT 'users' AS table_name, COUNT(*) FROM users
UNION ALL
SELECT 'accounts', COUNT(*) FROM accounts
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;
```

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Verify PostgreSQL is running:
   ```bash
   pg_isready -h localhost -p 5432
   ```

2. Check credentials and permissions:
   ```bash
   psql -h localhost -p 5432 -U postgres -d bankingapp -c "SELECT 1"
   ```

### Data Migration Failures

If data migration fails:

1. Check the `migration.log` file for detailed error messages
2. Verify that the SQLite database is not corrupted
3. Run the migration script with specific tables if needed

### Application Errors

If the application shows errors after migration:

1. Check for database-specific SQL syntax issues
2. Verify that the SQLAlchemy URI is correctly formatted
3. Check the connection pooling settings

## Rollback

If you need to revert to SQLite:

1. Comment out PostgreSQL configuration in `config.py`
2. Uncomment SQLite configuration:
   ```python
   SQLALCHEMY_DATABASE_URI = 'sqlite:///banking.db'
   ```

## Performance Tuning

After migration, monitor the application performance. You may need to adjust:

1. Connection pool settings in `__init__.py`
2. Additional indexes based on query patterns
3. PostgreSQL server configuration for optimal performance
