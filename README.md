# Research Development & Extension (RDE) Management System

A Laravel-based application for managing research proposals, endorsements, reviews, and project workflows using Laravel 12, Inertia.js, and React.

## Prerequisites

Before you begin, ensure you have the following installed:

- **PHP 8.2 or higher** ([Download PHP](https://www.php.net/downloads))
- **Composer** ([Download Composer](https://getcomposer.org/download/))
- **Node.js 18+ & npm** ([Download Node.js](https://nodejs.org/))
- **SQLite** (included with PHP) or **MySQL/PostgreSQL** (optional)

## Quick Setup Guide

### 1. Clone & Navigate to Project
```bash
cd c:\projects\RDEmain-refactor-UI-apply_DRY_principle
```

### 2. Install PHP Dependencies
```bash
composer install
```

### 3. Install JavaScript Dependencies
```bash
npm install
```

### 4. Configure Environment
```bash
# Copy the example environment file
copy .env.example .env

# Generate application key
php artisan key:generate
```

### 5. Configure Database

**Option A: Using SQLite (Recommended for Quick Start)**
```bash
# Create SQLite database file
type nul > database\database.sqlite
```

The `.env` file is already configured for SQLite by default.

**Option B: Using MySQL/PostgreSQL**

Edit `.env` and update:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 6. Run Database Migrations
```bash
php artisan migrate
```

### 7. Seed Database (Optional)
```bash
# Seed with sample data
php artisan db:seed
```

### 8. Create Storage Link
```bash
php artisan storage:link
```

### 9. Configure File Upload Limits (Optional)

If you need to upload large files, run:
```powershell
.\update-php-upload-limits.ps1
```

### 10. Start Development Servers

**Option A: All-in-One Command (Recommended)**
```bash
composer dev
```

This starts all required services:
- Laravel server (http://localhost:8000)
- Queue worker
- Log viewer (Pail)
- Vite dev server (for frontend assets)

**Option B: Manual Start**

Open 4 separate terminal windows and run:

Terminal 1 - Laravel Server:
```bash
php artisan serve
```

Terminal 2 - Queue Worker:
```bash
php artisan queue:listen
```

Terminal 3 - Frontend Dev Server:
```bash
npm run dev
```

Terminal 4 - Logs (Optional):
```bash
php artisan pail
```

### 11. Access the Application

Open your browser and navigate to:
```
http://localhost:8000
```

## Project Features

- ✅ Research proposal submission and management
- ✅ Multi-level endorsement workflow
- ✅ Review and decision tracking
- ✅ File upload management
- ✅ User roles and permissions
- ✅ Activity logging
- ✅ Automated backup system
- ✅ Email notifications
- ✅ Timeline tracking for proposals
- ✅ Analytics and reporting

## Additional Configuration

### Setting Up Email (Optional)
Edit `.env` to configure email:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@rde.edu"
MAIL_FROM_NAME="${APP_NAME}"
```

### Setting Up Task Scheduler (Windows)
For automated backups and scheduled tasks:
```bash
.\setup-scheduler.bat
```

### Backup System Configuration
1. Log in as Admin
2. Go to **Admin → System Settings**
3. Scroll to **Backup** section
4. Configure backup frequency and storage location
5. See [BACKUP_QUICK_START.md](BACKUP_QUICK_START.md) for detailed instructions

## Building for Production

```bash
# Build frontend assets
npm run build

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Common Commands

```bash
# Clear all caches
php artisan optimize:clear

# Run tests
php artisan test

# Check code quality
./vendor/bin/phpstan analyse

# Format code
./vendor/bin/pint

# Create a new migration
php artisan make:migration create_table_name

# Create a new controller
php artisan make:controller ControllerName

# Create a new model
php artisan make:model ModelName -m
```

## Troubleshooting

### Port Already in Use
If port 8000 is already in use:
```bash
php artisan serve --port=8080
```

### Permission Issues
On Windows, you may need to run PowerShell as Administrator for certain operations.

### Database Connection Error
- Verify `.env` database credentials
- For SQLite, ensure `database\database.sqlite` exists
- For MySQL/PostgreSQL, ensure the database server is running

### Frontend Not Loading
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install

# Rebuild assets
npm run build
```

## Documentation

- [Backend Integration Guide](COMPLETE_BACKEND_INTEGRATION_GUIDE.md)
- [Backup System Documentation](BACKUP_SYSTEM_DOCUMENTATION.md)
- [Backup Quick Start](BACKUP_QUICK_START.md)
- [Dynamic Timeline Implementation](DYNAMIC_TIMELINE_IMPLEMENTATION.md)
- [RDD Analytics Implementation](RDD_ANALYTICS_IMPLEMENTATION.md)

## Tech Stack

- **Backend**: Laravel 12, PHP 8.2+
- **Frontend**: React 18, Inertia.js 2.0
- **Styling**: Tailwind CSS 3
- **Build Tool**: Vite 7
- **Database**: SQLite (default) / MySQL / PostgreSQL
- **Icons**: Lucide React, React Icons

## License

This project is built on the Laravel framework, which is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
