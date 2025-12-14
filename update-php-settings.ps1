# Script to update PHP upload settings
# Run this as Administrator

$phpIniPath = "C:\php\php.ini"

if (Test-Path $phpIniPath) {
    Write-Host "Updating PHP configuration at $phpIniPath" -ForegroundColor Yellow
    
    # Read the content
    $content = Get-Content $phpIniPath -Raw
    
    # Update upload_max_filesize
    if ($content -match "upload_max_filesize\s*=\s*\d+M") {
        $content = $content -replace "upload_max_filesize\s*=\s*\d+M", "upload_max_filesize = 20M"
        Write-Host "✓ Updated upload_max_filesize to 20M" -ForegroundColor Green
    } else {
        $content += "`nupload_max_filesize = 20M`n"
        Write-Host "✓ Added upload_max_filesize = 20M" -ForegroundColor Green
    }
    
    # Update post_max_size
    if ($content -match "post_max_size\s*=\s*\d+M") {
        $content = $content -replace "post_max_size\s*=\s*\d+M", "post_max_size = 25M"
        Write-Host "✓ Updated post_max_size to 25M" -ForegroundColor Green
    } else {
        $content += "post_max_size = 25M`n"
        Write-Host "✓ Added post_max_size = 25M" -ForegroundColor Green
    }
    
    # Save the file
    Set-Content $phpIniPath -Value $content
    
    Write-Host "`nPHP settings updated successfully!" -ForegroundColor Green
    Write-Host "Please restart your PHP server (php artisan serve) for changes to take effect." -ForegroundColor Yellow
} else {
    Write-Host "Error: PHP configuration file not found at $phpIniPath" -ForegroundColor Red
    Write-Host "Please locate your php.ini file and manually update:" -ForegroundColor Yellow
    Write-Host "  upload_max_filesize = 20M" -ForegroundColor White
    Write-Host "  post_max_size = 25M" -ForegroundColor White
}
