# Python OCR Backend Setup Script (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Python OCR Backend Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[1/5] Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://www.python.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "[2/5] Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "[2/5] Virtual environment already exists" -ForegroundColor Green
}
Write-Host ""

# Activate virtual environment
Write-Host "[3/5] Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to activate virtual environment" -ForegroundColor Red
    Write-Host "You may need to run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Virtual environment activated" -ForegroundColor Green
Write-Host ""

# Upgrade pip
Write-Host "[4/5] Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip --quiet
Write-Host "[OK] Pip upgraded" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "[5/5] Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependencies installed" -ForegroundColor Green
Write-Host ""

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "[INFO] Creating .env file..." -ForegroundColor Yellow
    $envContent = @"
# Django Configuration
DJANGO_SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Tesseract OCR Path (Windows default)
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe

# CORS Configuration (Laravel frontend)
LARAVEL_URL=http://localhost:8000
"@
    $envContent | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "[OK] .env file created" -ForegroundColor Green
    Write-Host "[WARNING] Please edit .env file and set TESSERACT_PATH if needed" -ForegroundColor Yellow
} else {
    Write-Host "[INFO] .env file already exists" -ForegroundColor Green
}
Write-Host ""

# Check Tesseract
Write-Host "[INFO] Checking Tesseract installation..." -ForegroundColor Yellow
try {
    $tesseractVersion = tesseract --version 2>&1
    Write-Host "[OK] Tesseract found:" -ForegroundColor Green
    Write-Host $tesseractVersion
} catch {
    Write-Host "[WARNING] Tesseract OCR not found in PATH" -ForegroundColor Yellow
    Write-Host "Please install Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki" -ForegroundColor Yellow
    Write-Host "Or set TESSERACT_PATH in .env file" -ForegroundColor Yellow
}
Write-Host ""

# Run migrations
Write-Host "[INFO] Running database migrations..." -ForegroundColor Yellow
python manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Migrations failed, but setup continues" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Migrations completed" -ForegroundColor Green
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file and set TESSERACT_PATH if needed" -ForegroundColor White
Write-Host "2. Run: python manage.py runserver 8001" -ForegroundColor White
Write-Host "   Or use: .\start_server.bat" -ForegroundColor White
Write-Host "3. Test: http://localhost:8001/api/health" -ForegroundColor White
Write-Host ""

