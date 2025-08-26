#!/usr/bin/env python
"""
Script to view decrypted transaction amounts and digital signature information
directly from the PostgreSQL database using SQLAlchemy.
"""
from sqlalchemy import create_engine, text
import base64
import sys
from config import POSTGRES_SERVER, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
import json
from app.security.encryption import decrypt_data

def view_transaction_data(transaction_id=None, limit=10):
    """
    View decrypted transaction data.
    
    Args:
        transaction_id (str, optional): Specific transaction ID to view
        limit (int, optional): How many transactions to show if not filtering by ID
    """
    # Create connection to PostgreSQL
    engine = create_engine(
        f'postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}'
    )
    
    with engine.connect() as connection:
        if transaction_id:
            query = text("SELECT * FROM transactions WHERE id = :id")
            result = connection.execute(query, {"id": transaction_id})
        else:
            query = text("SELECT * FROM transactions LIMIT :limit")
            result = connection.execute(query, {"limit": limit})
            
        rows = result.fetchall()
        if not rows:
            print(f"No transactions found {'with ID ' + transaction_id if transaction_id else ''}")
            return
            
        print(f"Found {len(rows)} transaction(s)")
        
        for i, row in enumerate(rows):
            row_dict = row._mapping
            print(f"\n----- Transaction #{i+1} -----")
            print(f"ID: {row_dict['id']}")
            print(f"Type: {row_dict['transaction_type']}")
            print(f"Description: {row_dict['description']}")
            print(f"Status: {row_dict['status']}")
            print(f"Reference: {row_dict['reference']}")
            print(f"Created: {row_dict['created_at']}")
            print(f"Completed: {row_dict['completed_at']}")
            
            # Print decrypted amount
            try:
                if row_dict['amount_encrypted']:
                    decrypted_amount = decrypt_data(row_dict['amount_encrypted'])
                    print(f"Amount: ${float(decrypted_amount.decode('utf-8')):.2f}")
                    print(f"Raw encrypted amount: {base64.b64encode(row_dict['amount_encrypted']).decode('utf-8')} (base64)")
                else:
                    print("Amount: [No encrypted data]")
            except Exception as e:
                print(f"Error decrypting amount: {e}")
                
            # Print signature info
            if row_dict['digital_signature']:
                print(f"Has digital signature: Yes")
                sig_preview = base64.b64encode(row_dict['digital_signature'][:20] + b'...').decode('utf-8')
                print(f"Signature (preview): {sig_preview}")
                
                # Show signature metadata if available
                if row_dict['meta_data'] and isinstance(row_dict['meta_data'], dict) and 'signature_info' in row_dict['meta_data']:
                    print("Signature metadata:")
                    for key, value in row_dict['meta_data']['signature_info'].items():
                        print(f"  {key}: {value}")
            else:
                print("Has digital signature: No")
                
if __name__ == "__main__":
    if len(sys.argv) > 1:
        view_transaction_data(transaction_id=sys.argv[1])
    else:
        view_transaction_data()
