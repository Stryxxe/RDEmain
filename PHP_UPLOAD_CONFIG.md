# PHP Upload Configuration

## Issue
The application requires 50MB file uploads, but PHP's default `upload_max_filesize` is set to 2MB.

## Solution

### For Development (php artisan serve)

1. **Find your PHP configuration file:**
   ```bash
   php --ini
   ```
   This will show the path to your `php.ini` file.

2. **Edit php.ini and update these values:**
   ```ini
   upload_max_filesize = 50M
   post_max_size = 55M
   max_execution_time = 300
   memory_limit = 256M
   ```

3. **Restart your PHP server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   php artisan serve
   ```

### For Production (Apache/Nginx)

The `public/.user.ini` file has been updated with the correct values:
```ini
upload_max_filesize = 50M
post_max_size = 55M
```

**Note:** After updating `.user.ini`, you may need to restart your web server (Apache/Nginx) for changes to take effect.

### Verify Configuration

After restarting, you can verify the settings by checking the error message in the admin panel when uploading a file. It should show:
- `upload_max_filesize: 50M` (or higher)
- `post_max_size: 55M` (or higher)

## Current Status

- Application max file size: **50MB** ✅
- Laravel validation: **50MB (51200 KB)** ✅
- PHP configuration: **Needs to be updated to 50M** ⚠️



