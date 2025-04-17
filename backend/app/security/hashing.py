import hashlib
import hmac
import os

def hash_data(data, algorithm='sha256'):
    """Hash data using the specified algorithm"""
    if algorithm == 'sha256':
        return hashlib.sha256(data.encode('utf-8')).hexdigest()
    elif algorithm == 'sha512':
        return hashlib.sha512(data.encode('utf-8')).hexdigest()
    else:
        raise ValueError(f"Unsupported hashing algorithm: {algorithm}")

def verify_hash(data, hash_value, algorithm='sha256'):
    """Verify that the hash of the data matches the provided hash value"""
    return hash_data(data, algorithm) == hash_value

def generate_salt():
    """Generate a random salt for password hashing"""
    return os.urandom(32).hex()

def hash_password(password, salt=None):
    """Hash a password with a salt using PBKDF2"""
    if salt is None:
        salt = generate_salt()
    
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    
    return f"{salt}${key}"

def verify_password(stored_password, provided_password):
    """Verify a password against a stored hash"""
    salt, key = stored_password.split('$')
    return hash_password(provided_password, salt) == stored_password

def hmac_message(key, message):
    """Create an HMAC for message authentication"""
    return hmac.new(
        key.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()