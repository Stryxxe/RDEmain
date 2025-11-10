# Network Access Authentication Fix

## Problem
When accessing the site from another device on the same network, users were getting logged out and experiencing 401/419 errors.

## Root Cause
1. Sanctum's `EnsureFrontendRequestsAreStateful` middleware only allows specific domains/IPs listed in config
2. Session cookies weren't being recognized for network IP addresses
3. CORS wasn't configured to allow all local network IPs dynamically

## Solution Applied

### 1. Custom Middleware for Network IPs
Created `app/Http/Middleware/CustomEnsureFrontendRequestsAreStateful.php` that:
- Extends Sanctum's middleware
- Automatically allows local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- Works alongside the standard Sanctum domain list

### 2. Updated CORS Configuration
Modified `config/cors.php` to:
- Add pattern matching for local network IPs
- Allow any 192.168.x.x, 10.x.x.x, or 172.16-31.x.x IP addresses

### 3. Session Configuration
- Set `SESSION_SAME_SITE` to 'lax' (works for same-site requests)
- `SESSION_DOMAIN` remains null (allows cookies to work with IP addresses)

### 4. Updated Middleware Stack
Modified `bootstrap/app.php` to use the custom middleware instead of the standard Sanctum middleware.

## How to Use

1. **Start the server with network binding:**
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```

2. **Start Vite:**
   ```bash
   npm run dev
   ```

3. **Access from other devices:**
   - Use your network IP: `http://192.168.1.38:8000`
   - The authentication should now work properly

## Important Notes

- **Session Domain**: Keep `SESSION_DOMAIN` as `null` in `.env` (or don't set it) to allow cookies with IP addresses
- **SameSite**: Using 'lax' which works for same-site requests (including network IPs on the same network)
- **Security**: This configuration is for development only. For production, use proper domain names with HTTPS

## Testing

1. Clear your browser cache and cookies on the other device
2. Access `http://192.168.1.38:8000` from the other device
3. Log in - the session should persist
4. Navigate around - API calls should work without 401 errors

## If Issues Persist

1. Check that both servers are running (Laravel on 8000, Vite on 5177)
2. Verify firewall allows ports 8000 and 5177
3. Check browser console for cookie-related errors
4. Ensure you're using the network IP, not localhost, from the other device
5. Clear browser cache and cookies on the other device

