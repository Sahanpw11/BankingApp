#!/usr/bin/env python
"""
Script to fix timestamp issues in transaction signature metadata.
This script updates all transactions that have signatures but incorrect or missing timestamps
in their metadata.
"""
from app import create_app
from app.models.transaction import Transaction
from datetime import datetime
import sys

def fix_signature_timestamps(dry_run=True):
    """
    Update signature metadata timestamps for all signed transactions.
    
    Args:
        dry_run (bool): If True, only show what would be changed without making changes
    """
    app = create_app()
    with app.app_context():
        # Get all transactions that have a digital signature
        signed_transactions = Transaction.query.filter(Transaction.digital_signature != None).all()
            
        if not signed_transactions:
            print(f"No signed transactions found")
            return
            
        print(f"Found {len(signed_transactions)} signed transaction(s)")
        
        fixed_count = 0
        for tx in signed_transactions:
            needs_update = False
            
            # Check if meta_data exists
            if not tx.meta_data:
                tx.meta_data = {}
                needs_update = True
                
            # Check if signature_info exists
            if 'signature_info' not in tx.meta_data:
                tx.meta_data['signature_info'] = {}
                needs_update = True
                
            # Check if signed_at is missing or might be incorrect
            signature_info = tx.meta_data['signature_info']
            
            if 'signed_at' not in signature_info or not signature_info['signed_at']:
                needs_update = True
            elif tx.completed_at and signature_info['signed_at'] != tx.completed_at.isoformat():
                # We'll assume the timestamp is wrong if it doesn't match the completed_at time
                needs_update = True
                
            if needs_update:
                print(f"\nFixing transaction {tx.id} ({tx.description}):")
                print(f"  Status: {tx.status}")
                print(f"  Created: {tx.created_at}")
                print(f"  Completed: {tx.completed_at}")
                
                # Old values
                old_signature_info = tx.meta_data.get('signature_info', {})
                print(f"  Old signature_info:")
                for k, v in old_signature_info.items():
                    print(f"    {k}: {v}")
                
                if not dry_run:
                    # Use completed_at if available, otherwise use created_at
                    timestamp = tx.completed_at if tx.completed_at else tx.created_at
                    
                    # Update the signature info
                    tx.meta_data['signature_info'] = {
                        'signed_at': timestamp.isoformat(),
                        'signed_by': 'bank_system',
                        'signature_type': 'bank_digital'
                    }
                    
                    # New values
                    print(f"  New signature_info:")
                    for k, v in tx.meta_data['signature_info'].items():
                        print(f"    {k}: {v}")
                        
                    from app import db
                    db.session.commit()
                else:
                    print("  [DRY RUN] - No changes made")
                    
                fixed_count += 1
        
        print(f"\n{fixed_count} transaction(s) would be updated." if dry_run else f"\n{fixed_count} transaction(s) updated.")
        if dry_run and fixed_count > 0:
            print("\nTo apply these changes, run with --apply parameter")

if __name__ == "__main__":
    dry_run = True
    if len(sys.argv) > 1 and sys.argv[1] == '--apply':
        dry_run = False
        print("APPLYING CHANGES TO DATABASE")
    else:
        print("DRY RUN - No changes will be made to database")
        
    fix_signature_timestamps(dry_run=dry_run)
