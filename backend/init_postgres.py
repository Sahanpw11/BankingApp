"""
Initialize PostgreSQL database for BankingApp

This script:
1. Connects to PostgreSQL
2. Creates the database if it doesn't exist
3. Creates the tables using SQLAlchemy models
"""

import os
import sys
import psycopg2
import logging
from sqlalchemy_utils import database_exists, create_database

# Add the backend directory to the path so we can import the app modules
sys.path.insert(0, os.path.abspath('.'))

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

logger = logging.getLogger(__name__)

# PostgreSQL connection parameters
POSTGRES_SERVER = os.environ.get("POSTGRES_SERVER", "localhost")
POSTGRES_PORT = os.environ.get("POSTGRES_PORT", "5432")
POSTGRES_DB = os.environ.get("POSTGRES_DB", "bankingapp")
POSTGRES_USER = os.environ.get("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "3277212382")

# Build PostgreSQL connection string
POSTGRES_URL = f'postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}'

def create_db_if_not_exists():
    """Create the PostgreSQL database if it doesn't exist"""
    try:
        # First try to connect to the database
        if not database_exists(POSTGRES_URL):
            # Connect to PostgreSQL server
            conn = psycopg2.connect(
                host=POSTGRES_SERVER,
                port=POSTGRES_PORT,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD
            )
            conn.autocommit = True
            
            # Create a cursor
            cursor = conn.cursor()
            
            # Create the database
            logger.info(f"Creating database {POSTGRES_DB}...")
            cursor.execute(f"CREATE DATABASE {POSTGRES_DB}")
            
            # Close the connection
            cursor.close()
            conn.close()
            
            # Create the database using SQLAlchemy-Utils
            create_database(POSTGRES_URL)
            logger.info(f"Database {POSTGRES_DB} created successfully")
        else:
            logger.info(f"Database {POSTGRES_DB} already exists")
            
    except Exception as e:
        logger.error(f"Error creating database: {e}")
        raise

def init_db_tables():
    """Initialize database tables using SQLAlchemy models"""
    try:
        # Import app and models
        from app import create_app, db
        from app.models.user import User
        from app.models.account import Account
        from app.models.transaction import Transaction
        from app.models.security_settings import SecuritySettings
        from app.models.payee import Payee
        from app.models.biller import Biller, SavedBiller
        
        # Create Flask app with PostgreSQL config
        app = create_app()
        
        # Create tables
        with app.app_context():
            logger.info("Creating database tables...")
            db.create_all()
            logger.info("Database tables created successfully")
            
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}")
        raise

def main():
    """Main function to initialize the PostgreSQL database"""
    try:
        logger.info("Starting PostgreSQL database initialization...")
        
        # Step 1: Create the database if it doesn't exist
        create_db_if_not_exists()
        
        # Step 2: Initialize database tables
        init_db_tables()
        
        logger.info("PostgreSQL database initialization completed successfully")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
