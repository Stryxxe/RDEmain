@echo off
echo Stopping all PHP processes...
taskkill /F /IM php.exe >nul 2>&1

echo.
echo Waiting 2 seconds...
timeout /t 2 >nul

echo.
echo Starting Laravel development server...
cd /d "%~dp0"
start "Laravel Server" cmd /k "php artisan serve"

echo.
echo Starting Laravel scheduler in background...
start "Laravel Scheduler" cmd /k "php artisan schedule:work"

echo.
echo Server and scheduler started! Check the new windows.
pause
