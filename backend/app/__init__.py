import os
import logging
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt

# Import config
from config import Config

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
bcrypt = Bcrypt()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)    # Initialize extensions with app
    
    # Configure database for PostgreSQL with optimized settings
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_size': app.config.get('SQLALCHEMY_POOL_SIZE', 10),
        'max_overflow': app.config.get('SQLALCHEMY_MAX_OVERFLOW', 20),
        'pool_timeout': app.config.get('SQLALCHEMY_POOL_TIMEOUT', 30),
        'pool_recycle': app.config.get('SQLALCHEMY_POOL_RECYCLE', 1800),
        'pool_pre_ping': True,  # Verify connections before using them
    }
    
    # Initialize the database with the app
    db.init_app(app)
    
    # Initialize other extensions
    jwt.init_app(app)
    cors.init_app(app)
    bcrypt.init_app(app)
    
    # Initialize IDS middleware
    from app.security.ids_middleware import init_ids_middleware
    init_ids_middleware(app)
    
    # Enable CORS for all routes
    CORS(app)
    
    # Set up logging
    logging.basicConfig(level=logging.INFO)
      # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.account import account_bp
    from app.routes.transaction import transaction_bp
    from app.routes.admin import admin_bp
    from app.routes.security import security_bp
    from app.routes.biller import biller_bp
    from app.routes.ids import ids_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(account_bp, url_prefix='/api/accounts')
    app.register_blueprint(transaction_bp, url_prefix='/api/transactions')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(security_bp, url_prefix='/api/security')
    app.register_blueprint(biller_bp, url_prefix='/api/billers')
    app.register_blueprint(ids_bp, url_prefix='/api/ids')
    
    # Add security headers to all responses
    @app.after_request
    def add_security_headers(response):
        for header, value in app.config['SECURITY_HEADERS'].items():
            response.headers[header] = value
        return response
    
    # Handle JWT errors
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'status': 401,
            'message': 'Token has expired'
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({
            'status': 401,
            'message': 'Invalid authentication token'
        }), 401
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app