import axios from 'axios';

const axiosInstance = window.axios || axios;

if (!window.axios) {
  axiosInstance.defaults.withCredentials = true;
  axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

/**
 * Update a proposal (CM and RDD can edit proposals)
 * @param {number} proposalId - The proposal ID
 * @param {Object} data - The update data
 * @returns {Promise} - The API response
 */
export const updateProposal = async (proposalId, data) => {
  try {
    // If file is included, use FormData
    const hasFile = data.updatedForm && data.updatedForm instanceof File;
    
    let payload;
    let headers = { 'Accept': 'application/json' };
    
    if (hasFile) {
      payload = new FormData();
      
      // Append all fields to FormData
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          if (Array.isArray(data[key])) {
            // For arrays, append each item or JSON stringify
            payload.append(key, JSON.stringify(data[key]));
          } else if (data[key] instanceof File) {
            payload.append(key, data[key]);
          } else {
            payload.append(key, data[key]);
          }
        }
      });
      
      headers['Content-Type'] = 'multipart/form-data';
    } else {
      payload = data;
      headers['Content-Type'] = 'application/json';
    }

    const response = await axiosInstance.put(`/proposals/${proposalId}`, payload, {
      headers,
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating proposal:', error);
    throw error;
  }
};

/**
 * Get a specific proposal by ID
 * @param {number} proposalId - The proposal ID
 * @returns {Promise} - The API response
 */
export const getProposal = async (proposalId) => {
  try {
    const response = await axiosInstance.get(`/proposals/${proposalId}`, {
      headers: { 'Accept': 'application/json' },
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching proposal:', error);
    throw error;
  }
};

export default {
  updateProposal,
  getProposal
};
