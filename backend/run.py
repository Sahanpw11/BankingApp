from app import create_app
import os
import ssl
import threading
from flask import Flask, redirect, request

app = create_app()

def create_redirect_app():
    """Create a simple app that redirects HTTP to HTTPS"""
    redirect_app = Flask(__name__)
    
    @redirect_app.route('/', defaults={'path': ''})
    @redirect_app.route('/<path:path>')
    def redirect_to_https(path):
        return redirect(f'https://localhost:5443/{path}', code=301)
    
    return redirect_app

if __name__ == '__main__':
    # Check if SSL certificates exist
    cert_dir = os.path.join(os.path.dirname(__file__), 'certificates')
    cert_file = os.path.join(cert_dir, 'server.crt')
    key_file = os.path.join(cert_dir, 'server.key')
    
    if os.path.exists(cert_file) and os.path.exists(key_file):
        # Run with HTTPS
        print("🔒 Starting Banking App with HTTPS enabled")
        print("🌐 HTTPS URL: https://localhost:5443")
        print("🌐 HTTP URL: http://localhost:5000 (redirects to HTTPS)")
        print("⚠️  Browser may show security warning - click 'Advanced' -> 'Proceed to localhost'")
        
        # Start HTTP redirect server in background
        redirect_app = create_redirect_app()
        redirect_thread = threading.Thread(
            target=lambda: redirect_app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False),
            daemon=True
        )
        redirect_thread.start()
        
        # Create SSL context with better configuration
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        context.load_cert_chain(cert_file, key_file)
        
        # Run HTTPS server on port 5443
        app.run(
            host='0.0.0.0',
            port=5443,
            debug=True,
            ssl_context=context,
            use_reloader=False
        )
    else:
        # Fallback to HTTP
        print("⚠️ SSL certificates not found, running HTTP only")
        print("💡 Run 'python generate_cert.py' to enable HTTPS")
        print("🌐 HTTP URL: http://localhost:5000")
        app.run(debug=True)