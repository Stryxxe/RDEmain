import axios from 'axios';

const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

let cachedSettings = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all settings from the backend
 */
export const fetchSettings = async (forceRefresh = false) => {
    const now = Date.now();
    
    // Return cached settings if available and not expired
    if (!forceRefresh && cachedSettings && (now - lastFetchTime < CACHE_DURATION)) {
        return cachedSettings;
    }

    try {
        const response = await axiosInstance.get('/settings');
        if (response.data.success) {
            cachedSettings = response.data.data;
            lastFetchTime = now;
            return cachedSettings;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return null;
    }
};

/**
 * Get allowed file types from settings
 * Returns a string like ".pdf,.doc,.docx"
 */
export const getAllowedFileTypes = async () => {
    const settings = await fetchSettings();
    return settings?.allowed_file_types || '.pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg';
};

/**
 * Get max file size from settings (in MB)
 */
export const getMaxFileSize = async () => {
    const settings = await fetchSettings();
    return parseInt(settings?.max_file_size || '20', 10);
};

/**
 * Update settings (admin only)
 */
export const updateSettings = async (settings) => {
    try {
        const response = await axiosInstance.put('/settings', {
            settings
        });
        
        if (response.data.success) {
            // Clear cache after update
            cachedSettings = null;
            lastFetchTime = 0;
            return { success: true, message: response.data.message };
        }
        
        return { success: false, message: response.data.message || 'Failed to update settings' };
    } catch (error) {
        console.error('Failed to update settings:', error);
        return { 
            success: false, 
            message: error.response?.data?.message || 'Failed to update settings' 
        };
    }
};

/**
 * Clear settings cache (useful when logging out or switching users)
 */
export const clearSettingsCache = () => {
    cachedSettings = null;
    lastFetchTime = 0;
};
