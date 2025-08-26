"""
Script to fix existing transactions:
1. Add digital signatures to transactions that don't have them
2. Add reference values to transactions with empty references
"""

from app import db, create_app
from app.models.transaction import Transaction
from app.security.transaction_signer import sign_bank_transaction
import uuid

def generate_reference(transaction):
    """Generate a reference number based on transaction type"""
    prefix = "TXN"
    if transaction.transaction_type == 'transfer':
        prefix = "TRF"
    elif transaction.transaction_type == 'external_transfer':
        prefix = "EXT"
    elif transaction.transaction_type == 'payment':
        prefix = "PAY"
    elif transaction.transaction_type == 'deposit':
        prefix = "DEP"
    elif transaction.transaction_type == 'withdrawal':
        prefix = "WDR"
    
    # Create a unique ID using first 8 chars of a UUID
    unique_id = uuid.uuid4().hex[:8].upper()
    return f"{prefix}-{unique_id}"

def main():
    """Fix transactions with NULL signatures and empty references"""
    print("Starting transaction fixes...")
    
    # Get all transactions
    transactions = Transaction.query.all()
    
    # Count statistics
    signature_updates = 0
    reference_updates = 0
    
    for transaction in transactions:
        # Fix missing digital signatures
        if transaction.digital_signature is None and transaction.status == 'completed':
            try:
                sign_bank_transaction(transaction)
                signature_updates += 1
                print(f"Added digital signature to transaction {transaction.id}")
            except Exception as e:
                print(f"Error adding signature to {transaction.id}: {str(e)}")
        
        # Fix missing references
        if transaction.reference is None or transaction.reference == '':
            transaction.reference = generate_reference(transaction)
            reference_updates += 1
            print(f"Added reference {transaction.reference} to transaction {transaction.id}")
    
    # Commit all changes
    db.session.commit()
    
    print(f"Fixes complete:")
    print(f"- Added {signature_updates} digital signatures")
    print(f"- Added {reference_updates} reference numbers")

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        main()
