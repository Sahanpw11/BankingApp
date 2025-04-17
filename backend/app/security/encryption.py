from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.fernet import Fernet
import base64
import os
from flask import current_app

# Symmetric key encryption (for data at rest)
def get_encryption_key():
    try:
        key = current_app.config['SYMMETRIC_KEY']
        # Ensure the key is valid for Fernet (32 url-safe base64-encoded bytes)
        return base64.urlsafe_b64encode(key.encode()[:32].ljust(32, b' '))
    except:
        # For testing/development only - in production, this would come from a secure source
        return Fernet.generate_key()

def encrypt_data(data):
    """Encrypt data using symmetric key encryption"""
    cipher = Fernet(get_encryption_key())
    return cipher.encrypt(data)

def decrypt_data(encrypted_data):
    """Decrypt data using symmetric key encryption"""
    cipher = Fernet(get_encryption_key())
    return cipher.decrypt(encrypted_data)

# Asymmetric key encryption (for secure key exchange)
def generate_key_pair():
    """Generate public/private key pair"""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    return {
        'private_key': private_pem.decode('utf-8'),
        'public_key': public_pem.decode('utf-8')
    }

def asymmetric_encrypt(data, public_key_pem):
    """Encrypt data with a public key"""
    public_key = serialization.load_pem_public_key(
        public_key_pem.encode('utf-8'),
        backend=default_backend()
    )
    
    encrypted = public_key.encrypt(
        data.encode('utf-8'),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    
    return base64.b64encode(encrypted).decode('utf-8')

def asymmetric_decrypt(encrypted_data, private_key_pem):
    """Decrypt data with a private key"""
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode('utf-8'),
        password=None,
        backend=default_backend()
    )
    
    encrypted_bytes = base64.b64decode(encrypted_data)
    
    decrypted = private_key.decrypt(
        encrypted_bytes,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    
    return decrypted.decode('utf-8')