"""
IDS Middleware for Flask Application
Integrates the Intrusion Detection System with Flask requests
"""

from flask import request, jsonify, g
from functools import wraps
import time
from .ids import banking_ids

def ids_monitor():
    """Decorator to monitor requests with IDS"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get request data
            request_data = {
                'source_ip': request.remote_addr or 'unknown',
                'user_id': getattr(g, 'current_user_id', None),
                'endpoint': request.endpoint or request.path,
                'method': request.method,
                'user_agent': request.headers.get('User-Agent', ''),
                'payload': request.get_data(as_text=True) if request.method in ['POST', 'PUT', 'PATCH'] else ''
            }
            
            # Analyze request for threats
            security_event = banking_ids.analyze_request(request_data)
            
            if security_event:
                # Block request if it's a security threat
                if security_event.severity in ['high', 'critical']:
                    return jsonify({
                        'error': 'Request blocked by security system',
                        'message': 'Your request has been identified as potentially malicious',
                        'incident_id': f"IDS-{int(time.time())}"
                    }), 403
                
                # Log but allow medium/low severity events
                elif security_event.severity in ['medium', 'low']:
                    # Continue with request but log the event
                    pass
            
            # Execute the original function
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def log_failed_login(source_ip: str, user_id: str = None, reason: str = "Invalid credentials"):
    """Log failed login attempt to IDS"""
    banking_ids.record_failed_login(source_ip, user_id, reason)

def log_successful_login(source_ip: str, user_id: str):
    """Log successful login to IDS"""
    banking_ids.record_successful_login(source_ip, user_id)

def init_ids_middleware(app):
    """Initialize IDS middleware with Flask app"""
    
    @app.before_request
    def ids_before_request():
        """Monitor all incoming requests for security threats"""
        # Skip IDS monitoring for static files and health checks
        if request.endpoint and (
            request.endpoint.startswith('static') or 
            request.path.startswith('/health') or
            request.path.startswith('/favicon')
        ):
            return
            
        # Get request data
        request_data = {
            'source_ip': request.remote_addr or 'unknown',
            'user_id': getattr(g, 'current_user_id', None),
            'endpoint': request.endpoint or request.path,
            'method': request.method,
            'user_agent': request.headers.get('User-Agent', ''),
            'payload': request.get_data(as_text=True) if request.method in ['POST', 'PUT', 'PATCH'] else ''
        }
        
        # Analyze request for threats
        security_event = banking_ids.analyze_request(request_data)
        
        if security_event:
            # Block request if it's a security threat
            if security_event.severity in ['high', 'critical']:
                return jsonify({
                    'error': 'Request blocked by security system',
                    'message': 'Your request has been identified as potentially malicious',
                    'incident_id': f"IDS-{int(time.time())}"
                }), 403
    
    # Add IDS status endpoint
    @app.route('/api/ids/status')
    def ids_status():
        """Get IDS system status"""
        return jsonify({
            'status': 'active',
            'total_events': len(banking_ids.security_events),
            'blocked_ips': len(banking_ids.blocked_ips),
            'uptime': time.time() - banking_ids.start_time
        })
    
    print("🛡️ IDS Middleware initialized successfully")
