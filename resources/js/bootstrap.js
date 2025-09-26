import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// Ensure axios hits the correct API host across origins
// Set axios base origin (no trailing /api) to avoid double "/api" paths
window.axios.defaults.baseURL = import.meta.env.VITE_API_ORIGIN || window.location.origin;
// Attach bearer token automatically if present
window.axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');                        
    if (token && !config.headers?.Authorization) {
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
    }
    return config;
});
