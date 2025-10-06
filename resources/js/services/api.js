// API Service for ProponentView
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || window.location.origin;
const API_BASE_URL = `${API_ORIGIN}/api`;

class ApiService {
  constructor() { 
    this.baseURL = API_BASE_URL;
    this.csrfToken = null;
    this.csrfInitialized = false;
  }

  // Initialize CSRF protection using Sanctum
  async initializeCsrf() {
    if (this.csrfInitialized) {
      return;
    }
    
    try {
      // Get the CSRF cookie from Sanctum (this sets the XSRF-TOKEN cookie)
      await fetch(`${this.baseURL}/sanctum/csrf-cookie`, {
        method: 'GET',
        credentials: 'include'
      });
      
      // Also get the CSRF token from the web middleware
      const response = await fetch(`${this.baseURL}/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrf_token;
      }
      
      this.csrfInitialized = true;
    } catch (error) {
      console.warn('CSRF initialization failed:', error);
      this.csrfInitialized = true; // Set to true to prevent infinite retries
    }
  }

  // Ensure CSRF is initialized before making requests
  async ensureCsrfInitialized() {
    if (!this.csrfInitialized) {
      await this.initializeCsrf();
    }
  }

  // Get CSRF token from cookies (XSRF-TOKEN is encrypted by Laravel)
  getCsrfTokenFromCookie() {
    const name = 'XSRF-TOKEN=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return null;
  }

  // Get CSRF token from Laravel session cookie
  getCsrfTokenFromSession() {
    const name = 'laravel_session=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return null;
  }

  // Get CSRF token from meta tag (fallback)
  getCsrfTokenFromMeta() {
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    return metaToken;
  }

  // Get CSRF token
  async getCsrfToken() {
    if (!this.csrfInitialized) {
      await this.initializeCsrf();
    }
    
    // Primary: Use the CSRF token from the API call
    if (this.csrfToken) {
      return this.csrfToken;
    }
    
    // Fallback: Use XSRF-TOKEN cookie (Sanctum's method)
    const xsrfToken = this.getCsrfTokenFromCookie();
    if (xsrfToken) {
      return xsrfToken;
    }
    
    // Check if we have a session cookie (indicates session is active)
    const sessionToken = this.getCsrfTokenFromSession();
    if (sessionToken) {
      // If we have a session, try to get CSRF token from meta tag
      const metaToken = this.getCsrfTokenFromMeta();
      if (metaToken) {
        return metaToken;
      }
    }
    
    // Last resort: Use meta tag
    const metaToken = this.getCsrfTokenFromMeta();
    return metaToken;
  }

  // Helper method to get headers
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }
  // Helper method to handle responses
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }
    
    return data;
  }

  // Get current user
  async getCurrentUser() {
    try {
      await this.initializeCsrf();
      
      const response = await fetch(`${this.baseURL}/user`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getHeaders()
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateUser(userData) {
    try {
      await this.ensureCsrfInitialized();
      const csrfToken = await this.getCsrfToken();
      const xsrfToken = this.getCsrfTokenFromCookie();
      
      const headers = this.getHeaders();
      if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
      } else if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
      }
      
      const response = await fetch(`${this.baseURL}/user`, {
        method: 'PUT',
        credentials: 'include',
        headers: headers,
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
      // Ensure CSRF is initialized
      await this.ensureCsrfInitialized();
      
      const formData = new FormData();
      
      // Add basic fields
      formData.append('researchTitle', proposalData.reportTitle);
      formData.append('description', proposalData.description);
      formData.append('objectives', proposalData.objectives);
      formData.append('researchCenter', proposalData.researchCenter);
      formData.append('proposedBudget', proposalData.proposedBudget);
      
      // Add arrays as JSON strings
      formData.append('researchAgenda', JSON.stringify(proposalData.researchAgenda));
      formData.append('dostSPs', JSON.stringify(proposalData.dostSPs));
      formData.append('sustainableDevelopmentGoals', JSON.stringify(proposalData.sustainableDevelopmentGoals));
      
      // Add files
      if (proposalData.reportFile) {
        formData.append('reportFile', proposalData.reportFile);
      }
      if (proposalData.setiScorecard) {
        formData.append('setiScorecard', proposalData.setiScorecard);
      }
      if (proposalData.gadCertificate) {
        formData.append('gadCertificate', proposalData.gadCertificate);
      }
      if (proposalData.matrixOfCompliance) {
        formData.append('matrixOfCompliance', proposalData.matrixOfCompliance);
      }

      // Get CSRF token
      const csrfToken = await this.getCsrfToken();
      const xsrfToken = this.getCsrfTokenFromCookie();
      const token = localStorage.getItem('token');
      
      // Prepare headers with CSRF token
      const headers = {
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };
      
      // Add CSRF token to headers if available
      if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
      } else if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
      }
      
      console.log('Submitting proposal with headers:', headers);
      console.log('CSRF Token:', csrfToken);
      console.log('XSRF Token:', xsrfToken);
      
      const response = await fetch(`${this.baseURL}/proposals`, {
        method: 'POST',
        credentials: 'include',
        headers: headers,
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Proposal submission failed:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Proposal submission error:', error);
      throw error;
    }
  }

  // Get all proposals
  async getProposals() {
    try {
      const response = await fetch(`${this.baseURL}/proposals`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getHeaders()
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Get single proposal
  async getProposal(id) {
    try {
      
      const response = await fetch(`${this.baseURL}/proposals/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      
      const data = await this.handleResponse(response);
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Update proposal
  async updateProposal(id, proposalData) {
    try {
      await this.ensureCsrfInitialized();
      const csrfToken = await this.getCsrfToken();
      const xsrfToken = this.getCsrfTokenFromCookie();
      
      const headers = this.getHeaders();
      if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
      } else if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
      }
      
      const response = await fetch(`${this.baseURL}/proposals/${id}`, {
        method: 'PUT',
        headers: headers,
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
      await this.ensureCsrfInitialized();
      const csrfToken = await this.getCsrfToken();
      const xsrfToken = this.getCsrfTokenFromCookie();
      
      const headers = this.getHeaders();
      if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
      } else if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
      }
      
      const response = await fetch(`${this.baseURL}/proposals/${id}`, {
        method: 'DELETE',
        headers: headers,
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
        headers: this.getHeaders()
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
        headers: this.getHeaders()
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Send message
  async sendMessage(messageData) {
    try {
      await this.ensureCsrfInitialized();
      const csrfToken = await this.getCsrfToken();
      const xsrfToken = this.getCsrfTokenFromCookie();
      
      const headers = this.getHeaders();
      if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
      } else if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
      }
      
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: headers,
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
        headers: this.getHeaders(),
        credentials: 'include'
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  async post(url, data = null) {
    try {
      await this.ensureCsrfInitialized();
      const csrfToken = await this.getCsrfToken();
      const xsrfToken = this.getCsrfTokenFromCookie();
      
      const headers = this.getHeaders();
      if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
      } else if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
      }
      
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: headers,
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
      await this.ensureCsrfInitialized();
      const csrfToken = await this.getCsrfToken();
      const xsrfToken = this.getCsrfTokenFromCookie();
      
      const headers = this.getHeaders();
      if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
      } else if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
      }
      
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'PUT',
        headers: headers,
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
      await this.ensureCsrfInitialized();
      const csrfToken = await this.getCsrfToken();
      const xsrfToken = this.getCsrfTokenFromCookie();
      
      const headers = this.getHeaders();
      if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
      } else if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
      }
      
      const response = await fetch(`${this.baseURL}/endorsements`, {
        method: 'POST',
        headers: headers,
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
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
        credentials: 'include'
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  async delete(url) {
    try {
      await this.ensureCsrfInitialized();
      const csrfToken = await this.getCsrfToken();
      const xsrfToken = this.getCsrfTokenFromCookie();
      
      const headers = this.getHeaders();
      if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
      } else if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
      }
      
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'DELETE',
        headers: headers,
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