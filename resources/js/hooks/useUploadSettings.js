import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Hook to fetch dynamic upload settings from the backend
 * Returns max file size and allowed file types configured by admin
 */
export const useUploadSettings = () => {
    const [settings, setSettings] = useState({
        maxFileSizeMB: 20, // Default 20MB
        maxFileSizeKB: 20480,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'xlsx', 'csv', 'png', 'jpg'],
        loading: true,
        error: null,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Use window.axios if available (has baseURL configured), otherwise use axios
                const axiosInstance = window.axios || axios;
                const response = await axiosInstance.get('/upload-settings', {
                    headers: { Accept: 'application/json' },
                    withCredentials: true,
                });
                
                setSettings({
                    maxFileSizeMB: response.data.maxFileSizeMB || 20,
                    maxFileSizeKB: response.data.maxFileSizeKB || 20480,
                    allowedFileTypes: response.data.allowedFileTypes || ['pdf', 'doc', 'docx', 'xlsx', 'csv', 'png', 'jpg'],
                    loading: false,
                    error: null,
                });
            } catch (error) {
                console.error('Failed to fetch upload settings:', error);
                // Use defaults on error
                setSettings(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Failed to load settings, using defaults',
                }));
            }
        };

        fetchSettings();
    }, []);

    return settings;
};
