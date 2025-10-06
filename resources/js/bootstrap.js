import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// Ensure axios hits the correct API host across origins
// Set axios base URL to include /api for proper API routing
window.axios.defaults.baseURL = `${import.meta.env.VITE_API_ORIGIN || window.location.origin}/api`;
// Attach bearer token automatically if present
window.axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');                        
    if (token && !config.headers?.Authorization) {
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
    }
    // Include credentials by default except for auth endpoints that should be stateless
    const url = (config.url || '').toString();
    const isAuthEndpoint = url.endsWith('/login') || url.endsWith('/logout');
    if (!isAuthEndpoint) {
        config.withCredentials = true;
    }
    return config;
});
