from app import db
from datetime import datetime

class SecuritySettings(db.Model):
    __tablename__ = 'security_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    two_factor_enabled = db.Column(db.Boolean, default=False)
    email_notifications = db.Column(db.Boolean, default=True)
    sms_notifications = db.Column(db.Boolean, default=False)
    auto_locktime = db.Column(db.Integer, default=15)  # minutes
    security_level = db.Column(db.String(10), default='medium')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with User model
    user = db.relationship('User', backref='security_settings')
    
    def __repr__(self):
        return f'<SecuritySettings {self.id}>'