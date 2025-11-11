import axios from 'axios';

class RDDService {
  constructor() {
    // Use window.axios if available (has proper config from bootstrap.js), otherwise create instance
    if (window.axios) {
      this.api = window.axios;
    } else {
      // Fallback: create a properly configured axios instance
      this.api = axios.create({
        baseURL: `${window.location.origin}/api`,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        withCredentials: true,
      });

      // Add request interceptor to include CSRF token from Inertia's meta tag
      this.api.interceptors.request.use((config) => {
        // Get CSRF token from Inertia's meta tag for all requests
        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (metaToken) {
          config.headers['X-CSRF-TOKEN'] = metaToken;
        }
        // Ensure credentials are included for session-based auth
        config.withCredentials = true;
        return config;
      });
    }
  }

  /**
   * Get RDD analytics data for statistics dashboard
   */
  async getRddAnalytics() {
    try {
      const response = await this.api.get('/proposals/rdd-analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching RDD analytics:', error);
      throw error;
    }
  }

  /**
   * Get all proposals for RDD review
   */
  async getProposalsForReview() {
    try {
      const response = await this.api.get('/proposals');
      return response.data;
    } catch (error) {
      console.error('Error fetching proposals for review:', error);
      throw error;
    }
  }

  /**
   * Get proposals that have been endorsed by CM (Center Manager)
   */
  async getCmEndorsedProposals() {
    try {
      const response = await this.api.get('/proposals/cm-endorsed');
      return response.data;
    } catch (error) {
      console.error('Error fetching CM-endorsed proposals:', error);
      throw error;
    }
  }

  /**
   * Get proposal statistics
   */
  async getProposalStatistics() {
    try {
      const response = await this.api.get('/proposals/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching proposal statistics:', error);
      throw error;
    }
  }

