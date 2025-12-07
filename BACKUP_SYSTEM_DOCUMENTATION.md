# Backup System Implementation

## Overview
The backup system automatically organizes and backs up all proposals by user and proposal ID, with smart duplicate detection to avoid wasting storage.

## Folder Structure
```
Backup Location (e.g., C:\Backups)
├── 1_John_Doe
│   ├── 101_RDE001_ResearchProposalTitle
│   │   ├── proposal_file.pdf
│   │   ├── seti_report.pdf
│   │   ├── gad_compliance.xlsx
│   │   └── matrix_of_compliance.pdf
│   ├── 102_RDE002_AnotherResearchTitle
│   │   ├── proposal_file.pdf
│   │   ├── seti_report.pdf
│   │   ├── gad_compliance.xlsx
│   │   └── matrix_of_compliance.pdf
├── 2_Jane_Smith
│   ├── 103_RDE003_ResearchProposalTitle
│   │   ├── proposal_file.pdf
│   │   ├── seti_report.pdf
│   │   ├── gad_compliance.xlsx
│   │   └── matrix_of_compliance.pdf
```

## Components

### 1. BackupService (`app/Services/BackupService.php`)
Main service handling all backup operations.

**Key Methods:**
- `createBackup(string $backupPath, bool $scanForDuplicates)`: Creates a full backup of all proposals
- `scanExistingBackups(string $backupPath)`: Scans the backup folder to identify existing backups
- `copyProposalFiles(Proposal $proposal, string $proposalPath)`: Copies individual proposal files

**Features:**
- Excludes files marked as "supporting_documents"
- Includes: research proposals, SETI reports, GAD compliance files, and Matrix of Compliance
- Creates organized folder structure automatically
- Handles errors gracefully with logging
- Returns detailed statistics about the backup

### 2. SettingController Methods

#### `triggerBackup(Request $request)`
- **Route**: `POST /api/backup/trigger`
- **Authorization**: Admin only
- **Parameters**: 
  - `scan_for_duplicates` (boolean, default: true)
- **Response**: Backup statistics including:
  - `backed_up`: Number of proposals backed up
  - `skipped_duplicates`: Number of duplicates skipped
  - `files_copied`: Total files copied
  - `errors`: Any errors encountered

#### `scanBackupFolder(Request $request)`
- **Route**: `POST /api/backup/scan`
- **Authorization**: Admin only
- **Parameters**: 
  - `backup_path` (optional, uses settings if not provided)
- **Response**: 
  - Count of existing backups
  - List of backup records (userId_proposalId)

#### `getBackupStatus(Request $request)`
- **Route**: `GET /api/backup/status`
- **Authorization**: Admin only
- **Response**:
  - Current backup path
  - Backup frequency setting
  - Last backup timestamp
  - Folder writability status
  - Total folder size

### 3. Database Migration
**File**: `database/migrations/2025_12_07_000000_add_backup_settings.php`

**Settings Added**:
- `backupFrequency`: Schedule (hourly, daily, weekly, monthly)
- `backupStorageLocation`: Path to backup folder
- `lastBackupTime`: Last successful backup timestamp
- `backupEnabled`: Whether backups are active

## UI Components

### Admin System Settings
Located in `resources/js/Pages/RoleViews/Admin/SystemSettings.jsx`

**Features**:
1. **Backup Frequency Dropdown**: Select automated backup schedule
2. **Backup Storage Location Selector**:
   - Browse existing folders with files
   - Build custom paths for new folders
3. **Manual Backup Button**: Trigger backup immediately
4. **Scan Backup Folder Button**: Check for existing backups
5. **Last Backup Status**: Shows timestamp of last backup

## How It Works

### Manual Backup Flow
1. Admin clicks "Create Manual Backup" button
2. System fetches backup path from settings
3. Service scans for existing backups (optional)
4. For each proposal:
   - Creates user folder: `{userID}_{firstName}_{lastName}`
   - Creates proposal folder: `{proposalID}_{customProposalId}_{researchTitle}`
   - Copies all non-supporting-document files
