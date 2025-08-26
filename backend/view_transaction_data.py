#!/usr/bin/env python
"""
Script to view decrypted transaction amounts and digital signature information
from the PostgreSQL database.
"""
from app import create_app
from app.models.transaction import Transaction
import base64
import sys

def view_transaction_data(transaction_id=None, limit=10):
    """
    View decrypted transaction data.
    
    Args:
        transaction_id (str, optional): Specific transaction ID to view
        limit (int, optional): How many transactions to show if not filtering by ID
    """
    app = create_app()
    with app.app_context():
        if transaction_id:
            transactions = Transaction.query.filter_by(id=transaction_id).all()
        else:
            transactions = Transaction.query.limit(limit).all()
            
        if not transactions:
            print(f"No transactions found {'with ID ' + transaction_id if transaction_id else ''}")
            return
            
        print(f"Found {len(transactions)} transaction(s)")
        
        for i, tx in enumerate(transactions):
            print(f"\n----- Transaction #{i+1} -----")
            print(f"ID: {tx.id}")
            print(f"Type: {tx.transaction_type}")
            print(f"Description: {tx.description}")
            print(f"Status: {tx.status}")
            print(f"Reference: {tx.reference}")
            print(f"Created: {tx.created_at}")
            print(f"Completed: {tx.completed_at}")
              # Print decrypted amount
            try:
                print(f"Amount: ${tx.amount:.2f}")
                # Show encrypted amount in base64 format for reference
                print(f"Raw encrypted amount: {base64.b64encode(tx.amount_encrypted).decode('utf-8')} (base64)")
                
                # Also try to directly decrypt the amount encrypted data
                from app.security.encryption import decrypt_data
                raw_decrypted = decrypt_data(tx.amount_encrypted).decode('utf-8')
                print(f"Direct decrypted amount: {raw_decrypted}")
            except Exception as e:
                print(f"Error decrypting amount: {e}")
                  # Print signature info
            if tx.digital_signature:
                print(f"Has digital signature: Yes")
                sig_preview = base64.b64encode(tx.digital_signature[:20] + b'...').decode('utf-8')
                print(f"Signature (preview): {sig_preview}")
                
                # Show signature metadata if available
                if tx.meta_data and 'signature_info' in tx.meta_data:
                    print("Signature metadata:")
                    for key, value in tx.meta_data['signature_info'].items():
                        # Format the timestamp as a readable string if it's a timestamp
                        if key == 'signed_at' and value:
                            try:
                                # Try to parse as ISO format and display in a more readable format
                                from datetime import datetime
                                dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                                print(f"  {key}: {dt.strftime('%Y-%m-%d %H:%M:%S UTC')} (ISO: {value})")
                            except:
                                # If parsing fails, just show the original value
                                print(f"  {key}: {value}")
                        else:
                            print(f"  {key}: {value}")
            else:
                print("Has digital signature: No")
                
if __name__ == "__main__":
    if len(sys.argv) > 1:
        view_transaction_data(transaction_id=sys.argv[1])
    else:
        view_transaction_data()
