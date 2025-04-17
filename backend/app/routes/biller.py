from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.biller import Biller, SavedBiller
import logging
from sqlalchemy.exc import SQLAlchemyError

biller_bp = Blueprint('biller', __name__)

@biller_bp.route('', methods=['GET'])
@jwt_required()
def get_billers():
    """Get all available billers"""
    try:
        billers = Biller.query.all()
        return jsonify({
            'billers': [biller.to_dict() for biller in billers]
        }), 200
    except Exception as e:
        logging.error(f"Get billers error: {str(e)}")
        return jsonify({'message': 'Failed to retrieve billers', 'error': str(e)}), 500

@biller_bp.route('', methods=['POST'])
@jwt_required()
def add_biller():
    """Add a new biller (for demo purposes)"""
    try:
        data = request.get_json()
        new_biller = Biller(
            name=data.get('name'),
            category=data.get('category', 'Other'),
            required_fields=data.get('required_fields', ['account_number']),
            description=data.get('description', '')
        )
        
        db.session.add(new_biller)
        db.session.commit()
        
        return jsonify({
            'message': 'Biller added successfully',
            'biller': new_biller.to_dict()
        }), 201
    except Exception as e:
        logging.error(f"Add biller error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to add biller', 'error': str(e)}), 500

@biller_bp.route('/saved', methods=['GET'])
@jwt_required()
def get_saved_billers():
    """Get user's saved billers"""
    try:
        current_user_id = get_jwt_identity()
        saved_billers = SavedBiller.query.filter_by(user_id=current_user_id).all()
        
        return jsonify({
            'billers': [biller.to_dict() for biller in saved_billers]
        }), 200
    except Exception as e:
        logging.error(f"Get saved billers error: {str(e)}")
        return jsonify({'message': 'Failed to retrieve saved billers', 'error': str(e)}), 500

@biller_bp.route('/saved', methods=['POST'])
@jwt_required()
def save_biller():
    """Save a biller for future use"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Check if biller exists
        biller = Biller.query.get(data.get('biller_id'))
        if not biller:
            return jsonify({'message': 'Biller not found'}), 404
        
        # Check if already saved
        existing = SavedBiller.query.filter_by(
            user_id=current_user_id,
            biller_id=data.get('biller_id'),
            account_number=data.get('account_number')
        ).first()
        
        if existing:
            return jsonify({
                'message': 'Biller already saved',
                'biller': existing.to_dict()
            }), 200
        
        # Create new saved biller
        new_saved_biller = SavedBiller(
            user_id=current_user_id,
            biller_id=data.get('biller_id'),
            account_number=data.get('account_number'),
            nickname=data.get('nickname', ''),
            description=data.get('description', ''),
            is_favorite=data.get('is_favorite', False)
        )
        
        db.session.add(new_saved_biller)
        db.session.commit()
        
        return jsonify({
            'message': 'Biller saved successfully',
            'biller': new_saved_biller.to_dict()
        }), 201
    except Exception as e:
        logging.error(f"Save biller error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to save biller', 'error': str(e)}), 500

@biller_bp.route('/saved/<biller_id>', methods=['DELETE'])
@jwt_required()
def delete_saved_biller(biller_id):
    """Delete a saved biller"""
    try:
        current_user_id = get_jwt_identity()
        saved_biller = SavedBiller.query.filter_by(
            id=biller_id,
            user_id=current_user_id
        ).first()
        
        if not saved_biller:
            return jsonify({'message': 'Saved biller not found'}), 404
        
        db.session.delete(saved_biller)
        db.session.commit()
        
        return jsonify({
            'message': 'Biller deleted successfully'
        }), 200
    except Exception as e:
        logging.error(f"Delete saved biller error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to delete biller', 'error': str(e)}), 500

@biller_bp.route('/saved/<biller_id>/favorite', methods=['PUT'])
@jwt_required()
def toggle_favorite_biller(biller_id):
    """Toggle favorite status of a saved biller"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        saved_biller = SavedBiller.query.filter_by(
            id=biller_id,
            user_id=current_user_id
        ).first()
        
        if not saved_biller:
            return jsonify({'message': 'Saved biller not found'}), 404
        
        saved_biller.is_favorite = data.get('is_favorite', False)
        db.session.commit()
        
        return jsonify({
            'message': 'Biller favorite status updated',
            'biller': saved_biller.to_dict()
        }), 200
    except Exception as e:
        logging.error(f"Toggle favorite biller error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to update favorite status', 'error': str(e)}), 500