5. Returns statistics
6. Updates "Last Backup Time" in settings

### Duplicate Detection
When `scan_for_duplicates` is true:
1. Scans backup folder structure
2. Extracts userId and proposalId from folder names
3. Creates a map of existing backups
4. Skips any proposal already backed up
5. Reduces storage waste

### Automatic Backup (Future Implementation)
The system stores the backup frequency setting. A Laravel scheduled task can be configured to:
- Check `backupEnabled` setting
- Execute `triggerBackup()` at specified frequency
- Log completion/errors
- Update `lastBackupTime`

## API Endpoints

### Create Manual Backup
```bash
POST /api/backup/trigger
Authorization: Bearer {token}
Content-Type: application/json

{
  "scan_for_duplicates": true
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Backup completed successfully",
  "data": {
    "total_proposals": 50,
    "backed_up": 45,
    "skipped_duplicates": 5,
    "files_copied": 234,
    "user_folders_created": 10,
    "proposal_folders_created": 45,
    "errors": []
  }
}
```

### Scan Backup Folder
```bash
POST /api/backup/scan
Authorization: Bearer {token}
Content-Type: application/json

{
  "backup_path": "C:\\Backups"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Backup folder scanned successfully",
  "data": {
    "backup_path": "C:\\Backups",
    "existing_backups_count": 45,
    "backups": {
      "1_101": true,
      "1_102": true,
      "2_103": true
    }
  }
}
```

### Get Backup Status
```bash
GET /api/backup/status
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "backup_location_configured": true,
    "backup_path": "C:\\Backups",
    "backup_frequency": "daily",
    "last_backup": "2025-12-07T14:30:00.000000Z",
    "is_writable": true,
    "folder_size": 1024000000,
    "folder_size_formatted": "976 MB"
  }
}
```

## Error Handling

### Common Errors

**Invalid Backup Path**
```json
{
  "success": false,
  "message": "Invalid or inaccessible backup path"
}
```

**No Path Configured**
```json
{
  "success": false,
  "message": "Backup storage location not configured. Please set it in System Settings."
}
```

**Path Not Writable**
```json
{
  "success": false,
  "message": "Backup path is not writable"
}
```

## Installation

1. **Run Migration**:
   ```bash
   php artisan migrate
   ```

2. **Set Backup Path** (via Admin UI or directly):
   ```bash
   php artisan tinker
   # In Tinker:
   Setting::updateOrCreate(['key' => 'backupStorageLocation'], ['value' => 'C:\\Backups', 'type' => 'string'])
   ```

3. **Test Backup**:
   - Go to Admin → System Settings
   - Set backup frequency and location
   - Click "Create Manual Backup"

## File Type Categories

The system backs up files categorized as:
- **Research Proposal**: Main proposal document
- **SETI**: Science, Engineering, Technology, Innovation reports
- **GAD**: Gender and Development compliance files
- **MOC**: Matrix of Compliance documents

**Excluded**:
- Supporting documents
- Other miscellaneous files

## Security Considerations

1. **Authorization**: Only admins can trigger backups
2. **Path Validation**: Checks if backup path exists and is writable
3. **Permissions**: Uses system file permissions
4. **Logging**: All backup activities are logged
5. **Activity Tracking**: Manual backups logged to activity log

## Performance Notes

- Large backups (1000+ proposals) may take time
- File copying is optimized with PHP's native functions
- Duplicate scanning reduces unnecessary file operations
- Consider scheduling backups during off-peak hours

## Future Enhancements

1. **Automated Backup Scheduler**: Laravel task scheduling
2. **Backup Compression**: ZIP/TAR archives
3. **Cloud Backup Support**: AWS S3, Google Cloud Storage
4. **Backup Restoration**: UI to restore specific proposals
5. **Incremental Backups**: Only backup changed files
6. **Backup Encryption**: Secure sensitive data
7. **Email Notifications**: Alert on backup completion/failure
