"""
Database Schema Update Script

This script updates the transactions table to add new columns needed for bill payments.
Run this script once to apply the changes to your existing database.
"""

import sqlite3
import logging
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path to the SQLite database - adjust this path as needed
DB_PATH = os.path.join('instance', 'banking.db')
ABS_DB_PATH = os.path.abspath(DB_PATH)

def update_transactions_table():
    """Add missing columns to the transactions table"""
    try:
        # Connect to the database
        logger.info(f"Connecting to database at {ABS_DB_PATH}")
        conn = sqlite3.connect(ABS_DB_PATH)
        cursor = conn.cursor()
        
        # Check if the columns already exist
        cursor.execute("PRAGMA table_info(transactions)")
        columns = [col[1] for col in cursor.fetchall()]
        logger.info(f"Current columns in transactions table: {columns}")
        
        # Add the reference column if it doesn't exist
        if 'reference' not in columns:
            logger.info("Adding 'reference' column to transactions table")
            cursor.execute("ALTER TABLE transactions ADD COLUMN reference TEXT")
        
        # Add the category column if it doesn't exist
        if 'category' not in columns:
            logger.info("Adding 'category' column to transactions table")
            cursor.execute("ALTER TABLE transactions ADD COLUMN category TEXT")
        
        # Add the currency column if it doesn't exist
        if 'currency' not in columns:
            logger.info("Adding 'currency' column to transactions table")
            cursor.execute("ALTER TABLE transactions ADD COLUMN currency TEXT DEFAULT 'USD'")
        
        # Add the meta_data column if it doesn't exist
        if 'meta_data' not in columns:
            logger.info("Adding 'meta_data' column to transactions table")
            cursor.execute("ALTER TABLE transactions ADD COLUMN meta_data JSON")
        
        # Commit the changes
        conn.commit()
        logger.info("Successfully updated transactions table schema")
        
    except Exception as e:
        logger.error(f"Error updating transactions table: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        # Close the connection
        if conn:
            conn.close()

if __name__ == "__main__":
    logger.info("Starting database schema update...")
    update_transactions_table()
    logger.info("Database schema update completed")