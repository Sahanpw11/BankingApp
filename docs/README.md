# BankingApp3 - Secure Banking Application

This repository contains both the backend (Python Flask) and frontend (React) components of the BankingApp3 application.

## Setup and Running the Application

### Prerequisites

- Python 3.8+ for the backend
- Node.js 14+ and npm for the frontend
- SQLite (included in Python) or another database of your choice

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment:
   ```
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```


4. Start the backend server:
   ```
   python run.py
   ```

The backend API will be available at http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

The frontend application will be available at http://localhost:3000

## Security Features

BankingApp implements a comprehensive security framework:

- Symmetric Key Encryption for data exchange
- Asymmetric Key Encryption for key exchange
- Hashing for data integrity
- Digital Signatures for authentication/non-repudiation
- HTTPS protocol (in production)
- Secure document transfer
- Encrypted backups
- Firewall and IDS implementations

## Development Commands

### Backend

- `python run.py` - Start the development server
- `python update_schema.py` - Update the database schema
- `python add_test_data.py` - Add test data to the database

### Frontend

- `npm start` - Start the development server
- `npm test` - Run tests
- `npm run build` - Create production build
  