# Banking App Security Demo Launcher
# Run this script to prepare and start your security demonstration

Write-Host "🔒 Banking Application Security Demo Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".\backend\run.py") -or -not (Test-Path ".\frontend\package.json")) {
    Write-Host "❌ Error: Please run this script from the BankingApp Main directory" -ForegroundColor Red
    Write-Host "Expected structure:" -ForegroundColor Yellow
    Write-Host "  .\backend\run.py" -ForegroundColor Yellow
    Write-Host "  .\frontend\package.json" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found backend and frontend directories" -ForegroundColor Green

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("127.0.0.1", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Check if required ports are available
Write-Host ""
Write-Host "🔍 Checking port availability..." -ForegroundColor Yellow

if (Test-Port 5000) {
    Write-Host "⚠️  Port 5000 (Backend) is already in use" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") { exit 1 }
} else {
    Write-Host "✅ Port 5000 (Backend) is available" -ForegroundColor Green
}

if (Test-Port 3000) {
    Write-Host "⚠️  Port 3000 (Frontend) is already in use" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") { exit 1 }
} else {
    Write-Host "✅ Port 3000 (Frontend) is available" -ForegroundColor Green
}

# Display demo options
Write-Host ""
Write-Host "🚀 Demo Setup Options:" -ForegroundColor Cyan
Write-Host "1. Start Backend Only (for API demonstration)" -ForegroundColor White
Write-Host "2. Start Frontend Only (if backend is already running)" -ForegroundColor White
Write-Host "3. Start Full Application (Backend + Frontend)" -ForegroundColor White
Write-Host "4. Open Demo Guide" -ForegroundColor White
Write-Host "5. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select option (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔧 Starting Backend Server..." -ForegroundColor Cyan
        Write-Host "Backend will be available at: http://localhost:5000" -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        
        cd backend
        python run.py
    }
    
    "2" {
        Write-Host ""
        Write-Host "🎨 Starting Frontend Development Server..." -ForegroundColor Cyan
        Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        
        cd frontend
        npm start
    }
    
    "3" {
        Write-Host ""
        Write-Host "🚀 Starting Full Application..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📍 Demo URLs:" -ForegroundColor Yellow
        Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
        Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
        Write-Host ""
        Write-Host "🔑 Demo Credentials:" -ForegroundColor Yellow
        Write-Host "  Username: demouser" -ForegroundColor White
        Write-Host "  Password: Demo123!" -ForegroundColor White
        Write-Host ""
        Write-Host "📚 Demo Guide: Open SECURITY_DEMO_GUIDE.md for detailed instructions" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Starting servers... (this may take a moment)" -ForegroundColor Green
        
        # Start backend in a new PowerShell window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; python run.py"
        
        # Wait a moment for backend to start
        Start-Sleep -Seconds 3
        
        # Start frontend in a new PowerShell window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm start"
        
        Write-Host "✅ Both servers are starting in separate windows" -ForegroundColor Green
        Write-Host "⏱️  Please wait 10-15 seconds for the application to fully load" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🎯 Quick Demo Flow:" -ForegroundColor Cyan
        Write-Host "  1. Navigate to http://localhost:3000/login" -ForegroundColor White
        Write-Host "  2. Login with demo credentials" -ForegroundColor White
        Write-Host "  3. Explore security features in Settings" -ForegroundColor White
        Write-Host "  4. Create a transaction to see digital signatures" -ForegroundColor White
        Write-Host ""
        Write-Host "Press any key to exit this launcher..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    
    "4" {
        Write-Host ""
        Write-Host "📖 Opening Demo Guide..." -ForegroundColor Cyan
        
        if (Test-Path ".\SECURITY_DEMO_GUIDE.md") {
            Start-Process ".\SECURITY_DEMO_GUIDE.md"
            Write-Host "✅ Demo guide opened" -ForegroundColor Green
        } else {
            Write-Host "❌ Demo guide not found" -ForegroundColor Red
        }
        
        if (Test-Path ".\DEMO_QUICK_REF.md") {
            Start-Process ".\DEMO_QUICK_REF.md"
            Write-Host "✅ Quick reference opened" -ForegroundColor Green
        } else {
            Write-Host "❌ Quick reference not found" -ForegroundColor Red
        }
    }
    
    "5" {
        Write-Host "👋 Goodbye!" -ForegroundColor Cyan
        exit 0
    }
    
    default {
        Write-Host "❌ Invalid option. Please run the script again." -ForegroundColor Red
        exit 1
    }
}
