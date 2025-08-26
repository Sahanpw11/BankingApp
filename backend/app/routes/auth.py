from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, decode_token
)
from app import db, bcrypt
from app.models.user import User
from app.models.security_settings import SecuritySettings
from datetime import datetime
import logging

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Check if user exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already registered'}), 409
            
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already taken'}), 409
        
        # Create new user
        new_user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone_number=data.get('phone_number')
        )
        new_user.password = data['password']  # This uses the password setter
        
        db.session.add(new_user)
        db.session.flush()  # Get the user ID without committing yet
        
        # Create default security settings for the user
        security_settings = SecuritySettings(
            user_id=new_user.id,
            two_factor_enabled=False,
            email_notifications=True,
            sms_notifications=False,
            auto_locktime=15,
            security_level='medium'
        )
        db.session.add(security_settings)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': new_user.id
        }), 201
    except Exception as e:
        logging.error(f"Registration error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login a user"""
    try:
        data = request.get_json()
        logging.info(f"Login attempt data: {data}")
        
        # Clean input data
        email = data.get('email', '').strip() if data.get('email') else None
        username = data.get('username', '').strip() if data.get('username') else None
        password = data.get('password', '')
        
        if not email and not username:
            logging.error("No email or username provided")
            return jsonify({'message': 'Email or username is required'}), 400
            
        if not password:
            logging.error("No password provided")
            return jsonify({'message': 'Password is required'}), 400
        
        # Try to find user by email
        user = None
        if email:
            user = User.query.filter_by(email=email).first()
            logging.info(f"Found user by email: {user is not None}")
        
        # If not found by email, try username
        if not user and username:
            user = User.query.filter_by(username=username).first()
            logging.info(f"Found user by username: {user is not None}")
        
        if not user:
            logging.error(f"User not found with email: {email} or username: {username}")
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Log password verification attempt
        password_match = user.check_password(password)
        logging.info(f"Password verification result: {password_match}")
        
        if not password_match:
            logging.error(f"Invalid password for user: {user.username}")
            return jsonify({'message': 'Invalid credentials'}), 401
          # Update last login time with retry mechanism
        user.last_login = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        
        # Retry database commit if it fails due to locking
        retry_count = 0
        max_retries = 3
        success = False
        
        while retry_count < max_retries and not success:
            try:
                db.session.commit()
                success = True
            except Exception as e:
                # Log the error
                logging.error(f"Login error: {str(e)}")
                # Roll back the session
                db.session.rollback()
                # Increment retry counter
                retry_count += 1
                # If we've reached max retries, continue without throwing error
                if retry_count >= max_retries:
                    logging.warning("Max retries reached for updating last login time")
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        logging.info(f"Login successful for user: {user.username}")
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_admin
            }
        }), 200
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)
    
    return jsonify({
        'access_token': access_token,
        'token': access_token  # Add token key for frontend compatibility
    }), 200

# Add new endpoint for refresh-token that accepts refresh token in request body
@auth_bp.route('/refresh-token', methods=['POST'])
def refresh_token():
    """Refresh access token using refresh token from request body"""
    try:
        data = request.get_json()
        refresh_token = data.get('refreshToken')
        
        if not refresh_token:
            return jsonify({'message': 'Refresh token is required'}), 400
            
        # Decode the refresh token to get the user ID
        try:
            decoded_token = decode_token(refresh_token)
            user_id = decoded_token['sub']  # 'sub' contains the identity (user_id)
            
            # Create new access token
            access_token = create_access_token(identity=user_id)
            new_refresh_token = create_refresh_token(identity=user_id)
            
            return jsonify({
                'token': access_token,  # For frontend compatibility
                'access_token': access_token,
                'refresh_token': new_refresh_token,
                'refreshToken': new_refresh_token  # For frontend compatibility
            }), 200
        except Exception as e:
            logging.error(f"Token decode error: {str(e)}")
            return jsonify({'message': 'Invalid refresh token'}), 401
            
    except Exception as e:
        logging.error(f"Refresh token error: {str(e)}")
        return jsonify({'message': 'Refresh failed', 'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(id=current_user_id).first()
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    data = request.get_json()
    
    # Only allow updating certain fields
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'phone' in data:
        user.phone_number = data['phone']
    if 'address' in data:
        user.address = data['address']
    if 'date_of_birth' in data and data['date_of_birth']:
        try:
            from datetime import datetime, date
            # Handle different date formats
            if 'T' in data['date_of_birth']:
                # ISO format
                user.date_of_birth = datetime.fromisoformat(
                    data['date_of_birth'].replace('Z', '+00:00')
                ).date()
            else:
                # YYYY-MM-DD format
                user.date_of_birth = date.fromisoformat(data['date_of_birth'])
        except ValueError:
            return jsonify({'message': 'Invalid date format'}), 400
    if 'occupation' in data:
        user.occupation = data['occupation']
    if 'security_question' in data:
        user.security_question = data['security_question']
    if 'security_answer' in data:
        user.security_answer = data['security_answer']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(id=current_user_id).first()
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    data = request.get_json()
    
    # Check if the required fields are present
    if 'current_password' not in data or 'new_password' not in data:
        return jsonify({'message': 'Missing required fields'}), 400
    
    if not user.check_password(data['current_password']):
        return jsonify({'message': 'Current password is incorrect'}), 401
    
    # Update password using the password setter property
    user.password = data['new_password']
    user.password_updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'}), 200