"""
Temporary script to update existing transactions with proper binary digital signatures
This will replace text-based signatures like "System-2025-04-02-da78c7b2bd" with actual binary signatures
"""

from app import db, create_app
from app.models.transaction import Transaction
from app.security.transaction_signer import sign_bank_transaction

# Create the Flask application context
app = create_app()
with app.app_context():
    # Get all transactions with non-binary signatures
    transactions = Transaction.query.all()
    updated_count = 0
    
    for transaction in transactions:
        # Skip transactions that are already properly signed (binary data)
        # or ones that are NULL
        if transaction.digital_signature is None:
            continue
            
        try:
            # Get transaction data string
            transaction_data = f"{transaction.id}:{transaction.source_account_id}:{transaction.destination_account_id}:{transaction.amount}:{transaction.created_at}"
            
            # Sign with proper binary signature
            sign_bank_transaction(transaction)
            updated_count += 1
            print(f"Updated signature for transaction {transaction.id}")
        except Exception as e:
            print(f"Error updating transaction {transaction.id}: {str(e)}")
            
    # Commit changes
    db.session.commit()
    print(f"Updated {updated_count} transactions with proper binary signatures")
