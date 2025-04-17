from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User

def jwt_required(fn):
    """Decorator to require JWT authentication"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        return fn(*args, **kwargs)
    return wrapper

def admin_required(fn):
    """Decorator to require admin privileges"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.filter_by(id=user_id).first()
        
        if not user or not user.is_admin:
            return jsonify({"msg": "Admin privileges required"}), 403
        
        return fn(*args, **kwargs)
    return wrapper

def rate_limit(max_requests, time_window):
    """Rate limiting decorator"""
    # In a production app, you'd use Redis or another solution for rate limiting
    # This is a simplified version for demonstration
    from collections import defaultdict
    from datetime import datetime, timedelta
    
    request_counts = defaultdict(list)
    
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            client_ip = request.remote_addr
            now = datetime.now()
            
            # Clean up old requests
            request_counts[client_ip] = [timestamp for timestamp in request_counts[client_ip] 
                                       if timestamp > now - timedelta(seconds=time_window)]
            
            # Check if rate limit is exceeded
            if len(request_counts[client_ip]) >= max_requests:
                return jsonify({
                    "error": "Too many requests",
                    "message": f"Rate limit of {max_requests} requests per {time_window} seconds exceeded"
                }), 429
            
            # Add current request timestamp
            request_counts[client_ip].append(now)
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator