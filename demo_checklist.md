# Banking App Demo Preparation Checklist

## Prerequisites

- [ ] PostgreSQL installed and running (if not using Docker)
- [ ] Backend dependencies installed (`pip install -r backend/requirements.txt`)
- [ ] Frontend dependencies installed (`npm install` in frontend directory)
- [ ] Database initialized (`python backend/initialize_db.py`)
- [ ] Sample data created (`python backend/sample_data.py`)

## Before Starting the Demo

- [ ] Test run the application to ensure everything works
- [ ] Prepare demo user account (username: demouser, password: Demo123!)
- [ ] Create a few sample transactions to display in the dashboard
- [ ] Have the demo_script.md open for reference
- [ ] Set up screen sharing if presenting remotely
- [ ] Close unnecessary applications to avoid distractions

## Demo Flow Quick Reference

1. **Introduction (30 seconds)**

   - Application purpose and key features
   - Tech stack overview
2. **UI Components (60 seconds)**

   - Dashboard with account summaries and charts
   - Account management features
   - Transaction creation and processing
3. **Code Structure (60 seconds)**

   - Database schema and security features
   - Key security implementations
   - Notable PostgreSQL features
4. **Technical Highlights (30 seconds)**

   - Frameworks and performance optimizations
   - Testing methodology
   - Conclusion with project strengths

## Important Code Files to Highlight

- `backend/app/models/account.py` - Encrypted balance implementation
- `backend/app/security/digital_signature.py` - Transaction signing
- `backend/app/routes/transaction.py` - Transaction processing with security checks
- `frontend/src/api/account.js` - Frontend API with caching

## Starting the Demo

- Run `.\demo_launcher.ps1` in PowerShell
- Choose option 1 (Docker) or option 2 (direct local setup) depending on your preference

Remember to pace yourself and keep an eye on the time. The entire demo should take exactly 3 minutes.
