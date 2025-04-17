from datetime import datetime
from app import db
import uuid

class Payee(db.Model):
    __tablename__ = 'payees'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    account_number = db.Column(db.String(20), nullable=False)
    bank_name = db.Column(db.String(100), nullable=True)
    routing_number = db.Column(db.String(20), nullable=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)  # Changed 'user' to 'users'
    
    # Additional columns
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(200), nullable=True)
    memo = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('payees', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'account_number': self.account_number,
            'bank_name': self.bank_name,
            'routing_number': self.routing_number,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'memo': self.memo,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }