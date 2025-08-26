"""
Intrusion Detection System (IDS) for Banking App
Basic IDS implementation with threat detection and monitoring
"""

import time
import json
import logging
from collections import defaultdict, deque
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Dict, List, Optional
import re
import ipaddress

# Configure logging for IDS
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - IDS - %(levelname)s - %(message)s'
)
ids_logger = logging.getLogger('banking_ids')

@dataclass
class SecurityEvent:
    """Security event data structure"""
    timestamp: datetime
    event_type: str
    severity: str  # 'low', 'medium', 'high', 'critical'
    source_ip: str
    user_id: Optional[str]
    description: str
    details: Dict

class IntrusionDetectionSystem:
    """Basic Intrusion Detection System for banking application"""
    
    def __init__(self):
        # Request tracking
        self.request_history = defaultdict(lambda: deque(maxlen=100))
        self.failed_logins = defaultdict(lambda: deque(maxlen=10))
        self.user_sessions = defaultdict(dict)
        
        # Threat patterns
        self.suspicious_patterns = [
            r'(union|select|insert|delete|drop|exec|script)',  # SQL injection
            r'(<script|javascript:|vbscript:)',  # XSS attempts
            r'(\.\.\/|\.\.\\)',  # Path traversal
            r'(eval\(|exec\()',  # Code injection
        ]
        
        # Rate limiting thresholds
        self.rate_limits = {
            'login_attempts': {'limit': 5, 'window': 300},  # 5 attempts per 5 minutes
            'api_requests': {'limit': 100, 'window': 60},   # 100 requests per minute
            'failed_auth': {'limit': 3, 'window': 180},     # 3 failures per 3 minutes
        }
        
        # Security events storage
        self.security_events = deque(maxlen=1000)
        self.blocked_ips = set()
        
        ids_logger.info("🛡️ Banking IDS initialized successfully")
    
    def analyze_request(self, request_data: Dict) -> Optional[SecurityEvent]:
        """Analyze incoming request for threats"""
        
        source_ip = request_data.get('source_ip', 'unknown')
        user_id = request_data.get('user_id')
        endpoint = request_data.get('endpoint', '')
        method = request_data.get('method', '')
        user_agent = request_data.get('user_agent', '')
        payload = str(request_data.get('payload', ''))
        
        current_time = datetime.now()
        
        # Check if IP is already blocked
        if source_ip in self.blocked_ips:
            return self._create_event(
                'blocked_ip_attempt',
                'high',
                source_ip,
                user_id,
                f"Request from blocked IP: {source_ip}",
                {'endpoint': endpoint, 'method': method}
            )
        
        # Rate limiting analysis
        rate_limit_event = self._check_rate_limits(source_ip, user_id, current_time)
        if rate_limit_event:
            return rate_limit_event
        
        # Pattern-based threat detection
        pattern_event = self._check_malicious_patterns(payload, source_ip, user_id, endpoint)
        if pattern_event:
            return pattern_event
        
        # Suspicious endpoint access
        endpoint_event = self._check_suspicious_endpoints(endpoint, source_ip, user_id)
        if endpoint_event:
            return endpoint_event
        
        # User behavior analysis
        behavior_event = self._analyze_user_behavior(user_id, source_ip, endpoint, current_time)
        if behavior_event:
            return behavior_event
        
        # Log normal request (for monitoring)
        self.request_history[source_ip].append({
            'timestamp': current_time,
            'endpoint': endpoint,
            'method': method,
            'user_id': user_id
        })
        
        return None
    
    def _check_rate_limits(self, source_ip: str, user_id: Optional[str], current_time: datetime) -> Optional[SecurityEvent]:
        """Check for rate limiting violations"""
        
        # Check API request rate
        recent_requests = [
            req for req in self.request_history[source_ip]
            if current_time - req['timestamp'] < timedelta(seconds=self.rate_limits['api_requests']['window'])
        ]
        
        if len(recent_requests) > self.rate_limits['api_requests']['limit']:
            # Temporarily block IP
            self.blocked_ips.add(source_ip)
            return self._create_event(
                'rate_limit_exceeded',
                'medium',
                source_ip,
                user_id,
                f"API rate limit exceeded: {len(recent_requests)} requests in {self.rate_limits['api_requests']['window']}s",
                {'request_count': len(recent_requests), 'limit': self.rate_limits['api_requests']['limit']}
            )
        
        return None
    
    def _check_malicious_patterns(self, payload: str, source_ip: str, user_id: Optional[str], endpoint: str) -> Optional[SecurityEvent]:
        """Check for malicious patterns in request payload"""
        
        payload_lower = payload.lower()
        
        for pattern in self.suspicious_patterns:
            if re.search(pattern, payload_lower, re.IGNORECASE):
                return self._create_event(
                    'malicious_pattern_detected',
                    'high',
                    source_ip,
                    user_id,
                    f"Malicious pattern detected: {pattern}",
                    {'endpoint': endpoint, 'pattern': pattern, 'payload_snippet': payload[:100]}
                )
        
        return None
    
    def _check_suspicious_endpoints(self, endpoint: str, source_ip: str, user_id: Optional[str]) -> Optional[SecurityEvent]:
        """Check for access to suspicious endpoints"""
        
        admin_endpoints = ['/api/admin', '/admin', '/api/users', '/api/system']
        sensitive_endpoints = ['/api/accounts', '/api/transactions', '/api/security']
        
        # Unauthorized admin access attempts
        if any(admin_ep in endpoint for admin_ep in admin_endpoints) and not user_id:
            return self._create_event(
                'unauthorized_admin_access',
                'high',
                source_ip,
                user_id,
                f"Unauthorized access attempt to admin endpoint: {endpoint}",
                {'endpoint': endpoint}
            )
        
        return None
    
    def _analyze_user_behavior(self, user_id: Optional[str], source_ip: str, endpoint: str, current_time: datetime) -> Optional[SecurityEvent]:
        """Analyze user behavior for anomalies"""
        
        if not user_id:
            return None
        
        # Check for multiple IPs for same user (session hijacking)
        if user_id in self.user_sessions:
            last_ip = self.user_sessions[user_id].get('last_ip')
            if last_ip and last_ip != source_ip:
                # Check if IPs are from different regions (simplified)
                if not self._are_ips_similar(last_ip, source_ip):
                    return self._create_event(
                        'suspicious_ip_change',
                        'medium',
                        source_ip,
                        user_id,
                        f"User {user_id} accessing from different IP: {last_ip} -> {source_ip}",
                        {'previous_ip': last_ip, 'new_ip': source_ip}
                    )
        
        # Update user session
        self.user_sessions[user_id] = {
            'last_ip': source_ip,
            'last_access': current_time,
            'last_endpoint': endpoint
        }
        
        return None
    
    def _are_ips_similar(self, ip1: str, ip2: str) -> bool:
        """Check if two IPs are from similar networks (simplified)"""
        try:
            addr1 = ipaddress.IPv4Address(ip1)
            addr2 = ipaddress.IPv4Address(ip2)
            # Consider IPs similar if they're in the same /24 network
            return addr1.packed[:3] == addr2.packed[:3]
        except:
            return False
    
    def record_failed_login(self, source_ip: str, user_id: Optional[str], reason: str):
        """Record failed login attempt"""
        
        current_time = datetime.now()
        self.failed_logins[source_ip].append({
            'timestamp': current_time,
            'user_id': user_id,
            'reason': reason
        })
        
        # Check for brute force attempts
        recent_failures = [
            failure for failure in self.failed_logins[source_ip]
            if current_time - failure['timestamp'] < timedelta(seconds=self.rate_limits['failed_auth']['window'])
        ]
        
        if len(recent_failures) >= self.rate_limits['failed_auth']['limit']:
            event = self._create_event(
                'brute_force_attempt',
                'critical',
                source_ip,
                user_id,
                f"Brute force login attempt detected: {len(recent_failures)} failures",
                {'failure_count': len(recent_failures), 'recent_failures': recent_failures[-3:]}
            )
            
            # Block IP for brute force
            self.blocked_ips.add(source_ip)
            self._log_security_event(event)
    
    def record_successful_login(self, source_ip: str, user_id: str):
        """Record successful login"""
        
        # Clear failed attempts for this IP
        if source_ip in self.failed_logins:
            self.failed_logins[source_ip].clear()
        
        # Update user session
        self.user_sessions[user_id] = {
            'last_ip': source_ip,
            'last_access': datetime.now(),
            'login_time': datetime.now()
        }
    
    def _create_event(self, event_type: str, severity: str, source_ip: str, user_id: Optional[str], description: str, details: Dict) -> SecurityEvent:
        """Create a security event"""
        
        event = SecurityEvent(
            timestamp=datetime.now(),
            event_type=event_type,
            severity=severity,
            source_ip=source_ip,
            user_id=user_id,
            description=description,
            details=details
        )
        
        self._log_security_event(event)
        return event
    
    def _log_security_event(self, event: SecurityEvent):
        """Log security event"""
        
        self.security_events.append(event)
        
        # Log with appropriate level
        log_level = {
            'low': logging.INFO,
            'medium': logging.WARNING,
            'high': logging.ERROR,
            'critical': logging.CRITICAL
        }.get(event.severity, logging.INFO)
        
        ids_logger.log(
            log_level,
            f"🚨 {event.event_type.upper()}: {event.description} | IP: {event.source_ip} | User: {event.user_id}"
        )
    
    def get_security_status(self) -> Dict:
        """Get current security status"""
        
        current_time = datetime.now()
        recent_events = [
            event for event in self.security_events
            if current_time - event.timestamp < timedelta(hours=24)
        ]
        
        # Count events by severity
        severity_counts = defaultdict(int)
        for event in recent_events:
            severity_counts[event.severity] += 1
        
        return {
            'total_events_24h': len(recent_events),
            'severity_breakdown': dict(severity_counts),
            'blocked_ips': list(self.blocked_ips),
            'active_sessions': len(self.user_sessions),
            'status': 'SECURE' if severity_counts['critical'] == 0 else 'ALERT'
        }
    
    def get_recent_events(self, limit: int = 10) -> List[Dict]:
        """Get recent security events"""
        
        recent = list(self.security_events)[-limit:]
        return [
            {
                'timestamp': event.timestamp.isoformat(),
                'type': event.event_type,
                'severity': event.severity,
                'source_ip': event.source_ip,
                'user_id': event.user_id,
                'description': event.description,
                'details': event.details
            }
            for event in recent
        ]
    
    def unblock_ip(self, ip_address: str) -> bool:
        """Manually unblock an IP address"""
        
        if ip_address in self.blocked_ips:
            self.blocked_ips.remove(ip_address)
            ids_logger.info(f"✅ IP {ip_address} has been unblocked")
            return True
        return False

# Global IDS instance
banking_ids = IntrusionDetectionSystem()
