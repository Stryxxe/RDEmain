# Production Deployment Guide for Automated Backups

## Overview
When deploying to production, the backup system will run automatically based on the configured frequency (daily, hourly, weekly, monthly). No manual intervention required.

## Setup Instructions

### 1. **Linux/Ubuntu Server (Recommended)**

Add Laravel's scheduler to your server's cron:

```bash
# Edit crontab
crontab -e

# Add this line (runs every minute, Laravel decides when to backup)
* * * * * cd /path/to/your/project && php artisan schedule:run >> /dev/null 2>&1
```

Replace `/path/to/your/project` with your actual project path.

### 2. **Windows Server**

Use Task Scheduler (already configured via `setup-scheduler.bat`):
- The task "Laravel-RDE-Scheduler" runs `php artisan schedule:run` every minute
- Ensure the task is set to run even when user is not logged in
- Set it to run under SYSTEM account for reliability

### 3. **Managed Hosting (Shared/Cloud)**

Most hosting providers have a "Cron Jobs" panel in their control panel:

**cPanel:**
1. Go to "Cron Jobs"
2. Add new cron job with interval "Every minute (* * * * *)"
3. Command: `cd /home/username/public_html && php artisan schedule:run`

**Laravel Forge:**
- Automatically configured when you deploy

**Heroku:**
Add Heroku Scheduler addon:
```bash
heroku addons:create scheduler:standard
heroku addons:open scheduler
```
Then add job: `php artisan schedule:run` to run every 10 minutes

**AWS/DigitalOcean:**
Same as Linux setup above - add to crontab

### 4. **Supervisor (For Production Reliability)**

For production environments, use Supervisor to keep the scheduler running:

```ini
[program:laravel-scheduler]
process_name=%(program_name)s
command=php /path/to/project/artisan schedule:work
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/path/to/project/storage/logs/scheduler.log
```

Then:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-scheduler
```

## How It Works

1. **Cron/Scheduler runs every minute** → Checks if any scheduled tasks are due
2. **Backup command checks frequency** → Compares last backup time with configured frequency
3. **If due** → Executes backup automatically
4. **Logs activity** → Records in activity logs and Laravel logs

## Admin Configuration

Admins can control backups via System Settings UI:
- **Backup Frequency**: hourly, twice_daily, daily, weekly, monthly
- **Backup Location**: Full path to backup directory
- **Manual Trigger**: "Create Manual Backup" button (bypasses frequency)
- **Scan for Duplicates**: Toggle to avoid re-copying existing files

## Monitoring

Check backup status:
- **Admin Dashboard** → System Settings → Backup Status
- **Activity Logs** → Filter by "backup_triggered"
- **Server Logs** → `storage/logs/laravel.log`

## Troubleshooting

**Backups not running:**
1. Verify cron is active: `crontab -l`
2. Check Laravel logs: `tail -f storage/logs/laravel.log`
3. Test manually: `php artisan backup:run --force`
4. Verify backup path is writable: `ls -la /backup/path`

**Permission issues:**
```bash
# Ensure backup directory is writable
sudo chown -R www-data:www-data /path/to/backup
sudo chmod -R 775 /path/to/backup
```

## Best Practices

1. **Set backup path to external storage** (S3, network drive) for safety
2. **Monitor disk space** on backup destination
3. **Test restore procedures** periodically
4. **Set appropriate frequency** (daily for most cases)
5. **Keep logs** for audit trail (already implemented)

## Security Notes

- Backup files contain sensitive research data - ensure directory is outside web root
- Restrict access to backup directory (chmod 700 or 770)
- Admin-only access is already enforced in the code
- Activity logging tracks all backup operations