  /**
   * Get a specific proposal by ID
   */
  async getProposalById(id) {
    try {
      const response = await this.api.get(`/proposals/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching proposal:', error);
      throw error;
    }
  }

  /**
   * Get user profile data
   */
  async getUserProfile() {
    try {
      const response = await this.api.get('/user');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profileData) {
    try {
      const response = await this.api.put('/user', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user's projects for report submission
   */
  async getUserProjects() {
    try {
      const response = await this.api.get('/proposals');
      if (response.data.success) {
        // Transform proposals to match the expected format for report submission
        const projects = response.data.data.map(proposal => ({
          id: proposal.proposalID, // Use actual proposalID for form submission
          displayId: `PRO-2025-${String(proposal.proposalID).padStart(5, '0')}`, // For display
          title: proposal.researchTitle,
          author: proposal.user ? `${proposal.user.firstName} ${proposal.user.lastName}` : 'Unknown'
        }));
        return {
          success: true,
          data: projects
        };
      } else {
        return {
          success: false,
          message: 'Failed to fetch projects'
        };
      }
    } catch (error) {
      console.error('Error fetching user projects:', error);
      throw error;
    }
  }

  /**
   * Get endorsements for RDD review
   */
  async getEndorsements() {
    try {
      const response = await this.api.get('/endorsements');
      return response.data;
    } catch (error) {
      console.error('Error fetching endorsements:', error);
      throw error;
    }
  }

  /**
   * Create an endorsement
   */
  async createEndorsement(endorsementData) {
    try {
      const response = await this.api.post('/endorsements', endorsementData);
      return response.data;
    } catch (error) {
      console.error('Error creating endorsement:', error);
      throw error;
    }
  }

  /**
   * Get endorsements for a specific proposal
   */
  async getEndorsementsByProposal(proposalId) {
    try {
      const response = await this.api.get(`/endorsements/proposal/${proposalId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching proposal endorsements:', error);
      throw error;
    }
  }

  /**
   * Get all progress reports
   */
  async getProgressReports() {
    try {
      const response = await this.api.get('/progress-reports');
      return response.data;
    } catch (error) {
      console.error('Error fetching progress reports:', error);
      throw error;
    }
  }

  /**
   * Get a specific progress report by ID
   */
  async getProgressReportById(id) {
    try {
      const response = await this.api.get(`/progress-reports/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching progress report:', error);
      throw error;
    }
  }

  /**
   * Submit a progress report
   */
  async submitProgressReport(reportData) {
    try {
      const formData = new FormData();
      
      // Add all text fields
      formData.append('proposalID', reportData.proposalID);
      formData.append('reportType', reportData.reportType);
      formData.append('reportPeriod', reportData.reportPeriod);
      formData.append('progressPercentage', reportData.progressPercentage);
      formData.append('achievements', reportData.achievements);
      formData.append('nextMilestone', reportData.nextMilestone);
      
      if (reportData.budgetUtilized) {
        formData.append('budgetUtilized', reportData.budgetUtilized);
      }
      if (reportData.challenges) {
        formData.append('challenges', reportData.challenges);
      }
      if (reportData.additionalNotes) {
        formData.append('additionalNotes', reportData.additionalNotes);
      }
      
      // Add files
      if (reportData.files && reportData.files.length > 0) {
        reportData.files.forEach((file) => {
          formData.append('files[]', file);
        });
      }

      const response = await this.api.post('/progress-reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting progress report:', error);
      throw error;
    }
  }

  /**
   * Submit a review for a proposal
   */
  async submitReview(reviewData) {
    try {
      const response = await this.api.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  /**
   * Get research resources
   */
  async getResources() {
    try {
      // For now, return static data since we don't have a resources API endpoint
      // In a real application, this would fetch from an API endpoint
      return {
        success: true,
        data: [
          {
            id: 1,
            title: 'Research Proposal Guidelines 2025',
            description: 'Comprehensive guidelines for submitting research proposals including formatting, requirements, and evaluation criteria.',
            category: 'Guidelines',
            type: 'PDF',
            size: '2.5 MB',
            uploadDate: '2025-01-15',
            uploader: 'Dr. Sarah Wilson',
            downloads: 245,
            tags: ['proposal', 'guidelines', '2025']
          },
          {
            id: 2,
            title: 'Progress Report Template',
            description: 'Standard template for quarterly and annual progress reports with all required sections and formatting.',
            category: 'Templates',
            type: 'DOCX',
            size: '1.2 MB',
            uploadDate: '2025-01-10',
            uploader: 'Prof. John Doe',
            downloads: 189,
            tags: ['template', 'progress', 'report']
          },
          {
            id: 3,
            title: 'Research Ethics Guidelines',
            description: 'Guidelines for ethical conduct in research including human subjects, data privacy, and conflict of interest.',
            category: 'Ethics',
            type: 'PDF',
            size: '3.1 MB',
            uploadDate: '2025-01-08',
            uploader: 'Dr. Maria Santos',
            downloads: 156,
            tags: ['ethics', 'guidelines', 'research']
          },
          {
            id: 4,
            title: 'Budget Planning Worksheet',
            description: 'Excel worksheet for planning and tracking research project budgets with formulas and examples.',
            category: 'Templates',
            type: 'XLSX',
            size: '0.8 MB',
            uploadDate: '2025-01-05',
            uploader: 'Dr. James Brown',
            downloads: 203,
            tags: ['budget', 'planning', 'worksheet']
          },
          {
            id: 5,
            title: 'Literature Review Guidelines',
            description: 'Step-by-step guide for conducting comprehensive literature reviews including search strategies and citation formats.',
            category: 'Guidelines',
            type: 'PDF',
            size: '1.8 MB',
            uploadDate: '2024-12-20',
            uploader: 'Prof. Lisa Green',
            downloads: 178,
            tags: ['literature', 'review', 'research']
          },
          {
            id: 6,
            title: 'Data Management Plan Template',
            description: 'Template for creating data management plans including data collection, storage, and sharing protocols.',
            category: 'Templates',
            type: 'DOCX',
            size: '1.5 MB',
            uploadDate: '2024-12-15',
            uploader: 'Dr. Robert Kim',
            downloads: 134,
            tags: ['data', 'management', 'template']
          },
          {
            id: 7,
            title: 'Research Methodology Handbook',
            description: 'Comprehensive handbook covering various research methodologies, data collection techniques, and analysis methods.',
            category: 'Reference',
            type: 'PDF',
            size: '5.2 MB',
            uploadDate: '2024-12-10',
            uploader: 'Dr. David Lee',
            downloads: 298,
            tags: ['methodology', 'handbook', 'research']
          },
          {
            id: 8,
            title: 'Grant Writing Tips and Examples',
            description: 'Collection of tips, best practices, and successful grant proposal examples from various funding agencies.',
            category: 'Reference',
            type: 'PDF',
            size: '4.3 MB',
            uploadDate: '2024-12-05',
            uploader: 'Prof. Jane Wilson',
            downloads: 167,
            tags: ['grants', 'writing', 'examples']
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  }
}

export default new RDDService();
