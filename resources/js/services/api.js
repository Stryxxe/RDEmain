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
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
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

      // Prepare headers with CSRF token from Inertia
      // Using session-based auth, so no bearer tokens needed
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
        headers: this.getHeaders(false) // GET requests don't need CSRF
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
        credentials: 'include',
        headers: this.getHeaders(false) // GET requests don't need CSRF
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