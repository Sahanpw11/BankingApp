from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.exceptions import InvalidSignature
import base64

def sign_data(private_key_pem, data):
    """Create a digital signature for the provided data"""
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode('utf-8'),
        password=None,
        backend=default_backend()
    )
    
    signature = private_key.sign(
        data.encode('utf-8'),
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    
    return base64.b64encode(signature).decode('utf-8')

def verify_signature(public_key_pem, signature, data):
    """Verify a digital signature against the provided data"""
    public_key = serialization.load_pem_public_key(
        public_key_pem.encode('utf-8'),
        backend=default_backend()
    )
    
    try:
        public_key.verify(
            base64.b64decode(signature),
            data.encode('utf-8'),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True
    except Exception:
        return False

def generate_key_pair_for_signing():
    """Generate a keypair specifically for digital signatures"""
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

def hash_data(data):
    """Create SHA-256 hash of data"""
    digest = hashes.Hash(hashes.SHA256())
    digest.update(data.encode('utf-8') if isinstance(data, str) else data)
    return digest.finalize()

def sign_transaction(transaction_data, private_key_pem):
    """Sign transaction data with private key"""
    # Load the private key
    private_key = serialization.load_pem_private_key(
        private_key_pem,
        password=None
    )
    
    # Ensure transaction_data is properly encoded
    data_to_sign = transaction_data.encode('utf-8') if isinstance(transaction_data, str) else transaction_data
    
    # Sign the data using PSS padding with SHA-256
    signature = private_key.sign(
        data_to_sign,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    
    # Return raw binary signature data
    return signature

def verify_transaction(transaction_data, signature, public_key_pem):
    """Verify transaction signature with public key"""
    # Load the public key
    public_key = serialization.load_pem_public_key(public_key_pem)
    
    try:
        # Verify the signature
        public_key.verify(
            signature,
            transaction_data.encode('utf-8') if isinstance(transaction_data, str) else transaction_data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True
    except InvalidSignature:
        return False