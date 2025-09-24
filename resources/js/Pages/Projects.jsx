import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, ChevronUp } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Projects = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  // Refresh projects when user name changes (e.g., after profile update)
  useEffect(() => {
    if (user && user.fullName) {
      loadProjects();
    }
  }, [user?.fullName]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getProposals();
      
      if (response.success) {
        setProjects(response.data);
      } else {
        setError(response.message || 'Failed to load projects');
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => {
    const searchLower = searchTerm.toLowerCase();
    const title = project.researchTitle?.toLowerCase() || '';
    const author = project.user?.fullName?.toLowerCase() || '';
    const researchCenter = project.matrixOfCompliance?.researchCenter?.toLowerCase() || '';
    const id = project.proposalID?.toString() || '';
    
    return title.includes(searchLower) ||
           author.includes(searchLower) ||
           researchCenter.includes(searchLower) ||
           id.includes(searchLower);
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return (a.researchTitle || '').localeCompare(b.researchTitle || '');
      case 'author':
        return (a.user?.fullName || '').localeCompare(b.user?.fullName || '');
      case 'status':
        return (a.status?.statusName || '').localeCompare(b.status?.statusName || '');
      case 'funding':
        const budgetA = a.matrixOfCompliance?.proposedBudget || 0;
        const budgetB = b.matrixOfCompliance?.proposedBudget || 0;
        return budgetB - budgetA;
      case 'date':
        return new Date(b.created_at) - new Date(a.created_at);
      default:
        return 0;
    }
  });

  // Get status color
  const getStatusColor = (statusId) => {
    switch (statusId) {
      case 1: return 'bg-red-500'; // Under Review
      case 2: return 'bg-green-500'; // Approved
      case 3: return 'bg-red-600'; // Rejected
      case 4: return 'bg-orange-500'; // Ongoing
      case 5: return 'bg-green-600'; // Completed
      default: return 'bg-gray-500';
    }
  };

  // Get progress bar color
  const getProgressColor = (statusId) => {
    switch (statusId) {
      case 1: return 'bg-red-500'; // Under Review
      case 2: return 'bg-green-500'; // Approved
      case 3: return 'bg-red-600'; // Rejected
      case 4: return 'bg-orange-500'; // Ongoing
      case 5: return 'bg-green-600'; // Completed
      default: return 'bg-gray-500';
    }
  };

  // Get progress percentage based on status
  const getProgressPercentage = (statusId) => {
    switch (statusId) {
      case 1: return 20; // Under Review
      case 2: return 60; // Approved
      case 3: return 0; // Rejected
      case 4: return 80; // Ongoing
      case 5: return 100; // Completed
      default: return 0;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₱0';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle view details click
  const handleViewDetails = (projectId) => {
    navigate(`/proponent/projects/${projectId}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Projects</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadProjects}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Research Projects</h1>
              <p className="text-gray-600">Comprehensive list of all research initiatives</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="status">Status</option>
                <option value="funding">Funding</option>
                <option value="date">Date</option>
              </select>
              <ChevronUp size={16} className="text-gray-500" />
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author & Research Center
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funding
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProjects.map((project) => {
                  const progress = getProgressPercentage(project.statusID);
                  const budget = project.matrixOfCompliance?.proposedBudget || 0;
                  
                  
                  return (
                    <tr key={project.proposalID} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {project.researchTitle || 'Untitled Project'}
                          </h3>
                          <p className="text-xs text-gray-500">ID: {project.proposalID}</p>
                          <p className="text-xs text-gray-500">
                            Submitted: {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {project.user?.fullName || 'Unknown Author'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {project.matrixOfCompliance?.researchCenter || 'No Research Center'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(project.statusID)}`}>
                            {project.status?.statusName || 'Unknown Status'}
                          </span>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getProgressColor(project.statusID)}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500">{progress}% complete</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {project.statusID === 2 ? formatCurrency(budget) : 'Pending'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {project.statusID === 2 
                              ? (budget > 1000000 ? 'High Priority' : budget > 500000 ? 'Medium Priority' : 'Low Priority')
                              : 'Awaiting RDD Approval'
                            }
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleViewDetails(project.proposalID)}
                          className="group relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 border border-red-500 hover:border-red-600"
                        >
                          <div className="flex items-center gap-2">
                            <Eye size={16} className="group-hover:scale-110 transition-transform duration-200" />
                            <span>View Details</span>
                          </div>
                          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {sortedProjects.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Try adjusting your search criteria' : 'Submit your first research proposal to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('submit')}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Submit Proposal
              </button>
            )}
          </div>
        )}
    </div>
  );
};

export default Projects;
