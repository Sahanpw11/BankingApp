# Modified add_test_data.py with better error handling
from app import create_app, db
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.payee import Payee
from app.models.biller import Biller, SavedBiller
from datetime import datetime, timedelta
import random
import string
import traceback

def generate_account_number():
    """Generate a random 10-digit account number"""
    return ''.join(random.choices(string.digits, k=10))

def create_test_data():
    try:
        app = create_app()
        print("App created successfully")
        
        with app.app_context():
            print("Creating database tables if they don't exist...")
            db.create_all()
            
            print("Adding admin user...")
            # Try adding just the admin user first to isolate issues
            admin_user = User(
                username="admin",
                email="admin@bankingapp.com",
                first_name="Admin",
                last_name="User",
                phone_number="555-123-4567",
                is_admin=True,
                is_active=True,
                email_verified=True,  # Changed from is_verified to email_verified
                created_at=datetime.utcnow()
            )
            # Use the password property setter instead of set_password method
            admin_user.password = "Admin123!"
            
            db.session.add(admin_user)
            
            try:
                print("Committing admin user...")
                db.session.commit()
                print(f"Admin user created with ID: {admin_user.id}")
                
                # Continue with other data if the admin user was successful
                
                # 2. Create Regular User
                regular_user = User(
                    username="user",
                    email="user@example.com",
                    first_name="Regular",
                    last_name="User",
                    phone_number="555-987-6543",
                    is_admin=False,
                    is_active=True,
                    email_verified=True,  # Changed from is_verified to email_verified
                    created_at=datetime.utcnow()
                )
                # Use the password property setter
                regular_user.password = "User123!"
                
                # Add users to database
                db.session.add(regular_user)
                db.session.commit()
                
                # 3. Create Accounts for Admin
                admin_checking = Account(
                    account_number=generate_account_number(),
                    account_type="Checking",
                    user_id=admin_user.id,
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                admin_checking.balance = 50000.00  # $50,000
                
                admin_savings = Account(
                    account_number=generate_account_number(),
                    account_type="Savings",
                    user_id=admin_user.id,
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                admin_savings.balance = 100000.00  # $100,000
                
                # 4. Create Accounts for Regular User
                user_checking = Account(
                    account_number=generate_account_number(),
                    account_type="Checking",
                    user_id=regular_user.id,
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                user_checking.balance = 5000.00  # $5,000
                
                user_savings = Account(
                    account_number=generate_account_number(),
                    account_type="Savings",
                    user_id=regular_user.id,
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                user_savings.balance = 15000.00  # $15,000
                
                # Add accounts to database
                db.session.add(admin_checking)
                db.session.add(admin_savings)
                db.session.add(user_checking)
                db.session.add(user_savings)
                db.session.commit()
                
                # 5. Create Sample Billers
                billers = [
                    Biller(name="City Power & Light", category="Utilities"),
                    Biller(name="Water Works", category="Utilities"),
                    Biller(name="Internet Provider", category="Telecommunications"),
                    Biller(name="Mobile Service", category="Telecommunications"),
                    Biller(name="Credit Card Company", category="Financial"),
                    Biller(name="Auto Insurance", category="Insurance")
                ]
                
                for biller in billers:
                    db.session.add(biller)
                
                db.session.commit()
                
                # 6. Add Saved Billers for Regular User
                saved_biller1 = SavedBiller(
                    user_id=regular_user.id,
                    biller_id=billers[0].id,
                    account_number="UTIL-1234567",
                    nickname="Electricity Bill",
                    is_favorite=True
                )
                
                saved_biller2 = SavedBiller(
                    user_id=regular_user.id,
                    biller_id=billers[2].id,
                    account_number="NET-7654321",
                    nickname="Home Internet",
                    is_favorite=False
                )
                
                db.session.add(saved_biller1)
                db.session.add(saved_biller2)
                
                # 7. Create Sample Transactions for Regular User
                # Deposit
                deposit = Transaction(
                    transaction_type="deposit",
                    destination_account_id=user_checking.id,
                    description="Salary Deposit",
                    status="completed",
                    created_at=datetime.utcnow() - timedelta(days=15),
                    completed_at=datetime.utcnow() - timedelta(days=15)
                )
                deposit.amount = 3000.00
                
                # Bill Payment
                bill_payment = Transaction(
                    transaction_type="payment",
                    source_account_id=user_checking.id,
                    description="Electricity Bill Payment",
                    status="completed",
                    created_at=datetime.utcnow() - timedelta(days=7),
                    completed_at=datetime.utcnow() - timedelta(days=7)
                )
                bill_payment.amount = 150.00
                
                # Transfer to Savings
                transfer = Transaction(
                    transaction_type="transfer",
                    source_account_id=user_checking.id,
                    destination_account_id=user_savings.id,
                    description="Monthly Savings Transfer",
                    status="completed",
                    created_at=datetime.utcnow() - timedelta(days=3),
                    completed_at=datetime.utcnow() - timedelta(days=3)
                )
                transfer.amount = 500.00
                
                # Pending Transaction
                pending_payment = Transaction(
                    transaction_type="payment",
                    source_account_id=user_checking.id,
                    description="Upcoming Rent Payment",
                    status="pending",
                    created_at=datetime.utcnow() - timedelta(days=1)
                )
                pending_payment.amount = 1200.00
                
                db.session.add(deposit)
                db.session.add(bill_payment)
                db.session.add(transfer)
                db.session.add(pending_payment)
                
                # 8. Add a Payee for Regular User
                payee = Payee(
                    name="John Smith",
                    account_number="9876543210",
                    bank_name="Other Bank",
                    routing_number="987654321",
                    user_id=regular_user.id,
                    email="johnsmith@example.com",
                    phone="555-111-2222"
                )
                
                db.session.add(payee)
                
                # Commit all remaining changes
                db.session.commit()
                
                print("Test data created successfully!")
                print(f"Admin User: Email: admin@bankingapp.com, Password: Admin123!")
                print(f"Regular User: Email: user@example.com, Password: User123!")
                
            except Exception as e:
                db.session.rollback()
                print(f"Error adding admin user: {str(e)}")
                traceback.print_exc()
                
    except Exception as e:
        print(f"Error setting up app context: {str(e)}")
        traceback.print_exc()

if __name__ == "__main__":
    create_test_data()