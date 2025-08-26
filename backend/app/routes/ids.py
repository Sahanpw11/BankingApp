"""
IDS API Routes for Security Monitoring
Provides endpoints for viewing IDS data and managing security
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..security.ids import banking_ids
from ..security.middleware import admin_required

ids_bp = Blueprint('ids', __name__)

@ids_bp.route('/security/status', methods=['GET'])
@jwt_required()
@admin_required
def get_security_status():
    """Get current security system status"""
    try:
        status = banking_ids.get_security_status()
        return jsonify({
            'status': 'success',
            'data': status
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to get security status: {str(e)}'
        }), 500

@ids_bp.route('/security/events', methods=['GET'])
@jwt_required()
@admin_required
def get_security_events():
    """Get recent security events"""
    try:
        limit = request.args.get('limit', 20, type=int)
        events = banking_ids.get_recent_events(limit)
        
        return jsonify({
            'status': 'success',
            'data': {
                'events': events,
                'total': len(events)
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to get security events: {str(e)}'
        }), 500

@ids_bp.route('/security/blocked-ips', methods=['GET'])
@jwt_required()
@admin_required
def get_blocked_ips():
    """Get list of blocked IP addresses"""
    try:
        return jsonify({
            'status': 'success',
            'data': {
                'blocked_ips': list(banking_ids.blocked_ips)
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to get blocked IPs: {str(e)}'
        }), 500

@ids_bp.route('/security/unblock-ip', methods=['POST'])
@jwt_required()
@admin_required
def unblock_ip():
    """Unblock an IP address"""
    try:
        data = request.get_json()
        ip_address = data.get('ip_address')
        
        if not ip_address:
            return jsonify({
                'status': 'error',
                'message': 'IP address is required'
            }), 400
        
        success = banking_ids.unblock_ip(ip_address)
        
        if success:
            return jsonify({
                'status': 'success',
                'message': f'IP {ip_address} has been unblocked'
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': f'IP {ip_address} was not blocked'
            }), 400
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to unblock IP: {str(e)}'
        }), 500

@ids_bp.route('/security/dashboard', methods=['GET'])
@jwt_required()
@admin_required
def get_security_dashboard():
    """Get comprehensive security dashboard data"""
    try:
        status = banking_ids.get_security_status()
        recent_events = banking_ids.get_recent_events(10)
        
        # Calculate additional metrics
        event_types = {}
        for event in recent_events:
            event_type = event['type']
            event_types[event_type] = event_types.get(event_type, 0) + 1
        
        dashboard_data = {
            'overview': status,
            'recent_events': recent_events,
            'event_distribution': event_types,
            'threat_level': 'LOW' if status['status'] == 'SECURE' else 'HIGH',
            'recommendations': [
                'Monitor failed login attempts',
                'Review blocked IP addresses',
                'Check for unusual access patterns',
                'Update security policies regularly'
            ]
        }
        
        return jsonify({
            'status': 'success',
            'data': dashboard_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to get security dashboard: {str(e)}'
        }), 500
