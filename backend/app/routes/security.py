from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import pyotp
import qrcode
import io
import base64
from app import db, bcrypt
from app.models.user import User
from app.models.security_settings import SecuritySettings
import logging

security_bp = Blueprint('security', __name__)

@security_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_security_settings():
    """Get user's security settings"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        settings = SecuritySettings.query.filter_by(user_id=current_user_id).first()
        
        if not settings:
            # Create default settings if none exist
            settings = SecuritySettings(user_id=current_user_id)
            db.session.add(settings)
            db.session.commit()
            
        return jsonify({
            'twoFactorEnabled': settings.two_factor_enabled,
            'emailNotifications': settings.email_notifications,
            'smsNotifications': settings.sms_notifications,
            'autoLocktime': settings.auto_locktime,
            'securityLevel': settings.security_level,
            'lastPasswordChange': user.password_updated_at.isoformat() if user.password_updated_at else None
        }), 200
    except Exception as e:
        logging.error(f"Get security settings error: {str(e)}")
        return jsonify({'message': 'Failed to get security settings', 'error': str(e)}), 500

@security_bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_security_settings():
    """Update user's security settings"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        settings = SecuritySettings.query.filter_by(user_id=current_user_id).first()
        
        if not settings:
            settings = SecuritySettings(user_id=current_user_id)
            db.session.add(settings)
        
        # Update settings
        if 'emailNotifications' in data:
            settings.email_notifications = data['emailNotifications']
        if 'smsNotifications' in data:
            settings.sms_notifications = data['smsNotifications']
        if 'autoLocktime' in data:
            settings.auto_locktime = data['autoLocktime']
        if 'securityLevel' in data:
            settings.security_level = data['securityLevel']
            
        db.session.commit()
        
        return jsonify({
            'message': 'Security settings updated successfully'
        }), 200
    except Exception as e:
        logging.error(f"Update security settings error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to update security settings', 'error': str(e)}), 500

@security_bp.route('/two-factor/enable', methods=['POST'])
@jwt_required()
def enable_two_factor():
    """Enable two-factor authentication"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        # Generate a secret key for TOTP
        secret = pyotp.random_base32()
        
        # Store the secret temporarily (in a real app, this would be securely stored)
        # In production, this would be stored encrypted
        user.two_factor_temp_secret = secret
        db.session.commit()
        
        # Generate a QR code for the user to scan with Google Authenticator
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name="SecureBank"
        )
        
        # Convert QR code to base64 string
        qr = qrcode.make(totp_uri)
        buffer = io.BytesIO()
        qr.save(buffer)
        buffer.seek(0)
        qr_base64 = base64.b64encode(buffer.getvalue()).decode('ascii')
        
        return jsonify({
            'message': 'Two-factor authentication setup initiated',
            'qrCode': f"data:image/png;base64,{qr_base64}",
            'secret': secret  # In a real app, we might not send this back
        }), 200
    except Exception as e:
        logging.error(f"Enable two-factor error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to setup two-factor authentication', 'error': str(e)}), 500

@security_bp.route('/two-factor/verify', methods=['POST'])
@jwt_required()
def verify_two_factor():
    """Verify two-factor authentication code"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        data = request.get_json()
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        if not user.two_factor_temp_secret:
            return jsonify({'message': 'Two-factor setup not initiated'}), 400
            
        # Verify the code
        totp = pyotp.TOTP(user.two_factor_temp_secret)
        if not totp.verify(data['code']):
            return jsonify({'message': 'Invalid verification code'}), 400
            
        # Setup successful, update user settings
        settings = SecuritySettings.query.filter_by(user_id=current_user_id).first()
        if not settings:
            settings = SecuritySettings(user_id=current_user_id)
            db.session.add(settings)
            
        settings.two_factor_enabled = True
        user.two_factor_secret = user.two_factor_temp_secret
        user.two_factor_temp_secret = None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Two-factor authentication enabled successfully'
        }), 200
    except Exception as e:
        logging.error(f"Verify two-factor error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to verify two-factor code', 'error': str(e)}), 500

@security_bp.route('/two-factor/disable', methods=['POST'])
@jwt_required()
def disable_two_factor():
    """Disable two-factor authentication"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        settings = SecuritySettings.query.filter_by(user_id=current_user_id).first()
        if settings:
            settings.two_factor_enabled = False
            
        user.two_factor_secret = None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Two-factor authentication disabled successfully'
        }), 200
    except Exception as e:
        logging.error(f"Disable two-factor error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to disable two-factor authentication', 'error': str(e)}), 500

@security_bp.route('/password/update', methods=['POST'])
@jwt_required()
def update_password():
    """Update user's password"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        data = request.get_json()
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        # Verify current password
        if not bcrypt.check_password_hash(user.password_hash, data['currentPassword']):
            return jsonify({'message': 'Current password is incorrect'}), 400
            
        # Update password
        user.password = data['newPassword']  # This will use the setter to hash the password
        user.password_updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Password updated successfully'
        }), 200
    except Exception as e:
        logging.error(f"Update password error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to update password', 'error': str(e)}), 500