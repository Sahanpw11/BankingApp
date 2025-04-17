from app import db
from datetime import datetime
import uuid

class Biller(db.Model):
    """Biller model for bill payments"""
    __tablename__ = 'billers'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False, default='Other')
    description = db.Column(db.Text, nullable=True)
    logo_url = db.Column(db.String(255), nullable=True)
    website = db.Column(db.String(255), nullable=True)
    required_fields = db.Column(db.JSON, nullable=False, default=lambda: ['account_number'])
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    saved_billers = db.relationship('SavedBiller', backref='biller', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'logo_url': self.logo_url,
            'website': self.website,
            'required_fields': self.required_fields,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class SavedBiller(db.Model):
    """Saved biller model for users"""
    __tablename__ = 'saved_billers'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    biller_id = db.Column(db.String(36), db.ForeignKey('billers.id'), nullable=False)
    account_number = db.Column(db.String(100), nullable=False)
    nickname = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=True)
    is_favorite = db.Column(db.Boolean, default=False)
    last_payment_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'biller_id': self.biller_id,
            'account_number': self.account_number,
            'nickname': self.nickname,
            'description': self.description,
            'is_favorite': self.is_favorite,
            'last_payment_date': self.last_payment_date.isoformat() if self.last_payment_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }