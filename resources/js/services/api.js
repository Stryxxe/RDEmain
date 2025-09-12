// API Service for ProponentView
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() { 
    this.baseURL = API_BASE_URL;
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
w
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
        headers: this.getHeaders()
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching current user:', error);
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

      const response = await fetch(`${this.baseURL}/proposals`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(localStorage.getItem('token') && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        },
        body: formData
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    }
  }

  // Get all proposals
  async getProposals() {
    try {
      const response = await fetch(`${this.baseURL}/proposals`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching proposals:', error);
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
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching proposal:', error);
      throw error;
    }
  }

  // Update proposal
  async updateProposal(id, proposalData) {
    try {
      const response = await fetch(`${this.baseURL}/proposals/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(proposalData)
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating proposal:', error);
      throw error;
    }
  }

  // Delete proposal
  async deleteProposal(id) {
    try {
      const response = await fetch(`${this.baseURL}/proposals/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting proposal:', error);
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
      console.error('Error fetching notifications:', error);
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
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send message
  async sendMessage(messageData) {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(messageData)
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;