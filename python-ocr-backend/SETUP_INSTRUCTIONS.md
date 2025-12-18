# OCR Scanner Backend - Step-by-Step Setup Guide

## 📋 What You Need

1. **Python 3.8+** ✅ (You have Python 3.13.5)
2. **Tesseract OCR** ❌ (Not installed yet)
3. **Poppler** (for PDF processing) - Optional but recommended

---

## 🚀 Step-by-Step Setup Instructions

### Step 1: Install Tesseract OCR

**Option A: Using Chocolatey (Recommended for Windows)**

```powershell
# Open PowerShell as Administrator
choco install tesseract
```

**Option B: Manual Installation**

1. Download Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer
3. **Important:** Remember the installation path (usually `C:\Program Files\Tesseract-OCR\`)
4. Add Tesseract to PATH (optional, but recommended):
    - Open System Properties → Environment Variables
    - Add `C:\Program Files\Tesseract-OCR` to PATH

**Verify Installation:**

```powershell
tesseract --version
```

### Step 2: Install Poppler (for PDF to Image conversion)

**Option A: Using Chocolatey**

```powershell
choco install poppler
```

**Option B: Manual Installation**

1. Download from: http://blog.alivate.com.au/poppler-windows/
2. Extract to a folder (e.g., `C:\poppler`)
3. Add `C:\poppler\Library\bin` to your PATH

**Verify Installation:**

```powershell
pdftoppm -h
```

### Step 3: Navigate to Backend Directory

```powershell
cd python-ocr-backend
```

### Step 4: Create Virtual Environment

```powershell
python -m venv venv
```

### Step 5: Activate Virtual Environment

```powershell
# PowerShell
.\venv\Scripts\Activate.ps1

# If you get an execution policy error, run this first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Alternative (Command Prompt):**

```cmd
venv\Scripts\activate.bat
```

### Step 6: Upgrade Pip

```powershell
python -m pip install --upgrade pip
```

### Step 7: Install Python Dependencies

```powershell
pip install -r requirements.txt
```

This will install:

-   Django 4.2
-   Django REST Framework
-   pytesseract (OCR library)
-   pdf2image (PDF processing)
-   Pillow (Image processing)
-   django-cors-headers (CORS support)
-   python-dotenv (Environment variables)

### Step 8: Create Environment Configuration File

Create a `.env` file in the `python-ocr-backend` folder:

```powershell
# Create .env file
@"
DJANGO_SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Tesseract OCR Path (adjust if installed elsewhere)
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe

# CORS Configuration (Laravel frontend)
LARAVEL_URL=http://localhost:8000
"@ | Out-File -FilePath ".env" -Encoding utf8
```

**Or manually create `.env` file with:**

```env
DJANGO_SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
LARAVEL_URL=http://localhost:8000
```

**Important:** Update `TESSERACT_PATH` if Tesseract is installed in a different location.

### Step 9: Run Database Migrations

```powershell
python manage.py migrate
```

### Step 10: Test the Setup

**Start the server:**

```powershell
python manage.py runserver 8001
```

**In another terminal, test the health endpoint:**

```powershell
# Test health check
Invoke-RestMethod -Uri "http://localhost:8001/api/health"

# Test OCR status
Invoke-RestMethod -Uri "http://localhost:8001/api/ocr-status"
```

---

## ✅ Verification Checklist

-   [ ] Python 3.8+ installed
-   [ ] Tesseract OCR installed and accessible
-   [ ] Poppler installed (for PDF processing)
-   [ ] Virtual environment created and activated
-   [ ] All Python dependencies installed
-   [ ] `.env` file created with correct TESSERACT_PATH
-   [ ] Database migrations completed
-   [ ] Server starts on port 8001
-   [ ] Health check endpoint responds
-   [ ] OCR status endpoint shows Tesseract is available

---

## 🔧 Troubleshooting

### Tesseract Not Found

-   Verify Tesseract is installed: `tesseract --version`
-   Check `.env` file has correct `TESSERACT_PATH`
-   Try full path: `C:\Program Files\Tesseract-OCR\tesseract.exe`

### PDF Processing Fails

-   Install Poppler and add to PATH
-   Verify: `pdftoppm -h` works

### Virtual Environment Issues

-   If activation fails, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
-   Or use Command Prompt instead of PowerShell

### Port Already in Use

-   Change port: `python manage.py runserver 8002`
-   Or stop the process using port 8001

---

## 🎯 Quick Start (After Setup)

Once everything is set up, you can use the provided scripts:

**Start Server:**

```powershell
.\start_server.bat
```

**Or manually:**

```powershell
.\venv\Scripts\Activate.ps1
python manage.py runserver 8001
```

---

## 📡 API Endpoints

After setup, the following endpoints will be available:

-   `GET http://localhost:8001/api/health` - Health check
-   `GET http://localhost:8001/api/ocr-status` - OCR service status
-   `POST http://localhost:8001/api/process` - Process document with OCR

---

## 📝 Notes

-   The backend runs on port **8001** (Laravel uses 8000)
-   Make sure Tesseract path in `.env` matches your installation
-   Keep virtual environment activated when running the server
-   For production, change `DJANGO_SECRET_KEY` and set `DEBUG=False`
