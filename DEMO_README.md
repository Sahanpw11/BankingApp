# 🔒 Banking App Security Demonstration

## Quick Start
```powershell
# Run from the BankingApp Main directory
.\demo_launcher.ps1
```

## Demo Highlights

### 🛡️ Security Features Showcased
- **Multi-Factor Authentication**: TOTP-based 2FA with QR codes
- **Data Encryption**: AES-256 for sensitive data, RSA-2048 for key exchange
- **Digital Signatures**: Every transaction cryptographically signed
- **Secure Authentication**: JWT tokens with device fingerprinting
- **Account Protection**: Encrypted balances and secure access controls

### 🎯 Demo Flow (3-5 minutes)
1. **Login Security** - Secure authentication with encryption
2. **Two-Factor Setup** - Enable 2FA with QR code generation
3. **Transaction Security** - Create transfers with digital signatures
4. **Code Architecture** - Show security implementation

### 🔧 Technical Architecture
```
Frontend (React + CryptoJS) ──► Backend (Flask + JWT)
        │                              │
        ▼                              ▼
   Client Encryption              Digital Signatures
   Session Security               Database Encryption
   Device Tracking               Transaction Signing
```

## Pre-Demo Checklist
- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:3000
- [ ] Demo credentials ready: `demouser` / `Demo123!`
- [ ] Demo guides open for reference
- [ ] Screen sharing setup (if presenting remotely)

## Key Demo URLs
- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard
- Security Settings: http://localhost:3000/settings
- Transactions: http://localhost:3000/transactions

## Demo Script Sound Bites
- "This banking application demonstrates enterprise-level security"
- "Every transaction is digitally signed for non-repudiation"
- "Account balances are encrypted at the database level"
- "Two-factor authentication provides additional security layers"
- "The architecture follows financial industry security standards"

## Troubleshooting
- **Port conflicts**: Use the launcher to check availability
- **Login issues**: Verify backend is running and accessible
- **Missing features**: Check if database is properly initialized

## Files Created for Demo
- `SECURITY_DEMO_GUIDE.md` - Comprehensive demo guide
- `DEMO_QUICK_REF.md` - Quick reference during presentation
- `demo_launcher.ps1` - Easy setup script

---
**Ready to demonstrate production-level security in a modern banking application!** 🚀
