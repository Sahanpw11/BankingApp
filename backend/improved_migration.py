"""
Improved migration script to transfer data from SQLite to PostgreSQL.

This script:
1. Connects to both the SQLite and PostgreSQL databases
2. Disables foreign key constraints in PostgreSQL during migration
3. Transfers all data from SQLite to PostgreSQL in the correct order
4. Re-enables foreign key constraints after migration
"""

import os
import sys
import time
import logging
from sqlalchemy import create_engine, MetaData, Table, select, insert, text

# Add the backend directory to the path so we can import the app modules
sys.path.insert(0, os.path.abspath('.'))

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[logging.StreamHandler(), 
                              logging.FileHandler('migration.log')])

logger = logging.getLogger(__name__)

# SQLite connection string
SQLITE_URL = 'sqlite:///instance/banking.db'

# PostgreSQL connection parameters
POSTGRES_SERVER = os.environ.get("POSTGRES_SERVER", "localhost")
POSTGRES_PORT = os.environ.get("POSTGRES_PORT", "5432")
POSTGRES_DB = os.environ.get("POSTGRES_DB", "bankingapp")
POSTGRES_USER = os.environ.get("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "3277212382")

# Build PostgreSQL connection string
POSTGRES_URL = f'postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}'

def connect_to_db(url):
    """Connect to a database and return engine and metadata"""
    try:
        engine = create_engine(url)
        metadata = MetaData()
        metadata.reflect(bind=engine)
        logger.info(f"Connected to {url}")
        return engine, metadata
    except Exception as e:
        logger.error(f"Failed to connect to {url}: {e}")
        sys.exit(1)

def clear_postgres_tables(engine):
    """Clear all data from PostgreSQL tables"""
    # Get list of all tables
    with engine.connect() as conn:
        # List all table names
        result = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
        tables = [row[0] for row in result]
        
        # Disable triggers/constraints
        conn.execute(text("SET session_replication_role = 'replica'"))
        
        # Truncate all tables
        for table_name in tables:
            if table_name != 'alembic_version':  # Skip migration tables
                logger.info(f"Clearing table: {table_name}")
                conn.execute(text(f"TRUNCATE TABLE {table_name} CASCADE"))
        
        # Re-enable triggers/constraints
        conn.execute(text("SET session_replication_role = 'origin'"))
        
        conn.commit()
        logger.info("All PostgreSQL tables cleared successfully")

def migrate_table(source_engine, dest_engine, table_name):
    """Migrate data from source table to destination table"""
    start_time = time.time()
    
    # Create metadata objects for both databases
    source_metadata = MetaData()
    dest_metadata = MetaData()
    
    # Reflect tables from both databases
    source_metadata.reflect(bind=source_engine, only=[table_name])
    dest_metadata.reflect(bind=dest_engine)
    
    # Get source table
    source_table = Table(table_name, source_metadata, autoload_with=source_engine)
    
    # Get destination table
    dest_table = Table(table_name, dest_metadata, autoload_with=dest_engine)
    
    # Get column names from source table
    source_columns = [c.name for c in source_table.columns]
    dest_columns = [c.name for c in dest_table.columns]
    
    # Find common columns (to handle schema differences)
    common_columns = list(set(source_columns).intersection(set(dest_columns)))
    
    # Query all data from source table
    with source_engine.connect() as source_conn:
        # Handle SQLAlchemy 2.0 query format
        query = select(*[source_table.c[col] for col in common_columns])
        result = source_conn.execute(query)
        rows = result.fetchall()
        
        # Insert data into destination table
        if rows:
            logger.info(f"Migrating {len(rows)} rows from {table_name}")
            
            # Use batched inserts for better performance
            batch_size = 500
            for i in range(0, len(rows), batch_size):
                batch = rows[i:i + batch_size]
                
                # Convert rows to list of dicts for insertion
                data_to_insert = []
                for row in batch:
                    row_dict = {}
                    for idx, col in enumerate(common_columns):
                        row_dict[col] = row[idx]
                    data_to_insert.append(row_dict)
                
                try:
                    with dest_engine.connect() as dest_conn:
                        stmt = insert(dest_table).values(data_to_insert)
                        dest_conn.execute(stmt)
                        dest_conn.commit()
                    
                    logger.info(f"Inserted batch {i//batch_size + 1} ({min(i + batch_size, len(rows))}/{len(rows)} rows)")
                except Exception as e:
                    logger.error(f"Error inserting batch: {e}")
                    raise
        else:
            logger.info(f"No data to migrate for table {table_name}")
      # Verify counts match
    with source_engine.connect() as source_conn:
        # Handle SQLAlchemy 2.0 query syntax for counting rows
        source_count_query = select(text(f"COUNT(*) FROM {table_name}"))
        source_count = source_conn.execute(source_count_query).scalar()
    
    with dest_engine.connect() as dest_conn:
        dest_count_query = select(text(f"COUNT(*) FROM {table_name}"))
        dest_count = dest_conn.execute(dest_count_query).scalar()
    
    duration = time.time() - start_time
    logger.info(f"Table {table_name}: Migrated {dest_count}/{source_count} rows in {duration:.2f} seconds")
    
    return source_count, dest_count

def main():
    """Main migration function"""
    try:
        logger.info("Starting improved migration from SQLite to PostgreSQL...")
        
        # Connect to both databases
        sqlite_engine, sqlite_metadata = connect_to_db(SQLITE_URL)
        postgres_engine, postgres_metadata = connect_to_db(POSTGRES_URL)
        
        # Get all table names from SQLite
        table_names = sqlite_metadata.tables.keys()
        logger.info(f"Found {len(table_names)} tables in SQLite: {', '.join(table_names)}")
        
        # Clear PostgreSQL tables first
        clear_postgres_tables(postgres_engine)
        
        # Disable foreign key constraints in PostgreSQL
        with postgres_engine.connect() as conn:
            conn.execute(text("SET session_replication_role = 'replica'"))
            conn.commit()
            logger.info("Foreign key constraints disabled")
        
        # Migration summary
        total_tables = len(table_names)
        successful_tables = 0
        total_sqlite_rows = 0
        total_postgres_rows = 0
        
        # Determine migration order (handle foreign key dependencies)
        # Tables without foreign keys should be migrated first
        migration_order = [
            'users',
            'security_settings',
            'accounts',
            'transactions',
            'payees',
            'billers',
            'saved_billers'
        ]
        
        # Add any tables not explicitly ordered to the end
        for table in table_names:
            if table not in migration_order:
                migration_order.append(table)
        
        # Filter migration_order to only include tables that actually exist
        migration_order = [table for table in migration_order if table in table_names]
        
        logger.info(f"Migration order: {', '.join(migration_order)}")
        
        # Migrate each table
        start_time = time.time()
        for table_name in migration_order:
            try:
                sqlite_count, postgres_count = migrate_table(sqlite_engine, postgres_engine, table_name)
                total_sqlite_rows += sqlite_count
                total_postgres_rows += postgres_count
                
                if sqlite_count == postgres_count:
                    successful_tables += 1
            except Exception as e:
                logger.error(f"Error migrating table {table_name}: {e}")
        
        # Re-enable foreign key constraints in PostgreSQL
        with postgres_engine.connect() as conn:
            conn.execute(text("SET session_replication_role = 'origin'"))
            conn.commit()
            logger.info("Foreign key constraints re-enabled")
        
        # Print summary
        duration = time.time() - start_time
        logger.info("\n" + "="*50)
        logger.info(f"Migration Summary:")
        logger.info(f"Total time: {duration:.2f} seconds")
        logger.info(f"Tables: {successful_tables}/{total_tables} successfully migrated")
        logger.info(f"Rows: {total_postgres_rows}/{total_sqlite_rows} successfully migrated")
        logger.info("="*50)
        
        if successful_tables == total_tables and total_postgres_rows == total_sqlite_rows:
            logger.info("Migration completed successfully!")
        else:
            logger.warning("Migration completed with some issues. Check the log for details.")
            
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
