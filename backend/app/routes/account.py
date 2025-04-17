from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.account import Account
import random
import string
import logging

account_bp = Blueprint('account', __name__)

def generate_account_number():
    """Generate a unique account number"""
    while True:
        # Generate random 10-digit number
        account_number = ''.join(random.choices(string.digits, k=10))
        
        # Check if it's unique
        if not Account.query.filter_by(account_number=account_number).first():
            return account_number

@account_bp.route('', methods=['GET'])
@account_bp.route('/', methods=['GET'])
@jwt_required()
def get_accounts():
    """Get all accounts for the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        accounts = Account.query.filter_by(user_id=current_user_id).all()
        return jsonify({
            'accounts': [account.to_dict() for account in accounts]
        }), 200
    except Exception as e:
        logging.error(f"Get accounts error: {str(e)}")
        return jsonify({'message': 'Failed to retrieve accounts', 'error': str(e)}), 500

@account_bp.route('/<account_id>', methods=['GET'])
@jwt_required()
def get_account_details(account_id):
    """Get details for a specific account"""
    try:
        current_user_id = get_jwt_identity()
        account = Account.query.get(account_id)
        
        if not account:
            return jsonify({'message': 'Account not found'}), 404
            
        # Security check - ensure the account belongs to the current user
        if account.user_id != current_user_id:
            return jsonify({'message': 'Access denied'}), 403
            
        return jsonify(account.to_dict()), 200
    except Exception as e:
        logging.error(f"Get account details error: {str(e)}")
        return jsonify({'message': 'Failed to retrieve account details', 'error': str(e)}), 500

@account_bp.route('/', methods=['POST'])
@jwt_required()
def create_account():
    """Create a new account"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Create new account
        new_account = Account(
            account_number=generate_account_number(),
            account_type=data['account_type'],
            user_id=current_user_id
        )
        
        # Set initial balance (encrypted)
        new_account.balance = data.get('initial_deposit', 0)
        
        db.session.add(new_account)
        db.session.commit()
        
        return jsonify({
            'message': 'Account created successfully',
            'account': new_account.to_dict()
        }), 201
    except Exception as e:
        logging.error(f"Create account error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to create account', 'error': str(e)}), 500

@account_bp.route('/<account_id>/transactions', methods=['GET'])
@jwt_required()
def get_account_transactions(account_id):
    current_user_id = get_jwt_identity()
    
    account = Account.query.filter_by(id=account_id, user_id=current_user_id).first()
    
    if not account:
        return jsonify({'message': 'Account not found or unauthorized'}), 404
    
    # Combine incoming and outgoing transactions
    all_transactions = []
    
    for tx in account.outgoing_transactions:
        all_transactions.append({
            'id': tx.id,
            'type': tx.transaction_type,
            'amount': tx.amount,
            'currency': tx.currency,
            'description': tx.description,
            'status': tx.status,
            'referenceNumber': tx.reference_number,
            'direction': 'outgoing',
            'createdAt': tx.created_at.isoformat()
        })
    
    for tx in account.incoming_transactions:
        all_transactions.append({
            'id': tx.id,
            'type': tx.transaction_type,
            'amount': tx.amount,
            'currency': tx.currency,
            'description': tx.description,
            'status': tx.status,
            'referenceNumber': tx.reference_number,
            'direction': 'incoming',
            'createdAt': tx.created_at.isoformat()
        })
    
    # Sort by date (newest first)
    all_transactions.sort(key=lambda x: x['createdAt'], reverse=True)
    
    return jsonify({'transactions': all_transactions}), 200