# Proponent View Integration

This document describes the integration of the reference proponent view with the backend system.

## Overview

The proponent view has been successfully integrated with the Laravel backend, providing a complete research proposal management system for proponents.

## Features Implemented

### 1. Backend API
- **ProposalController**: Handles CRUD operations for research proposals
- **API Routes**: RESTful endpoints for proposal management
- **Models**: Proposal, File, Status, Review, Decision, Endorsement models
- **File Upload**: Support for multiple file types (PDF, DOC, DOCX)

### 2. Frontend Components
- **Dashboard**: Statistics and recent proposals overview
- **Submit Page**: Complete proposal submission form with validation
- **Projects Page**: List and search all user proposals
- **Proposal Detail**: Detailed view of individual proposals
- **Resources Page**: Downloadable forms and guidelines
- **Account Page**: User profile management
- **Notifications**: Message and notification system
- **Messages**: Communication with reviewers and administrators

### 3. Key Features
- **File Upload**: Drag-and-drop file upload with validation
- **Form Validation**: Client-side and server-side validation
- **Search & Filter**: Advanced search and filtering capabilities
- **Status Tracking**: Real-time proposal status updates
- **Responsive Design**: Mobile-friendly interface
- **Authentication**: Secure API authentication with Laravel Sanctum

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Proposals
- `GET /api/proposals` - List user proposals
- `POST /api/proposals` - Create new proposal
- `GET /api/proposals/{id}` - Get proposal details
- `PUT /api/proposals/{id}` - Update proposal
- `DELETE /api/proposals/{id}` - Delete proposal
- `GET /api/proposals/statistics` - Get proposal statistics

## File Structure

```
resources/js/
├── Pages/RoleViews/ProponentView.jsx (Main component)
├── services/api.js (API service)
└── reference/proponentview/src/
    ├── components/ (Reusable components)
    └── pages/ (Page components)

app/Http/Controllers/
└── ProposalController.php (Main API controller)

app/Models/
├── Proposal.php
├── File.php
├── Status.php
├── Review.php
├── Decision.php
└── Endorsement.php
```

## Setup Instructions

1. **Run Migrations**:
   ```bash
   php artisan migrate
   ```

2. **Seed Database**:
   ```bash
   php artisan db:seed
   ```

3. **Build Frontend**:
   ```bash
   npm run build
   ```

4. **Start Development Server**:
   ```bash
   php artisan serve
   ```

## Usage

1. **Login**: Use the authentication system to login as a proponent
2. **Dashboard**: View statistics and recent proposals
3. **Submit Proposal**: Use the comprehensive form to submit new proposals
4. **Manage Projects**: View, search, and manage existing proposals
5. **Track Progress**: Monitor proposal status and progress
6. **Communicate**: Use the messaging system for communication

## Technical Details

### Authentication
- Uses Laravel Sanctum for API authentication
- Token-based authentication for frontend
- Automatic token management in API service

### File Handling
- Files stored in `storage/app/public/proposals/`
- Support for multiple file types
- File size validation (10MB max)
- Secure file access

### Database Schema
- Proposals table with JSON matrix of compliance
- Files table for file management
- Status tracking system
- User relationships and permissions

### Frontend Architecture
- React Router for navigation
- Context API for state management
- Axios for API calls
- Tailwind CSS for styling
- Responsive design patterns

## Security Features

- CSRF protection
- File upload validation
- Input sanitization
- Authentication middleware
- Role-based access control

## Future Enhancements

- Real-time notifications
- Advanced reporting
- Document collaboration
- Email notifications
- Mobile app support
- Advanced analytics

## Troubleshooting

### Common Issues

1. **File Upload Errors**: Check file size and type restrictions
2. **Authentication Issues**: Verify token storage and API endpoints
3. **Database Errors**: Ensure migrations are run and database is seeded
4. **Frontend Build Issues**: Check for missing dependencies

### Debug Mode

Enable debug mode in `.env`:
```
APP_DEBUG=true
LOG_LEVEL=debug
```

## Support

For technical support or questions about the integration, please refer to the Laravel and React documentation or contact the development team.
