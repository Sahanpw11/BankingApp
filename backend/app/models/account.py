from app import db
from datetime import datetime
from uuid import uuid4
from sqlalchemy import LargeBinary
from app.security.encryption import encrypt_data, decrypt_data

class Account(db.Model):
    __tablename__ = 'accounts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    account_number = db.Column(db.String(20), unique=True, nullable=False)
    account_type = db.Column(db.String(20), nullable=False)
    balance_encrypted = db.Column(LargeBinary, nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transactions = db.relationship('Transaction', 
                                  primaryjoin="or_(Account.id==Transaction.source_account_id, "
                                             "Account.id==Transaction.destination_account_id)",
                                  lazy=True)
    
    @property
    def balance(self):
        return float(decrypt_data(self.balance_encrypted).decode('utf-8'))
    
    @balance.setter
    def balance(self, value):
        self.balance_encrypted = encrypt_data(str(value).encode('utf-8'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'account_number': self.account_number,
            'account_type': self.account_type,
            'balance': self.balance,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }