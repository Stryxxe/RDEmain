@echo off
REM This script sets up Windows Task Scheduler to run Laravel's scheduler every minute
REM Run this script as Administrator

echo Setting up Laravel Task Scheduler...
echo.

REM Get the current directory (project root)
set "PROJECT_PATH=%~dp0"
set "PHP_PATH=php"

REM Create the task
schtasks /create /tn "Laravel-RDE-Scheduler" /tr "\"%PHP_PATH%\" \"%PROJECT_PATH%artisan\" schedule:run" /sc minute /ru "SYSTEM" /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Success! Task "Laravel-RDE-Scheduler" has been created.
    echo The Laravel scheduler will now run every minute automatically.
    echo.
    echo Your automated backups based on the frequency setting will now work.
    echo.
) else (
    echo.
    echo Error: Failed to create scheduled task.
    echo Make sure you run this script as Administrator.
    echo.
)

pause
