import axios from 'axios';

/**
 * OCR Service - Frontend API client for OCR document processing
 * Communicates with Laravel backend OCR endpoints
 */

const createAxiosInstance = () => {
    return axios.create({
        baseURL: '/api',
        headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
        },
        withCredentials: true,
    });
};

/**
 * Process research proposal PDF and extract fields using OCR
 * 
 * @param {File} file - PDF file to process
 * @param {Function} onProgress - Callback for upload progress (0-100)
 * @returns {Promise} Response with extracted data
 */
export const processProposalOCR = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('proposal_file', file);

    try {
        const response = await createAxiosInstance().post('/ocr/process-proposal', formData, {
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                if (onProgress) {
                    onProgress(percentCompleted);
                }
            },
        });

        return response.data;
    } catch (error) {
        console.error('OCR Processing Error:', error);
        throw error.response?.data || error;
    }
};

/**
 * Test OCR functionality with a sample file
 * 
 * @param {File} file - Test file (PDF, JPG, or PNG)
 * @returns {Promise} Test result
 */
export const testOCR = async (file) => {
    const formData = new FormData();
    formData.append('test_file', file);

    try {
        const response = await createAxiosInstance().post('/ocr/test', formData);
        return response.data;
    } catch (error) {
        console.error('OCR Test Error:', error);
        throw error.response?.data || error;
    }
};

/**
 * Get OCR backend status
 * 
 * @returns {Promise} Backend status information
 */
export const getOCRStatus = async () => {
    try {
        const response = await axios.get('/api/ocr/status');
        return response.data;
    } catch (error) {
        console.error('OCR Status Error:', error);
        throw error.response?.data || error;
    }
};
