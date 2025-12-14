# PowerShell script to update PHP upload limits to 50MB
# Run this script as Administrator

Write-Host "PHP Upload Limits Configuration Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Find PHP configuration file
$phpIniPath = ""
$phpIniOutput = php --ini 2>&1 | Out-String

if ($phpIniOutput -match "Loaded Configuration File:\s+(.+)") {
    $phpIniPath = $matches[1].Trim()
    Write-Host "Found PHP configuration file: $phpIniPath" -ForegroundColor Green
} else {
    # Try common locations
    $commonPaths = @(
        "C:\php\php.ini",
        "C:\xampp\php\php.ini",
        "C:\wamp\bin\php\php*\php.ini",
        "$env:ProgramFiles\PHP\php.ini",
        "$env:ProgramFiles(x86)\PHP\php.ini"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $phpIniPath = $path
            Write-Host "Found PHP configuration file: $phpIniPath" -ForegroundColor Green
            break
        }
    }
}

if (-not $phpIniPath -or -not (Test-Path $phpIniPath)) {
    Write-Host "ERROR: Could not find php.ini file automatically." -ForegroundColor Red
    Write-Host "Please run 'php --ini' to find your php.ini location." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Then manually edit php.ini and set:" -ForegroundColor Yellow
    Write-Host "  upload_max_filesize = 50M" -ForegroundColor White
    Write-Host "  post_max_size = 55M" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if file is writable
if (-not (Test-Path $phpIniPath -PathType Leaf)) {
    Write-Host "ERROR: php.ini file not found at: $phpIniPath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Read current content
Write-Host "Reading current configuration..." -ForegroundColor Yellow
$content = Get-Content $phpIniPath -Raw

# Backup original file
$backupPath = "$phpIniPath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $phpIniPath $backupPath
Write-Host "Backup created: $backupPath" -ForegroundColor Green

# Update upload_max_filesize
if ($content -match "(?m)^\s*;\s*?upload_max_filesize\s*=") {
    # Commented out, uncomment and set
    $content = $content -replace "(?m)^\s*;\s*?upload_max_filesize\s*=.*", "upload_max_filesize = 50M"
    Write-Host "✓ Uncommented and set upload_max_filesize = 50M" -ForegroundColor Green
} elseif ($content -match "(?m)^\s*upload_max_filesize\s*=\s*\d+[KM]?") {
    $content = $content -replace "(?m)^\s*upload_max_filesize\s*=\s*\d+[KM]?", "upload_max_filesize = 50M"
    Write-Host "✓ Updated upload_max_filesize to 50M" -ForegroundColor Green
} else {
    # Add if not found
    $content += "`n; File upload settings`nupload_max_filesize = 50M`n"
    Write-Host "✓ Added upload_max_filesize = 50M" -ForegroundColor Green
}

# Update post_max_size
if ($content -match "(?m)^\s*;\s*?post_max_size\s*=") {
    $content = $content -replace "(?m)^\s*;\s*?post_max_size\s*=.*", "post_max_size = 55M"
    Write-Host "✓ Uncommented and set post_max_size = 55M" -ForegroundColor Green
} elseif ($content -match "(?m)^\s*post_max_size\s*=\s*\d+[KM]?") {
    $content = $content -replace "(?m)^\s*post_max_size\s*=\s*\d+[KM]?", "post_max_size = 55M"
    Write-Host "✓ Updated post_max_size to 55M" -ForegroundColor Green
} else {
    $content += "post_max_size = 55M`n"
    Write-Host "✓ Added post_max_size = 55M" -ForegroundColor Green
}

# Save the file
try {
    Set-Content $phpIniPath -Value $content -NoNewline
    Write-Host ""
    Write-Host "✓ PHP configuration updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: You must restart your PHP server for changes to take effect." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If using 'php artisan serve':" -ForegroundColor Cyan
    Write-Host "  1. Stop the server (Ctrl+C)" -ForegroundColor White
    Write-Host "  2. Run 'php artisan serve' again" -ForegroundColor White
    Write-Host ""
    Write-Host "If using Apache/Nginx:" -ForegroundColor Cyan
    Write-Host "  Restart your web server" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "ERROR: Could not write to php.ini file." -ForegroundColor Red
    Write-Host "You may need to run this script as Administrator." -ForegroundColor Yellow
    Write-Host "Error: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit"


