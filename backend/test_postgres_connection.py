"""
Test PostgreSQL database connection and basic operations.

This script performs basic tests on the PostgreSQL database to ensure
that it's working correctly after migration:
1. Tests connection to the database
2. Executes basic queries on all main tables
3. Verifies transaction operations with retry logic
"""

import os
import sys
import logging
import time
import random
from sqlalchemy.exc import OperationalError, IntegrityError

# Add the backend directory to the path so we can import the app modules
sys.path.insert(0, os.path.abspath('.'))

from app import create_app, db
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.security_settings import SecuritySettings
from app.models.payee import Payee
from app.models.biller import Biller, SavedBiller

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

logger = logging.getLogger(__name__)

def test_database_connection():
    """Test connection to the PostgreSQL database"""
    try:
        logger.info("Testing database connection...")
        with app.app_context():
            db.session.execute(db.select(db.text("1"))).scalar()
        logger.info("✓ Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        return False

def test_basic_queries():
    """Test basic queries on all main tables"""
    try:
        logger.info("Testing basic queries...")
        
        with app.app_context():
            # Test users table
            user_count = db.session.query(User).count()
            logger.info(f"✓ User count: {user_count}")
            
            # Test accounts table
            account_count = db.session.query(Account).count()
            logger.info(f"✓ Account count: {account_count}")
            
            # Test transactions table
            transaction_count = db.session.query(Transaction).count()
            logger.info(f"✓ Transaction count: {transaction_count}")
            
            # Test security settings table
            security_count = db.session.query(SecuritySettings).count()
            logger.info(f"✓ Security settings count: {security_count}")
            
            # Test payees table
            payee_count = db.session.query(Payee).count()
            logger.info(f"✓ Payee count: {payee_count}")
            
            # Test billers table
            biller_count = db.session.query(Biller).count()
            logger.info(f"✓ Biller count: {biller_count}")
            
            # Test saved billers table
            saved_biller_count = db.session.query(SavedBiller).count()
            logger.info(f"✓ Saved biller count: {saved_biller_count}")
        
        return True
    except Exception as e:
        logger.error(f"Query test failed: {str(e)}")
        return False

def test_transaction_with_retry():
    """Test transaction with retry logic"""
    try:
        logger.info("Testing transaction with retry logic...")
        
        with app.app_context():
            # Find a test user or create one
            test_user = User.query.filter_by(username='test_user').first()
            
            if not test_user:
                logger.info("Creating test user...")
                test_user = User(
                    username='test_user',
                    email='test@example.com',
                    first_name='Test',
                    last_name='User',
                    password='SecurePassword123!',
                    is_active=True
                )
                db.session.add(test_user)
                db.session.commit()
            
            # Find test accounts or create them
            source_account = Account.query.filter_by(account_number='TEST-SRC-ACCT').first()
            dest_account = Account.query.filter_by(account_number='TEST-DEST-ACCT').first()
            
            if not source_account:
                logger.info("Creating test source account...")
                source_account = Account(
                    account_number='TEST-SRC-ACCT',
                    account_type='checking',
                    user_id=test_user.id,
                    is_active=True
                )
                source_account.balance = 1000.00
                db.session.add(source_account)
            
            if not dest_account:
                logger.info("Creating test destination account...")
                dest_account = Account(
                    account_number='TEST-DEST-ACCT',
                    account_type='savings',
                    user_id=test_user.id,
                    is_active=True
                )
                dest_account.balance = 500.00
                db.session.add(dest_account)
                
            db.session.commit()
            
            # Create a test transaction
            test_amount = round(random.uniform(10.00, 100.00), 2)
            logger.info(f"Creating test transaction for ${test_amount}...")
            
            # Get initial balances
            initial_source_balance = source_account.balance
            initial_dest_balance = dest_account.balance
            
            transaction = Transaction(
                transaction_type='transfer',
                source_account_id=source_account.id,
                destination_account_id=dest_account.id,
                description='Test transaction with retry',
                status='pending',
                reference=f"TEST-{int(time.time())}"
            )
            transaction.amount = test_amount
            
            # Update account balances
            source_account.balance = initial_source_balance - test_amount
            dest_account.balance = initial_dest_balance + test_amount
            
            db.session.add(transaction)
            
            # Try to commit with retry logic
            retry_count = 0
            max_retries = 3
            success = False
            
            while retry_count < max_retries and not success:
                try:
                    logger.info(f"Commit attempt {retry_count + 1}...")
                    db.session.commit()
                    success = True
                    logger.info("✓ Transaction committed successfully")
                except (OperationalError, IntegrityError) as e:
                    logger.warning(f"Commit failed (attempt {retry_count + 1}): {str(e)}")
                    db.session.rollback()
                    retry_count += 1
                    if retry_count >= max_retries:
                        raise
                    time.sleep(0.5)  # Short delay before retry
            
            # Verify the transaction effects
            db.session.refresh(source_account)
            db.session.refresh(dest_account)
            
            logger.info(f"Source account balance: ${source_account.balance:.2f} (was: ${initial_source_balance:.2f})")
            logger.info(f"Destination account balance: ${dest_account.balance:.2f} (was: ${initial_dest_balance:.2f})")
            
            if abs(source_account.balance - (initial_source_balance - test_amount)) < 0.01 and \
               abs(dest_account.balance - (initial_dest_balance + test_amount)) < 0.01:
                logger.info("✓ Account balances correctly updated")
            else:
                logger.error("Account balances not correctly updated")
                return False
            
        return True
    except Exception as e:
        logger.error(f"Transaction test failed: {str(e)}")
        return False

if __name__ == "__main__":
    try:
        logger.info("Starting PostgreSQL database tests...")
        
        # Create Flask app with PostgreSQL config
        app = create_app()
        
        # Run tests
        connection_ok = test_database_connection()
        if not connection_ok:
            logger.error("Database connection test failed, aborting further tests")
            sys.exit(1)
        
        queries_ok = test_basic_queries()
        if not queries_ok:
            logger.error("Basic query test failed, aborting further tests")
            sys.exit(1)
        
        transaction_ok = test_transaction_with_retry()
        if not transaction_ok:
            logger.error("Transaction test failed")
            sys.exit(1)
        
        logger.info("All database tests completed successfully!")
        logger.info("PostgreSQL migration appears to be working correctly")
        
    except Exception as e:
        logger.error(f"Test execution failed: {str(e)}")
        sys.exit(1)
