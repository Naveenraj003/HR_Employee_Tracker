# Hospital Employee Tracker - Integrated Setup Script
# This script sets up and runs the entire application

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Hospital Employee Tracker Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verify we're in the right directory
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "ERROR: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Step 1: Verify PostgreSQL Connection
Write-Host "[1/5] Verifying PostgreSQL connection..." -ForegroundColor Yellow
$pgTest = psql -U hospital_user -d hospital_tracker_dev -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cannot connect to PostgreSQL. Is it running?" -ForegroundColor Red
    Write-Host "Run: net start postgresql-x64-15" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ PostgreSQL connected successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Install Backend Dependencies
Write-Host "[2/5] Installing backend dependencies..." -ForegroundColor Yellow
Push-Location backend
npm install 2>&1 | out-null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install backend dependencies" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 3: Install Frontend Dependencies
Write-Host "[3/5] Installing frontend dependencies..." -ForegroundColor Yellow
Push-Location frontend
npm install 2>&1 | out-null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install frontend dependencies" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 4: Summary and Next Steps
Write-Host "[4/5] Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps - Run these commands in separate PowerShell terminals:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Terminal 1 (Backend):" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  npm run start:dev" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 2 (Seed Data):" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  npm run seed" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 3 (Frontend):" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  Then open browser:" -ForegroundColor Yellow
Write-Host "  http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "  Login with:" -ForegroundColor Yellow
Write-Host "  Email: demo@example.com" -ForegroundColor White
Write-Host "  Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Ready to run! See instructions above." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
