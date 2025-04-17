import os
from datetime import timedelta

class Config:
    # Security settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-for-dev-only'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'your-jwt-secret-key-for-dev-only'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Database settings
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///banking.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Encryption keys
    # In production, these would be stored securely and not in the code
    SYMMETRIC_KEY = os.environ.get('SYMMETRIC_KEY') or 'your-symmetric-key-for-dev'
    
    # Security headers
    SECURITY_HEADERS = {
        'Content-Security-Policy': "default-src 'self'",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
    }
    
    # Security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SECURE = True
    REMEMBER_COOKIE_HTTPONLY = True
    
    # CORS settings
    CORS_HEADERS = 'Content-Type'