from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
import logging

admin_bp = Blueprint('admin', __name__)

# Admin middleware to check if user is an admin
def admin_required(fn):
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
            
        return fn(*args, **kwargs)
    wrapper.__name__ = fn.__name__
    return wrapper

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    """Get all users (admin only)"""
    try:
        users = User.query.all()
        return jsonify({
            'users': [user.to_dict() for user in users]
        }), 200
    except Exception as e:
        logging.error(f"Admin get users error: {str(e)}")
        return jsonify({'message': 'Failed to retrieve users', 'error': str(e)}), 500

@admin_bp.route('/accounts', methods=['GET'])
@jwt_required()
@admin_required
def get_all_accounts():
    """Get all accounts (admin only)"""
    try:
        # Query accounts with user relationship to include user details
        accounts = Account.query.join(User).all()
        
        return jsonify({
            'accounts': [account.to_dict(include_user_details=True) for account in accounts]
        }), 200
    except Exception as e:
        logging.error(f"Admin get accounts error: {str(e)}")
        return jsonify({'message': 'Failed to retrieve accounts', 'error': str(e)}), 500

@admin_bp.route('/transactions', methods=['GET'])
@jwt_required()
@admin_required
def get_all_transactions():
    """Get all transactions (admin only)"""
    try:
        transactions = Transaction.query.all()
        return jsonify({
            'transactions': [transaction.to_dict() for transaction in transactions]
        }), 200
    except Exception as e:
        logging.error(f"Admin get transactions error: {str(e)}")
        return jsonify({'message': 'Failed to retrieve transactions', 'error': str(e)}), 500

@admin_bp.route('/users/<user_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(user_id):
    """Update user details (admin only)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        data = request.get_json()
        
        # Update user fields
        if 'is_active' in data:
            user.is_active = data['is_active']
        if 'is_admin' in data:
            user.is_admin = data['is_admin']
            
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        logging.error(f"Admin update user error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to update user', 'error': str(e)}), 500

@admin_bp.route('/users/<user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user(user_id):
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    accounts = Account.query.filter_by(user_id=user.id).all()
    account_data = []
    
    for account in accounts:
        account_data.append({
            'id': account.id,
            'accountNumber': account.account_number,
            'accountType': account.account_type,
            'balance': account.balance,
            'currency': 'USD',  # Default currency since it's not stored in the model
            'isActive': account.is_active,
            'createdAt': account.created_at.isoformat()
        })
    
    # Create user data dictionary with safe attribute access
    user_data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'firstName': user.first_name,
        'lastName': user.last_name,
        'phoneNumber': getattr(user, 'phone_number', None),
        'dateOfBirth': user.date_of_birth.isoformat() if hasattr(user, 'date_of_birth') and user.date_of_birth else None,
        'isAdmin': user.is_admin,
        'isActive': user.is_active,
        'emailVerified': getattr(user, 'email_verified', False),
        'twoFactorEnabled': getattr(user, 'two_factor_enabled', False),
        'createdAt': user.created_at.isoformat(),
        'lastLogin': user.last_login.isoformat() if hasattr(user, 'last_login') and user.last_login else None,
        'accounts': account_data
    }
    
    # Only add address if it exists
    if hasattr(user, 'address'):
        user_data['address'] = user.address
    
    return jsonify(user_data), 200

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@admin_required
def get_dashboard():
    # Get system statistics
    user_count = User.query.count()
    account_count = Account.query.count()
    transaction_count = Transaction.query.count()
    
    # Calculate total balance - can't use SQL aggregation on encrypted property
    # Need to iterate and sum manually
    accounts = Account.query.all()
    total_balance = sum(account.balance for account in accounts)
    
    # Get recent transactions
    recent_transactions = Transaction.query.order_by(Transaction.created_at.desc()).limit(5).all()
    tx_data = []
    
    for tx in recent_transactions:
        tx_data.append({
            'id': tx.id,
            'type': tx.transaction_type,
            'amount': tx.amount,
            'currency': tx.currency,
            'status': tx.status,
            'createdAt': tx.created_at.isoformat()
        })
    
    # Get new users
    new_users = User.query.order_by(User.created_at.desc()).limit(5).all()
    user_data = []
    
    for user in new_users:
        user_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'createdAt': user.created_at.isoformat()
        })
    
    return jsonify({
        'statistics': {
            'userCount': user_count,
            'accountCount': account_count,
            'transactionCount': transaction_count,
            'totalBalance': total_balance
        },
        'recentTransactions': tx_data,
        'newUsers': user_data
    }), 200