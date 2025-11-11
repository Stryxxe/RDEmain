// API Service for ProponentView
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || window.location.origin;
const API_BASE_URL = `${API_ORIGIN}/api`;

class ApiService {
  constructor() { 
    this.baseURL = API_BASE_URL;
  }

  // Get CSRF token from Inertia's meta tag
  // Inertia automatically provides the CSRF token in the meta tag
  getCsrfToken() {
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    return metaToken || null;
  }

  // Helper method to get headers with CSRF token from Inertia
  // Using session-based auth, so no bearer tokens needed
  getHeaders(includeCsrf = true) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Add CSRF token from Inertia's meta tag for all requests
    if (includeCsrf) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
      }
    }
    
    return headers;
  }
  // Helper method to handle responses
  async handleResponse(response) {
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      // Clear any stored auth data
      localStorage.removeItem('dismissedNotifications');
      
      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      throw new Error('Unauthenticated. Please log in again.');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.baseURL}/user`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getHeaders(false) // GET requests don't need CSRF
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateUser(userData) {
    try {
      const response = await fetch(`${this.baseURL}/user`, {
        method: 'PUT',
        credentials: 'include',
        headers: this.getHeaders(true), // PUT requests need CSRF
        body: JSON.stringify(userData)
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Create proposal
  async createProposal(proposalData) {
    try {
      const formData = new FormData();
      
      // Add basic fields
      formData.append('researchTitle', proposalData.reportTitle);
      formData.append('description', proposalData.description);
      formData.append('objectives', proposalData.objectives);
      // Get researchCenter from user's department or use provided value
      const researchCenter = proposalData.researchCenter || proposalData.user?.department?.name || 'Not specified';
      formData.append('researchCenter', researchCenter);
      formData.append('proposedBudget', proposalData.proposedBudget);
      
      // Add arrays as JSON strings
      formData.append('researchAgenda', JSON.stringify(proposalData.researchAgenda));
      formData.append('dostSPs', JSON.stringify(proposalData.dostSPs));
      formData.append('sustainableDevelopmentGoals', JSON.stringify(proposalData.sustainableDevelopmentGoals));
      
      // Add files - only append if file exists, is a valid File object, and has valid size
      const isValidFile = (file) => {
        if (!file) return false;
        if (!(file instanceof File)) {
          console.warn('Invalid file object:', typeof file, file);
          return false;
        }
        if (file.size === 0) {
          console.warn('File is empty:', file.name);
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          console.warn('File exceeds 5MB limit:', file.name, (file.size / 1024 / 1024).toFixed(2) + 'MB');
          return false;
        }
        return true;
      };
      
      if (isValidFile(proposalData.reportFile)) {
        formData.append('reportFile', proposalData.reportFile);
      } else if (!proposalData.reportFile) {
        console.warn('reportFile is missing or invalid');
      }
      
      if (isValidFile(proposalData.setiScorecard)) {
        formData.append('setiScorecard', proposalData.setiScorecard);
      }
      
      if (isValidFile(proposalData.gadCertificate)) {
        formData.append('gadCertificate', proposalData.gadCertificate);
      }
      
      // Only append matrixOfCompliance if it's a valid file
      // Don't append if it's null, undefined, or invalid
      if (isValidFile(proposalData.matrixOfCompliance)) {
        formData.append('matrixOfCompliance', proposalData.matrixOfCompliance);
      } else {
        // Explicitly log if matrixOfCompliance is being skipped
        if (proposalData.matrixOfCompliance !== null && proposalData.matrixOfCompliance !== undefined) {
          console.warn('matrixOfCompliance file is invalid and will not be sent:', {
            type: typeof proposalData.matrixOfCompliance,
            isFile: proposalData.matrixOfCompliance instanceof File,
            size: proposalData.matrixOfCompliance?.size,
            name: proposalData.matrixOfCompliance?.name
          });
        }
      }
      
      // Debug: Log what files are being sent (only in development)
      if (!import.meta.env.PROD) {
        const logFileInfo = (file, name) => {
          if (!file) return null;
          if (!(file instanceof File)) {
            console.warn(`${name} is not a File object:`, typeof file, file);
            return { error: 'Not a File object', type: typeof file };
          }
          return { 
            name: file.name, 
            size: file.size, 
            sizeMB: (file.size / 1024 / 1024).toFixed(2),
            type: file.type 
          };
        };
        
        console.log('Files being sent:', {
          reportFile: logFileInfo(proposalData.reportFile, 'reportFile'),
          setiScorecard: logFileInfo(proposalData.setiScorecard, 'setiScorecard'),
          gadCertificate: logFileInfo(proposalData.gadCertificate, 'gadCertificate'),
          matrixOfCompliance: logFileInfo(proposalData.matrixOfCompliance, 'matrixOfCompliance')
        });
      }

      // Use window.axios if available (properly configured with session cookies)
      // Otherwise fall back to fetch
      if (window.axios) {
        try {
          // Don't set Content-Type for FormData - axios will set it automatically with boundary
          const response = await window.axios.post('/proposals', formData, {
            headers: {
              'Accept': 'application/json'
            },
            withCredentials: true
          });
          
          return response.data;
        } catch (axiosError) {
          // Handle axios errors
          if (axiosError.response) {
            const errorData = axiosError.response.data;
            console.error('Proposal submission failed:', errorData);
            
            // Handle 401 specifically
            if (axiosError.response.status === 401) {
              // Clear any stored auth data
              localStorage.removeItem('dismissedNotifications');
              
              // Redirect to login page
              if (window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
              
              throw new Error('Unauthenticated. Please log in again.');
            }
            
            // Include validation errors in the error message for 422
            if (axiosError.response.status === 422 && errorData.errors) {
              const errorMessages = Object.entries(errorData.errors)
                .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('; ');
              throw new Error(`Validation failed: ${errorMessages}`);
            }
            
            throw new Error(errorData.message || `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`);
          }
          throw axiosError;
        }
      } else {
        // Fallback to fetch if axios is not available
        const csrfToken = this.getCsrfToken();
        const headers = {
          'Accept': 'application/json',
          ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken })
        };
        
        const response = await fetch(`${this.baseURL}/proposals`, {
          method: 'POST',
          credentials: 'include',
          headers: headers,
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Proposal submission failed:', errorData);
          
          // Handle 401 specifically
          if (response.status === 401) {
            localStorage.removeItem('dismissedNotifications');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            throw new Error('Unauthenticated. Please log in again.');
          }
          
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await this.handleResponse(response);
      }
    } catch (error) {
      console.error('Proposal submission error:', error);
      throw error;
    }
  }

  // Get all proposals
  async getProposals() {
    try {
      // Use window.axios if available (properly configured with session cookies)
      if (window.axios) {
        try {
          const response = await window.axios.get('/proposals', {
            headers: {
              'Accept': 'application/json'
            },
            withCredentials: true
          });
          
          return response.data;
        } catch (axiosError) {
          // Handle axios errors
          if (axiosError.response) {
            const errorData = axiosError.response.data;
            
            // Handle 401 specifically
            if (axiosError.response.status === 401) {
              localStorage.removeItem('dismissedNotifications');
              if (window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
              throw new Error('Unauthenticated. Please log in again.');
            }
            
            throw new Error(errorData.message || `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`);
          }
          throw axiosError;
        }
      } else {
        // Fallback to fetch if axios is not available
        const response = await fetch(`${this.baseURL}/proposals`, {
          method: 'GET',
          credentials: 'include',
          headers: this.getHeaders(false) // GET requests don't need CSRF
        });
        
        return await this.handleResponse(response);
      }
    } catch (error) {
      throw error;
    }
  }

  // Get single proposal
  async getProposal(id) {
    try {
      // Use window.axios if available (properly configured with session cookies)
      if (window.axios) {
        try {
          const response = await window.axios.get(`/proposals/${id}`, {
            headers: {
              'Accept': 'application/json'
            },
            withCredentials: true
          });
          
          return response.data;
        } catch (axiosError) {
          // Handle axios errors
          if (axiosError.response) {
            const errorData = axiosError.response.data;
            
            // Handle 401 specifically
            if (axiosError.response.status === 401) {
              localStorage.removeItem('dismissedNotifications');
              if (window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
              throw new Error('Unauthenticated. Please log in again.');
            }
            
            throw new Error(errorData.message || `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`);
          }
          throw axiosError;
        }
      } else {
        // Fallback to fetch if axios is not available
        const response = await fetch(`${this.baseURL}/proposals/${id}`, {
          method: 'GET',
          credentials: 'include',
          headers: this.getHeaders(false) // GET requests don't need CSRF
        });
        
        const data = await this.handleResponse(response);
        return data;
      }
    } catch (error) {
      throw error;
    }
  }

  // Update proposal
  async updateProposal(id, proposalData) {
    try {
      const response = await fetch(`${this.baseURL}/proposals/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(true), // PUT requests need CSRF
        body: JSON.stringify(proposalData),
        credentials: 'include'
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Delete proposal
  async deleteProposal(id) {
    try {
      const response = await fetch(`${this.baseURL}/proposals/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(true), // DELETE requests need CSRF
        credentials: 'include'
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Get notifications
  async getNotifications() {
    try {
      const response = await fetch(`${this.baseURL}/notifications`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getHeaders(false) // GET requests don't need CSRF
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Get messages
  async getMessages() {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getHeaders(false) // GET requests don't need CSRF
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Send message
  async sendMessage(messageData) {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: this.getHeaders(true), // POST requests need CSRF
        body: JSON.stringify(messageData),
        credentials: 'include'
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Generic HTTP methods for compatibility with components
  async get(url) {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'GET',
        headers: this.getHeaders(false), // GET requests don't need CSRF
        credentials: 'include'
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  async post(url, data = null) {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: this.getHeaders(true), // POST requests need CSRF
        body: data ? JSON.stringify(data) : null,
        credentials: 'include'
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  async put(url, data = null) {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'PUT',
        headers: this.getHeaders(true), // PUT requests need CSRF
        body: data ? JSON.stringify(data) : null,
        credentials: 'include'
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Create endorsement
  async createEndorsement(endorsementData) {
    try {
      const response = await fetch(`${this.baseURL}/endorsements`, {
        method: 'POST',
        headers: this.getHeaders(true), // POST requests need CSRF
        credentials: 'include',
        body: JSON.stringify(endorsementData)
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Get endorsements
  async getEndorsements() {
    try {
      const response = await fetch(`${this.baseURL}/endorsements`, {
        method: 'GET',
        headers: this.getHeaders(false), // GET requests don't need CSRF
        credentials: 'include'
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Get endorsements by proposal
  async getEndorsementsByProposal(proposalId) {
    try {
      const response = await fetch(`${this.baseURL}/endorsements/proposal/${proposalId}`, {
        method: 'GET',
        headers: this.getHeaders(false), // GET requests don't need CSRF
        credentials: 'include'
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  async delete(url) {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'DELETE',
        headers: this.getHeaders(true), // DELETE requests need CSRF
        credentials: 'include'
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;