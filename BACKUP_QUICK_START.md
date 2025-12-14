# Backup System - Quick Start Guide

## Installation Steps

### 1. Run Database Migration
```bash
php artisan migrate
```
This creates the necessary backup settings in the database.

### 2. Verify Installation
- Log in as an Admin
- Go to **Admin → System Settings**
- Scroll to the **"Backup"** section
- You should see:
  - Backup Frequency dropdown
  - Backup Storage Location selector
  - Manual Backup button
  - Scan Backup Folder button

### 3. Configure Backup Path

**Option A: Browse Existing Folder**
1. Click "Click to select backup storage location"
2. Click "Browse Folder"
3. Select a folder that contains files (browser requirement)
4. Path will appear in the text field

**Option B: Create New Folder Path**
1. Click "Click to select backup storage location"
2. Click "Build Path for New Folder"
3. Select base path (C:\, D:\, /var/, /home/)
4. Or manually type full path (e.g., `C:\RDE_Backups`)
5. Click "Use This Path"

### 4. Select Backup Frequency
Choose when you want automatic backups:
- **Hourly**: Every hour
- **Daily**: Once per day (recommended)
- **Weekly**: Once per week
- **Monthly**: Once per month

### 5. Test Manual Backup
1. Click "Create Manual Backup"
2. Wait for completion (shows "Creating Backup..." while running)
3. You'll see a success message with statistics:
   - Number of proposals backed up
   - Number of files copied
   - Number of folders created
4. Verify folder structure in backup location

## What Gets Backed Up

### Files Included:
✅ Research Proposal PDFs/Documents
✅ SETI Reports
✅ GAD Compliance Files
✅ Matrix of Compliance

### Files Excluded:
❌ Supporting Documents
❌ Other miscellaneous files

### Data Coverage:
✅ ALL proposals (active and inactive)
✅ ALL users
✅ Organized by user and proposal ID

## Folder Structure Explained

When backup runs, it creates this structure:

```
C:\Backups\                                    (Your backup location)
├── 1_John_Doe\                               (User ID + Name)
│   ├── 101_RDE001_ResearchTitle\             (Proposal ID + Custom ID + Title)
│   │   ├── proposal_document.pdf             (Research proposal)
│   │   ├── seti_assessment.pdf               (SETI report)
│   │   ├── gad_checklist.xlsx                (GAD compliance)
│   │   └── matrix_compliance.pdf             (MOC document)
│   │
│   └── 102_RDE002_AnotherTitle\
│       ├── proposal_document.pdf
│       ├── seti_assessment.pdf
│       ├── gad_checklist.xlsx
│       └── matrix_compliance.pdf
│
└── 2_Jane_Smith\
    ├── 103_RDE003_SomeTitle\
    │   ├── proposal_document.pdf
    │   ├── seti_assessment.pdf
    │   ├── gad_checklist.xlsx
    │   └── matrix_compliance.pdf
    │
    └── 104_RDE004_AnotherTitle\
        ├── proposal_document.pdf
        ├── seti_assessment.pdf
        ├── gad_checklist.xlsx
        └── matrix_compliance.pdf
```

## Key Features

### Duplicate Detection
- When you click "Create Manual Backup", the system automatically:
  - Scans the backup folder
  - Identifies already-backed-up proposals
  - Skips duplicates to save storage space

### Manual Scan
- Use "Scan Backup Folder" to check for existing backups without creating new ones
- Useful for verifying backups or checking folder contents

### Last Backup Info
- Shows when the last backup was completed
- Updates automatically after each backup

## Common Tasks

### Backup All Current Proposals
1. Set backup path
2. Set backup frequency
3. Click "Create Manual Backup"
4. Done! ✓

### Check for Existing Backups
1. Make sure backup path is set
2. Click "Scan Backup Folder"
3. See count of existing backups

### Change Backup Location
1. Click the trash icon next to current location
2. Select new location
3. Next backup will use new path

### Verify Backup Contents
1. Open your file manager/explorer
2. Navigate to backup location
3. Check folder structure
4. Verify files are present

## Troubleshooting

### Q: Backup button is disabled
**A**: Make sure you have:
- Selected a backup storage location
- The location path is valid and writable

### Q: Can't select empty folder
**A**: 
- Use "Build Path for New Folder" button
- Or select a folder that contains files
- Manually type the path for new folders

### Q: Getting "unauthorized" error
**A**: Only admin users can create backups. Make sure you're logged in as an admin.

### Q: No backup location option showing
**A**: 
- Refresh the page
- Make sure you're in Admin → System Settings
- Check browser console for errors (F12 → Console)

### Q: Backup seems to fail
**A**: Check:
- Backup folder exists and is accessible
- You have write permissions to the folder
- Sufficient disk space available
- No antivirus blocking file operations

### Q: Files not being copied
**A**: Ensure:
- Original files exist in the system
- Backup folder is writable
- No file locks preventing copy

## Performance Tips

### For Large Systems (1000+ proposals)
1. Run backups during off-peak hours
2. Use daily or weekly frequency instead of hourly
3. Monitor disk space usage
4. Keep backup folder on fast storage (SSD preferred)

### Reduce Storage Usage
1. Use duplicate scanning (always enabled by default)
2. Consider removing very old backup folders manually
3. Archive old backups to external storage
4. Use cloud backup for off-site redundancy (future feature)

## Support

For issues or questions, check:
1. `BACKUP_SYSTEM_DOCUMENTATION.md` - Detailed technical documentation
2. `BACKUP_SYSTEM_IMPLEMENTATION_SUMMARY.md` - Implementation details
3. System logs: `storage/logs/laravel.log`
4. Browser console: Press F12 → Console tab

## Next Steps

After successful backup:
1. Verify folder structure is created
2. Spot-check a few proposal folders
3. Confirm all necessary files are present
4. Set up automatic backup frequency
5. Monitor "Last Backup" timestamp regularly

---

**You're all set!** Your backup system is ready to protect your research proposals. 🎉
