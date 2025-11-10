import axios from 'axios';
window.axios = axios;

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
