"""
Add indexes to PostgreSQL database tables to optimize query performance.

This script creates indexes on frequently queried columns to improve performance
in the PostgreSQL database for the banking application.
"""

import os
import sys
import logging
from sqlalchemy import create_engine, text

# Add the backend directory to the path so we can import the app modules
sys.path.insert(0, os.path.abspath('.'))

from config import Config

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

logger = logging.getLogger(__name__)

def create_indexes():
    """Create indexes on the most commonly queried columns"""
    try:
        # Create database engine
        engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
        
        # Define indexes to create
        indexes = [
            # User table indexes
            {
                "name": "ix_users_username",
                "table": "users",
                "columns": "username"
            },
            {
                "name": "ix_users_email",
                "table": "users",
                "columns": "email"
            },
            
            # Account table indexes
            {
                "name": "ix_accounts_user_id",
                "table": "accounts",
                "columns": "user_id"
            },
            {
                "name": "ix_accounts_account_number",
                "table": "accounts",
                "columns": "account_number"
            },
            
            # Transaction table indexes
            {
                "name": "ix_transactions_source_account_id",
                "table": "transactions",
                "columns": "source_account_id"
            },
            {
                "name": "ix_transactions_destination_account_id",
                "table": "transactions",
                "columns": "destination_account_id"
            },
            {
                "name": "ix_transactions_created_at",
                "table": "transactions",
                "columns": "created_at"
            },
            {
                "name": "ix_transactions_status",
                "table": "transactions",
                "columns": "status"
            },
            
            # Composite index for transaction lookups by account and date
            {
                "name": "ix_transactions_account_date",
                "table": "transactions",
                "columns": "source_account_id, created_at"
            },
            
            # Security settings index
            {
                "name": "ix_security_settings_user_id",
                "table": "security_settings",
                "columns": "user_id"
            },
            
            # Payee index
            {
                "name": "ix_payees_user_id",
                "table": "payees",
                "columns": "user_id"
            },
            
            # Biller indexes
            {
                "name": "ix_billers_name",
                "table": "billers",
                "columns": "name"
            },
            {
                "name": "ix_saved_billers_user_id",
                "table": "saved_billers",
                "columns": "user_id"
            }
        ]
        
        # Create each index if it doesn't exist
        with engine.connect() as conn:
            for index in indexes:
                try:
                    # Check if index exists
                    result = conn.execute(text(
                        f"SELECT to_regclass('public.{index['name']}');"
                    ))
                    
                    exists = result.scalar() is not None
                    
                    if not exists:
                        logger.info(f"Creating index {index['name']} on {index['table']}({index['columns']})")
                        conn.execute(text(
                            f"CREATE INDEX IF NOT EXISTS {index['name']} ON {index['table']} ({index['columns']});"
                        ))
                        conn.commit()
                    else:
                        logger.info(f"Index {index['name']} already exists")
                        
                except Exception as e:
                    logger.error(f"Failed to create index {index['name']}: {str(e)}")
        
        logger.info("Index creation completed")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {str(e)}")
        raise

def analyze_tables():
    """Run ANALYZE on tables to update statistics for the query planner"""
    try:
        # Create database engine
        engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
        
        tables = [
            "users", 
            "accounts", 
            "transactions", 
            "security_settings", 
            "payees", 
            "billers", 
            "saved_billers"
        ]
        
        with engine.connect() as conn:
            for table in tables:
                try:
                    logger.info(f"Running ANALYZE on table {table}")
                    conn.execute(text(f"ANALYZE {table};"))
                except Exception as e:
                    logger.error(f"Failed to analyze table {table}: {str(e)}")
        
        logger.info("Table analysis completed")
        
    except Exception as e:
        logger.error(f"Error analyzing tables: {str(e)}")
        raise

if __name__ == "__main__":
    try:
        logger.info("Starting PostgreSQL index optimization...")
        create_indexes()
        analyze_tables()
        logger.info("PostgreSQL optimization completed successfully")
    except Exception as e:
        logger.error(f"PostgreSQL optimization failed: {str(e)}")
        sys.exit(1)
