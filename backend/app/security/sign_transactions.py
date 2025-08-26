from app.models.transaction import Transaction

def get_transaction_signature(transaction):
    """
    Get a human-readable signature from a transaction
    Returns the string signature if available, otherwise a placeholder
    """
    if transaction.meta_data and isinstance(transaction.meta_data, dict):
        if 'string_signature' in transaction.meta_data:
            return transaction.meta_data['string_signature']
    
    return "Unsigned transaction"

def get_transaction_signature_details(transaction):
    """
    Get detailed signature information from a transaction
    Returns a dictionary with signature info
    """
    result = {
        'has_signature': False,
        'signature': None,
        'signed_by': None,
        'signed_at': None,
        'signature_type': None
    }
    
    # Check for string signature in meta_data
    if transaction.meta_data and isinstance(transaction.meta_data, dict):
        if 'string_signature' in transaction.meta_data:
            result['has_signature'] = True
            result['signature'] = transaction.meta_data['string_signature']
            result['signature_type'] = 'string'
            
            if 'signed_by' in transaction.meta_data:
                result['signed_by'] = transaction.meta_data['signed_by']
                
            if 'signed_at' in transaction.meta_data:
                result['signed_at'] = transaction.meta_data['signed_at']
    
    # Check for digital signature in the dedicated column
    elif transaction.digital_signature:
        result['has_signature'] = True
        result['signature'] = "Binary signature (BLOB)"
        result['signature_type'] = 'binary'
        
        # Try to get signer information from meta_data
        if transaction.meta_data and isinstance(transaction.meta_data, dict):
            if 'signed_by' in transaction.meta_data:
                result['signed_by'] = transaction.meta_data['signed_by']
                
            if 'signed_at' in transaction.meta_data:
                result['signed_at'] = transaction.meta_data['signed_at']
    
    return result

def generate_transaction_security_report(transactions):
    """
    Generate a security report for transactions, highlighting those without signatures
    """
    security_report = {
        "total_transactions": len(transactions),
        "signed_transactions": 0,
        "unsigned_transactions": 0,
        "unsigned_transaction_ids": [],
        "signature_types": {
            "string": 0,
            "binary": 0
        }
    }
    
    for transaction in transactions:
        # Get signature details
        signature_details = get_transaction_signature_details(transaction)
        
        if signature_details['has_signature']:
            security_report["signed_transactions"] += 1
            if signature_details['signature_type'] == 'string':
                security_report["signature_types"]["string"] += 1
            elif signature_details['signature_type'] == 'binary':
                security_report["signature_types"]["binary"] += 1
        else:
            security_report["unsigned_transactions"] += 1
            security_report["unsigned_transaction_ids"].append(transaction.id)
    
    return security_report