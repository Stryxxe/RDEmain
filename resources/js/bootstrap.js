import axios from 'axios';

window.axios = axios;

// Lazy load customAlert - only initialize when needed
window.customAlert = async (message, title = null, autoClose = null) => {
  const { customAlert } = await import('./utils/alert');
  return customAlert(message, title, autoClose);
};

// Lazy load customConfirm - only initialize when needed
window.customConfirm = async (message, title = null) => {
  const { customConfirm } = await import('./utils/confirm');
  return customConfirm(message, title);
};

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// Ensure axios hits the correct API host across origins
// Set axios base URL to include /api for proper API routing
// Use window.location.origin to ensure cookie domain matches
// This is critical for session cookies to work properly
window.axios.defaults.baseURL = `${window.location.origin}/api`;
// CRITICAL: Set withCredentials at the defaults level, not just in interceptor
window.axios.defaults.withCredentials = true;

// In production, silence noisy console output from leftover debug statements
if (import.meta && import.meta.env && import.meta.env.PROD) {
    const noop = () => {};
    // Preserve error in production unless you want it silenced as well
    console.log = noop;
    console.warn = noop;
}
// Attach CSRF token automatically for all requests
// Since we're using Inertia with session-based auth, we don't need bearer tokens
window.axios.interceptors.request.use((config) => {
    // Add CSRF token from Inertia's meta tag for all requests
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
        config.headers = { ...(config.headers || {}), 'X-CSRF-TOKEN': csrfToken };
    }
    
    // CRITICAL: Ensure credentials (cookies) are included for all requests
    // This must be set both in defaults and in each request config
    config.withCredentials = true;
    
    // Disable caching for all requests to ensure fresh data
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
    
    // Debug: Log if cookies are being sent (only in development)
    if (!import.meta.env.PROD) {
        console.debug('Axios request config:', {
            url: config.url,
            baseURL: config.baseURL,
            withCredentials: config.withCredentials,
            headers: config.headers
        });
    }
    
    return config;
});

// Global response interceptor to handle 401 errors and prevent redirect loops
let isRedirecting = false;
let redirectTimeout = null;
let lastRedirectTime = 0;
const REDIRECT_COOLDOWN = 3000; // 3 seconds cooldown between redirects

window.axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only handle 401 errors
        if (error.response && error.response.status === 401) {
            const currentPath = window.location.pathname;
            const now = Date.now();
            
            // Prevent redirect loops:
            // 1. Don't redirect if already on login page
            // 2. Don't redirect if already redirecting
            // 3. Don't redirect if we just redirected recently (cooldown)
            if (currentPath === '/login' || isRedirecting || (now - lastRedirectTime < REDIRECT_COOLDOWN)) {
                return Promise.reject(error);
            }
            
            // Skip redirect for certain endpoints if we're already authenticated (might be a temporary issue)
            // This prevents redirect loops when the user is authenticated but a specific endpoint fails
            const skipRedirectEndpoints = ['/user', '/project-roles/active'];
            const shouldSkipRedirect = error.config && error.config.url && 
                skipRedirectEndpoints.some(endpoint => error.config.url.includes(endpoint));
            
            if (shouldSkipRedirect) {
                // Check if we have user data in the page props (Inertia)
                // Inertia stores page data in window.__INERTIA__ or we can check localStorage
                try {
                    const inertiaData = window.__INERTIA__?.page?.props;
                    if (inertiaData?.auth?.user) {
                        // User is authenticated, this might be a temporary API issue or permission problem
                        // Don't redirect, just reject the error
                        if (!import.meta.env.PROD) {
                            console.warn(`401 error on ${error.config.url} but user appears authenticated. Not redirecting.`);
                        }
                        return Promise.reject(error);
                    }
                } catch (e) {
                    // If we can't check, proceed with redirect
                }
            }
            
            // Set redirect flag to prevent multiple redirects
            isRedirecting = true;
            lastRedirectTime = now;
            
            // Clear any stored auth data
            localStorage.removeItem('dismissedNotifications');
            
            // Clear redirect flag after a delay to allow navigation
            if (redirectTimeout) {
                clearTimeout(redirectTimeout);
            }
            redirectTimeout = setTimeout(() => {
                isRedirecting = false;
            }, REDIRECT_COOLDOWN);
            
            // Use window.location.href for reliable redirect
            // This ensures a full page reload which clears any state issues
            window.location.href = '/login';
        }
        
        return Promise.reject(error);
    }
);
