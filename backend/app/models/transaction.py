from app import db
from datetime import datetime
from uuid import uuid4
from sqlalchemy import LargeBinary, JSON
from app.security.encryption import encrypt_data, decrypt_data
from app.security.digital_signature import sign_transaction, verify_transaction

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    transaction_type = db.Column(db.String(20), nullable=False)
    source_account_id = db.Column(db.String(36), db.ForeignKey('accounts.id'), nullable=True)
    destination_account_id = db.Column(db.String(36), db.ForeignKey('accounts.id'), nullable=True)
    amount_encrypted = db.Column(LargeBinary, nullable=False)
    description = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(20), default='pending', nullable=False)
    digital_signature = db.Column(LargeBinary, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    reference = db.Column(db.String(50), nullable=True)
    category = db.Column(db.String(50), nullable=True)
    currency = db.Column(db.String(3), default='USD')
    meta_data = db.Column(JSON, nullable=True)
    
    @property
    def amount(self):
        return float(decrypt_data(self.amount_encrypted).decode('utf-8'))
    
    @amount.setter
    def amount(self, value):
        self.amount_encrypted = encrypt_data(str(value).encode('utf-8'))
    
    def sign(self, private_key):
        # Create signature for transaction
        transaction_data = f"{self.id}:{self.source_account_id}:{self.destination_account_id}:{self.amount}:{self.created_at}"
        self.digital_signature = sign_transaction(transaction_data, private_key)
    
    def verify(self, public_key):
        # Verify transaction signature
        transaction_data = f"{self.id}:{self.source_account_id}:{self.destination_account_id}:{self.amount}:{self.created_at}"
        return verify_transaction(transaction_data, self.digital_signature, public_key)
    
    def to_dict(self):
        return {
            'id': self.id,
            'transaction_type': self.transaction_type,
            'source_account_id': self.source_account_id,
            'destination_account_id': self.destination_account_id,
            'amount': self.amount,
            'description': self.description,
            'status': self.status,
            'reference': self.reference,
            'category': self.category,
            'currency': self.currency,
            'meta_data': self.meta_data,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }