from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.payee import Payee
from app.models.biller import Biller, SavedBiller
from app.security.digital_signature import hash_data
from datetime import datetime
import logging

transaction_bp = Blueprint('transaction', __name__)

@transaction_bp.route('/account/<account_id>', methods=['GET'])
@jwt_required()
def get_account_transactions(account_id):
    """Get transactions for a specific account"""
    try:
        current_user_id = get_jwt_identity()
        account = Account.query.get(account_id)
        
        if not account:
            return jsonify({'message': 'Account not found'}), 404
            
        # Security check - ensure the account belongs to the current user
        if account.user_id != current_user_id:
            return jsonify({'message': 'Access denied'}), 403
        
        # Get all transactions for this account (as source or destination)
        transactions = Transaction.query.filter(
            (Transaction.source_account_id == account_id) | 
            (Transaction.destination_account_id == account_id)
        ).all()
        
        return jsonify({
            'transactions': [transaction.to_dict() for transaction in transactions]
        }), 200
    except Exception as e:
        logging.error(f"Get transactions error: {str(e)}")
        return jsonify({'message': 'Failed to retrieve transactions', 'error': str(e)}), 500

@transaction_bp.route('/transfer', methods=['POST'])
@jwt_required()
def transfer_money():
    """Transfer money between accounts"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Get source account
        source_account = Account.query.get(data['source_account_id'])
        if not source_account:
            return jsonify({'message': 'Source account not found'}), 404
            
        # Security check - ensure the source account belongs to the current user
        if source_account.user_id != current_user_id:
            return jsonify({'message': 'Access denied'}), 403
        
        # Get destination account
        destination_account = Account.query.get(data['destination_account_id'])
        if not destination_account:
            return jsonify({'message': 'Destination account not found'}), 404
        
        # Check sufficient balance
        amount = float(data['amount'])
        if source_account.balance < amount:
            return jsonify({'message': 'Insufficient funds'}), 400
        
        # Create transaction
        transaction = Transaction(
            transaction_type='transfer',
            source_account_id=source_account.id,
            destination_account_id=destination_account.id,
            description=data.get('description', 'Funds transfer')
        )
        transaction.amount = amount  # This uses the property to encrypt the amount
        
        # Update account balances
        source_account.balance -= amount
        destination_account.balance += amount
        
        transaction.status = 'completed'
        transaction.completed_at = datetime.utcnow()
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Transfer completed successfully',
            'transaction': transaction.to_dict()
        }), 200
    except Exception as e:
        logging.error(f"Transfer error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Transfer failed', 'error': str(e)}), 500

@transaction_bp.route('/payment', methods=['POST'])
@jwt_required()
def create_bill_payment():
    """Create a new bill payment transaction"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        data = request.get_json()
        logging.info(f"Creating payment with data: {data}")
        
        # Get source account
        source_account = Account.query.filter_by(
            id=data.get('source_account_id'),
            user_id=current_user_id
        ).first()
        
        if not source_account:
            return jsonify({'message': 'Source account not found or not authorized'}), 404
            
        # Verify biller exists
        biller = Biller.query.get(data.get('biller_id'))
        if not biller:
            return jsonify({'message': 'Biller not found'}), 404
        
        # Check sufficient funds
        amount = float(data.get('amount', 0))
        if amount <= 0:
            return jsonify({'message': 'Invalid amount'}), 400
            
        if source_account.balance < amount:
            return jsonify({'message': 'Insufficient funds'}), 400
        
        # Determine if this is an immediate or future payment
        payment_date_str = data.get('payment_date')
        payment_date = None
        if payment_date_str:
            payment_date_str = payment_date_str.replace('Z', '+00:00')
            payment_date = datetime.fromisoformat(payment_date_str)
        else:
            payment_date = datetime.utcnow()
        
        # Is this payment due now or in the future?
        is_immediate = payment_date.date() <= datetime.utcnow().date()
        
        # Create the transaction
        transaction = Transaction(
            transaction_type='payment',
            source_account_id=source_account.id,
            description=data.get('description', f"Payment to {biller.name}"),
            status='completed' if is_immediate else 'scheduled',
            reference=data.get('reference_number')
        )
        transaction.amount = amount  # This uses the property to encrypt the amount
        
        # For immediate payments, update the account balance
        if is_immediate:
            source_account.balance -= amount
            transaction.completed_at = datetime.utcnow()
        
        # Store metadata about the transaction
        transaction.meta_data = {
            'biller_id': biller.id,
            'biller_name': biller.name,
            'biller_account_number': data.get('biller_account_number'),
            'is_recurring': data.get('is_recurring', False),
            'frequency': data.get('frequency'),
            'end_date': data.get('end_date'),
            'payment_date': payment_date.isoformat()
        }
        
        db.session.add(transaction)
        
        # Update saved biller's last payment date if using a saved biller
        if data.get('saved_biller_id'):
            saved_biller = SavedBiller.query.get(data.get('saved_biller_id'))
            if saved_biller and saved_biller.user_id == current_user_id:
                saved_biller.last_payment_date = datetime.utcnow()
        
        # If this is a recurring payment, we would normally create a schedule here
        # But for now, we'll just store the info in the transaction metadata
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payment successful',
            'transaction': transaction.to_dict()
        }), 201
    except Exception as e:
        logging.error(f"Payment error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Payment failed', 'error': str(e)}), 500

@transaction_bp.route('/payees', methods=['GET'])
@jwt_required()
def get_payees():
    current_user_id = get_jwt_identity()
    
    payees = Payee.query.filter_by(user_id=current_user_id, is_active=True).all()
    
    results = []
    for payee in payees:
        results.append({
            'id': payee.id,
            'name': payee.name,
            'accountNumber': payee.account_number,
            'bankName': payee.bank_name,
            'payeeType': payee.payee_type,
            'createdAt': payee.created_at.isoformat()
        })
    
    return jsonify({'payees': results}), 200

@transaction_bp.route('/payees', methods=['POST'])
@jwt_required()
def add_payee():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    payee = Payee(
        name=data['name'],
        account_number=data['accountNumber'],
        bank_name=data.get('bankName'),
        payee_type=data['payeeType'],
        user_id=current_user_id
    )
    
    db.session.add(payee)
    db.session.commit()
    
    return jsonify({
        'message': 'Payee added successfully',
        'payee': {
            'id': payee.id,
            'name': payee.name,
            'accountNumber': payee.account_number,
            'bankName': payee.bank_name,
            'payeeType': payee.payee_type,
            'createdAt': payee.created_at.isoformat()
        }
    }), 201

@transaction_bp.route('/<transaction_id>', methods=['GET'])
@jwt_required()
def get_transaction(transaction_id):
    current_user_id = get_jwt_identity()
    
    # Find transaction
    transaction = Transaction.query.filter_by(id=transaction_id).first()
    
    if not transaction:
        return jsonify({'message': 'Transaction not found'}), 404
    
    # Check if user owns the source or destination account
    source_account = None
    if transaction.source_account_id:
        source_account = Account.query.filter_by(id=transaction.source_account_id).first()
    
    destination_account = None
    if transaction.destination_account_id:
        destination_account = Account.query.filter_by(id=transaction.destination_account_id).first()
    
    # Verify user has permission to view this transaction
    has_permission = False
    if source_account and source_account.user_id == current_user_id:
        has_permission = True
    elif destination_account and destination_account.user_id == current_user_id:
        has_permission = True
    
    if not has_permission:
        return jsonify({'message': 'Unauthorized to view this transaction'}), 403
    
    # Build response
    result = transaction.to_dict()
    
    # Add additional account information if needed
    if source_account:
        result['source'] = {
            'accountId': source_account.id,
            'accountNumber': source_account.account_number,
            'accountType': source_account.account_type
        }
    
    if destination_account:
        result['destination'] = {
            'accountId': destination_account.id,
            'accountNumber': destination_account.account_number,
            'accountType': destination_account.account_type
        }
    
    return jsonify(result), 200

@transaction_bp.route('', methods=['GET'])
@jwt_required()
def get_transactions():
    """Get all transactions for the current user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        limit = request.args.get('limit', default=20, type=int)
        
        # Find all accounts owned by the user
        accounts = Account.query.filter_by(user_id=current_user_id).all()
        account_ids = [account.id for account in accounts]
        
        if not account_ids:
            return jsonify({'transactions': []}), 200
        
        # Find all transactions related to any of the user's accounts
        transactions = Transaction.query.filter(
            (Transaction.source_account_id.in_(account_ids)) | 
            (Transaction.destination_account_id.in_(account_ids))
        ).order_by(Transaction.created_at.desc()).limit(limit).all()
        
        return jsonify({
            'transactions': [transaction.to_dict() for transaction in transactions]
        }), 200
    except Exception as e:
        logging.error(f"Get transactions error: {str(e)}")
        return jsonify({'message': 'Failed to retrieve transactions', 'error': str(e)}), 500