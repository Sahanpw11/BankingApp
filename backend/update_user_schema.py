#!/usr/bin/env python
"""
Update User Schema script to add new profile fields
"""
from app import create_app, db
from sqlalchemy import Column, String, Date, text
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def update_user_schema():
    """
    Add new columns to the user table to support enhanced profile functionality
    """
    app = create_app()
    with app.app_context():
        logger.info("Starting user schema update...")
        
        # Get database engine
        engine = db.engine
        inspector = db.inspect(engine)
        
        # Check if columns already exist
        columns = [col['name'] for col in inspector.get_columns('users')]
        
        # Add date_of_birth column if it doesn't exist
        if 'date_of_birth' not in columns:
            logger.info("Adding date_of_birth column to users table")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN date_of_birth DATE"))
                conn.commit()
        
        # Add address column if it doesn't exist
        if 'address' not in columns:
            logger.info("Adding address column to users table")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN address VARCHAR(200)"))
                conn.commit()
        
        # Add occupation column if it doesn't exist
        if 'occupation' not in columns:
            logger.info("Adding occupation column to users table")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN occupation VARCHAR(100)"))
                conn.commit()
        
        # Add security question columns if they don't exist
        if 'security_question' not in columns:
            logger.info("Adding security_question column to users table")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN security_question VARCHAR(100)"))
                conn.commit()
                
        if 'security_answer' not in columns:
            logger.info("Adding security_answer column to users table")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN security_answer VARCHAR(100)"))
                conn.commit()
                
        logger.info("User schema update completed successfully!")
        
if __name__ == "__main__":
    update_user_schema()
