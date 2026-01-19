# Quick Start: Testing Email System

## Prerequisites
Make sure you have:
- PHP running
- Laravel server running
- Node.js/npm (for frontend)

---

## Step 1: Verify Database Setup

```bash
cd c:\Users\Sun Reu\Desktop\Codes\rdeproject\RDEmain

# Check if email_templates table exists
php artisan tinker
>>> \App\Models\EmailTemplate::all();
```

Should show the account-activated template.

---

## Step 2: Configure Mail Driver (Choose One)

### Option A: Using Mailhog (Recommended for Testing)

1. **Download Mailhog**
   - Download from: https://github.com/mailhog/MailHog/releases
   - Or use: `scoop install mailhog` (if you have Scoop)

2. **Run Mailhog**
   ```bash
   MailHog.exe
   # Will start SMTP server on localhost:1025
   # Web UI at http://localhost:1025
   ```

3. **Update .env** (already done, but verify)
   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=127.0.0.1
   MAIL_PORT=1025
   MAIL_USERNAME=null
   MAIL_PASSWORD=null
   ```

4. **Start Your Laravel Server**
   ```bash
   php artisan serve
   ```

---

### Option B: Using Gmail SMTP

1. **Create App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the 16-character password

2. **Update .env**
   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_ENCRYPTION=tls
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-16-char-app-password
   MAIL_FROM_ADDRESS=your-email@gmail.com
   MAIL_FROM_NAME="Research Proposal Management System"
   ```

3. **Start Laravel Server**
   ```bash
   php artisan serve
   ```

---

### Option C: Log to File (Quick Testing)

1. **Update .env**
   ```env
   MAIL_MAILER=log
   MAIL_LOG_CHANNEL=single
   ```

2. **Check emails in logs**
   ```bash
   tail -f storage/logs/laravel.log
   ```

---

## Step 3: Test Email Sending

### Via Admin Dashboard

1. Login as Admin
2. Go to **Admin > User Management**
3. Create a new user with `pending` status (or find existing pending user)
4. Click the ✓ (checkmark) icon to approve
5. Confirm activation

### Check Email

**If using Mailhog:**
- Open http://localhost:1025 in browser
- Look for email from `boybawang141@gmail.com` to user's email
- Click to view full email content

**If using Gmail:**
- Check the recipient's inbox
- Should arrive within seconds

**If using Log:**
- Check `storage/logs/laravel.log`
- Search for "Account activation email sent"

---

## Step 4: Customize Email Template

1. Login as Admin
2. Go to **Admin > System Settings**
3. Scroll down to **Email Management** section
4. Click **Edit** on "ACCOUNT-ACTIVATED" template
5. Modify:
   - **Subject**: Change to your preferred subject
   - **Body**: Edit HTML content (keep `{user_name}`, `{login_url}` variables)
   - **Description**: Add notes
6. Click **Save Changes**
7. Test again by approving a user

---

## Step 5: Verify Everything Works

### Checklist:
- [ ] Email template shows in System Settings
- [ ] Can click Edit on template
- [ ] Modal opens with editable fields
- [ ] Can save template changes
- [ ] Admin can approve pending users
- [ ] Email is sent when user is approved
- [ ] Email contains user's name (variable replaced)
- [ ] Email contains login link

---

## Troubleshooting

### Email Not Showing Up

1. **Check mail driver in .env**
   ```bash
   grep MAIL_MAILER .env
   # Should be 'smtp' or 'log'
   ```

2. **Check if service is running**
   ```bash
   # If using Mailhog, verify running on :1025
   netstat -an | findstr 1025
   ```

3. **Check Laravel logs**
   ```bash
   tail -f storage/logs/laravel.log | findstr -i mail
   ```

4. **Clear config cache**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

### Email Template Not Loading

1. Verify database migration ran
   ```bash
   php artisan migrate:status
   ```

2. Check email templates exist in database
   ```bash
   php artisan tinker
   >>> \App\Models\EmailTemplate::count();
   ```

### Cannot Access Email Management UI

1. Verify you're logged in as Admin
2. Check System Settings page loads
3. Scroll to very bottom - Email Management section should be there
4. Check browser console for JavaScript errors
5. Verify API routes are registered
   ```bash
   php artisan route:list | findstr email-templates
   ```

---

## Email Variables Reference

When editing email templates, you can use these variables:

| Variable | Replaced With | Example |
|----------|---------------|---------|
| `{user_name}` | User's full name | John Doe |
| `{user_email}` | User's email | john@example.com |
| `{login_url}` | Login page URL | http://localhost/login |
| `{system_name}` | System name | Research Proposal Management System |
| `{current_year}` | Current year | 2026 |

### Example Usage in HTML:
```html
<p>Hello {user_name},</p>
<p>Visit <a href="{login_url}">our login page</a> to access {system_name}.</p>
<p>&copy; {current_year} All rights reserved.</p>
```

---

## Common Customizations

### Change Colors
Find in HTML body and replace:
```html
<!-- Blue header to green -->
<div style="background-color: #3b82f6;">  <!-- Change #3b82f6 to #10b981 -->
```

### Add Logo
Add after opening `<body>` tag:
```html
<img src="https://your-domain.com/logo.png" alt="Logo" style="max-width: 200px; margin-bottom: 20px;">
```

### Add Footer Info
Replace footer section:
```html
<div class="footer">
    <p>&copy; 2026 Your Organization</p>
    <p>Contact: support@example.com | Phone: 1-800-EXAMPLE</p>
</div>
```

---

## Next Steps

- [ ] Test email sending with your preferred method (Mailhog/Gmail/Log)
- [ ] Customize template to match your branding
- [ ] Test approval workflow end-to-end
- [ ] Add more email templates (password reset, notifications, etc.)
- [ ] Set up production email service (SendGrid, AWS SES, etc.)

---

**Questions?** Check the main `EMAIL_SYSTEM_IMPLEMENTATION.md` file for detailed documentation.
