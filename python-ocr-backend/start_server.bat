@echo off
echo ========================================
echo Starting Python OCR Backend Server
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo [ERROR] Virtual environment not found!
    echo Please run setup.bat first
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo Creating from .env.example...
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [OK] .env file created. Please edit it before continuing.
    ) else (
        echo [ERROR] .env.example not found. Please create .env manually.
        pause
        exit /b 1
    )
)

echo Starting Django development server on port 8001...
echo Server will be available at: http://localhost:8001
echo Press Ctrl+C to stop the server
echo.

python manage.py runserver 8001

