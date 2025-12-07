# Backup System - Implementation Summary

## What Was Implemented

### 1. **BackupService** (`app/Services/BackupService.php`)
A comprehensive service that handles all backup operations:
- Creates organized folder structure by user and proposal ID
- Copies proposal files (research proposal, SETI, GAD, MOC)
- Excludes supporting documents automatically
- Scans for existing backups to avoid duplicates
- Returns detailed statistics

### 2. **API Endpoints** (Added to `app/Http/Controllers/SettingController.php`)
Three new endpoints for backup management:
- `POST /api/backup/trigger` - Create manual backup
- `POST /api/backup/scan` - Scan backup folder for existing backups
- `GET /api/backup/status` - Get backup status and statistics

### 3. **Database Migration** (`database/migrations/2025_12_07_000000_add_backup_settings.php`)
Adds backup-related settings:
- `backupFrequency` - Schedule (hourly, daily, weekly, monthly)
- `backupStorageLocation` - Path where backups are stored
- `lastBackupTime` - Timestamp of last backup
- `backupEnabled` - Enable/disable backups

### 4. **UI Integration** (`resources/js/Pages/RoleViews/Admin/SystemSettings.jsx`)
Updated admin settings page with:
- "Create Manual Backup" button
- "Scan Backup Folder" button
- Last backup timestamp display
- Dynamic button states (loading, disabled if no path)

## Folder Structure Created

```
Backup Location (e.g., C:\Backups)
├── 1_John_Doe/
│   ├── 101_RDE001_ResearchTitle/
│   │   ├── proposal_file.pdf
│   │   ├── seti_report.pdf
│   │   ├── gad_compliance.xlsx
│   │   └── matrix_of_compliance.pdf
│   ├── 102_RDE002_AnotherTitle/
│   │   └── [same file types]
├── 2_Jane_Smith/
│   ├── 103_RDE003_ResearchTitle/
│   │   └── [same file types]
```

## Key Features

✅ **Includes All Proposals**: Both active and inactive proposals backed up
✅ **User Organization**: Proposals grouped by user ID and name
✅ **Proposal ID Structure**: Clear hierarchy with proposal ID, custom ID, and title
✅ **File Filtering**: Only backs up core files (excluding supporting documents)
✅ **Duplicate Detection**: Scans existing backups to avoid wasting storage
✅ **Manual Triggering**: Admin can create backup immediately
✅ **Statistics**: Reports number of proposals, files, and folders created
✅ **Error Handling**: Graceful error messages and logging
✅ **Admin Only**: Restricted to authenticated admin users

## Usage Instructions

### For Admins:
1. Go to Admin → System Settings
2. Scroll to "Backup" section
3. Set "Backup Frequency" (hourly/daily/weekly/monthly)
4. Click "Select backup storage location" to choose a folder
   - Use "Browse Folder" for existing folders with files
   - Use "Build Path for New Folder" for new/empty folders
5. Click "Create Manual Backup" to start backup immediately
6. Click "Scan Backup Folder" to check for existing backups
7. View "Last Backup" timestamp to see when backup completed

### API Usage (via tools like Postman):
```bash
# Trigger backup
POST /api/backup/trigger
Headers: Authorization: Bearer {token}
Body: { "scan_for_duplicates": true }

# Scan folder
POST /api/backup/scan
Headers: Authorization: Bearer {token}
Body: { "backup_path": "C:\\Backups" }

# Get status
GET /api/backup/status
Headers: Authorization: Bearer {token}
```

## Technical Details

### Files Modified:
1. `app/Services/BackupService.php` - New file
2. `app/Http/Controllers/SettingController.php` - Added 3 new methods
3. `routes/api.php` - Added 3 new routes
4. `resources/js/Pages/RoleViews/Admin/SystemSettings.jsx` - Added UI buttons and handlers

### Files Created:
1. `database/migrations/2025_12_07_000000_add_backup_settings.php`
2. `BACKUP_SYSTEM_DOCUMENTATION.md` - Full documentation
3. `BACKUP_SYSTEM_IMPLEMENTATION_SUMMARY.md` - This file

### Dependencies:
- Laravel Models: Proposal, User, File, Setting
- File system operations (native PHP)
- Logging (Laravel Log facade)
- ActivityService (for tracking)

## Next Steps (Optional Enhancements)

1. **Scheduled Backups**: Configure Laravel task scheduler
   - In `app/Console/Kernel.php`, add scheduled command
   - Runs backup automatically at set frequency

2. **Backup Compression**: Add ZIP/TAR support
   - Reduces storage size significantly
   - Modify `copyProposalFiles()` to create archives

3. **Cloud Integration**: Add S3/Google Cloud support
   - Store backups off-site
   - Add cloud configuration to settings

4. **Restoration Feature**: Allow restoring specific proposals
   - Add UI to view and restore from backups
   - Add API endpoint to restore files

5. **Email Notifications**: Alert admins on backup completion
   - Success/failure notifications
   - Backup statistics summary

## Testing Checklist

- [ ] Run migration: `php artisan migrate`
- [ ] Visit Admin Settings page
- [ ] Set backup frequency
- [ ] Select backup storage location
- [ ] Click "Create Manual Backup"
- [ ] Verify folder structure created correctly
- [ ] Verify files are copied
- [ ] Click "Scan Backup Folder"
- [ ] Verify duplicate detection works
- [ ] Check backup statistics display
- [ ] Verify errors are handled gracefully
- [ ] Check logs for any issues

## Troubleshooting

**Issue**: "Backup path not configured"
- Solution: Set backup storage location in settings

**Issue**: "Invalid or inaccessible backup path"
- Solution: Check folder exists and is writable

**Issue**: Files not copied
- Solution: Ensure files exist in storage and permissions are correct

**Issue**: "Unauthorized" error
- Solution: Only admin users can trigger backups

For more details, see `BACKUP_SYSTEM_DOCUMENTATION.md`
