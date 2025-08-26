from app import create_app
import os

app = create_app()

if __name__ == '__main__':
    # HTTP server (for compatibility)
    print("🌐 Starting Banking App HTTP server")
    print("🌐 HTTP URL: http://localhost:5000")
    print("💡 Use 'python run.py' for HTTPS version")
    app.run(host='0.0.0.0', port=5000, debug=True)
