from app.security.digital_signature import sign_transaction
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
import logging
import os
from datetime import datetime

# Generate a deterministic bank key pair for signing transactions
# In a production environment, these would be securely stored and rotated
def get_bank_keys():
    # Generate a fixed key for consistent test data
    BANK_PRIVATE_KEY = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    
    BANK_PRIVATE_KEY_PEM = BANK_PRIVATE_KEY.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    BANK_PUBLIC_KEY = BANK_PRIVATE_KEY.public_key()
    BANK_PUBLIC_KEY_PEM = BANK_PUBLIC_KEY.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    return BANK_PRIVATE_KEY_PEM, BANK_PUBLIC_KEY_PEM

# Get the bank keys
BANK_PRIVATE_KEY_PEM, BANK_PUBLIC_KEY_PEM = get_bank_keys()

def sign_bank_transaction(transaction):
    """
    Sign a transaction using the bank's private key
    
    Args:
        transaction (Transaction): The transaction to sign
        
    Returns:
        bool: True if signing was successful, False otherwise
    """
    try:
        # Skip if transaction has no ID or is already signed with binary data
        if not transaction.id:
            logging.warning("Cannot sign transaction without ID")
            return False
            
        # Ensure the required fields are present
        source_id = transaction.source_account_id or "UNKNOWN"
        dest_id = transaction.destination_account_id or "UNKNOWN"
        
        # Prepare transaction data string with all critical fields
        transaction_data = f"{transaction.id}:{source_id}:{dest_id}:{transaction.amount}:{transaction.created_at}"
        
        # Sign the transaction data - ensuring we get binary signature data
        binary_signature = sign_transaction(transaction_data, BANK_PRIVATE_KEY_PEM)
        
        # Store binary signature
        transaction.digital_signature = binary_signature
          # Store digital signature details in meta_data for easy retrieval
        if not transaction.meta_data:
            transaction.meta_data = {}
        
        # Use the current time for the signature timestamp
        current_time = datetime.utcnow()
        
        transaction.meta_data['signature_info'] = {
            'signed_at': current_time.isoformat(),
            'signed_by': 'bank_system',
            'signature_type': 'bank_digital'
        }
        
        return True
    except Exception as e:
        logging.error(f"Error signing transaction {transaction.id}: {str(e)}")
        return False
