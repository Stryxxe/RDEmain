import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, CheckCircle, AlertCircle, XCircle, Search, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import apiService from '../services/api';

const Tracker = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getProposals();
      
      if (response.success) {
        console.log('Tracker - Projects loaded:', response.data);
        console.log('Tracker - First project structure:', response.data?.[0]);
        setProjects(response.data || []);
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

  const getStatusColor = (statusId) => {
    switch (statusId) {
      case 1: return 'bg-red-100 text-red-800 border-red-200'; // Under Review
      case 2: return 'bg-green-100 text-green-800 border-green-200'; // Approved
      case 3: return 'bg-red-100 text-red-800 border-red-200'; // Rejected
      case 4: return 'bg-orange-100 text-orange-800 border-orange-200'; // Ongoing
      case 5: return 'bg-green-100 text-green-800 border-green-200'; // Completed
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressPercentage = (statusId) => {
    switch (statusId) {
      case 1: return 20; // Under Review
      case 2: return 40; // Approved
      case 3: return 0;  // Rejected
      case 4: return 60; // Ongoing
      case 5: return 100; // Completed
      default: return 0;
    }
  };

  const handleViewDetails = (projectId) => {
    console.log('Tracker - handleViewDetails called with projectId:', projectId);
    console.log('Tracker - navigating to:', `/proponent/tracker/${projectId}`);
    navigate(`/proponent/tracker/${projectId}`);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedProjects = projects
    .filter(project => 
      project.researchTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.proposalID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.author?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.researchTitle || '';
          bValue = b.researchTitle || '';
          break;
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'status':
          aValue = a.status?.statusName || '';
          bValue = b.status?.statusName || '';
          break;
        default:
          aValue = a.researchTitle || '';
          bValue = b.researchTitle || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="w-full max-w-full mx-auto space-y-8 px-2 sm:px-4 md:px-6 lg:px-8 overflow-hidden" style={{ maxWidth: '100vw', width: '100%' }}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading projects...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-full mx-auto space-y-8 px-2 sm:px-4 md:px-6 lg:px-8 overflow-hidden" style={{ maxWidth: '100vw', width: '100%' }}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-64">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-600 mb-2">
                <AlertCircle className="w-12 h-12 mx-auto" />
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
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto space-y-8 px-2 sm:px-4 md:px-6 lg:px-8 overflow-hidden" style={{ maxWidth: '100vw', width: '100%' }}>
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Research Projects
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Comprehensive list of all research initiatives
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="title">Title</option>
                  <option value="date">Date</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => handleSort(sortBy)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mt-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Projects Table */}
      {filteredAndSortedProjects.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No Projects Found' : 'No Projects Available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms.' : 'You don\'t have any projects to track yet.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/proponent/projects')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                View All Projects
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-y border-gray-200">
                  <th className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 text-left text-sm font-semibold text-gray-700 min-w-24">
                    PROJECT DETAILS
                  </th>
                  <th className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 text-left text-sm font-semibold text-gray-700 min-w-20">
                    AUTHOR & RESEARCH CENTER
                  </th>
                  <th className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 text-left text-sm font-semibold text-gray-700 min-w-48">
                    STATUS & PROGRESS
                  </th>
                  <th className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 text-left text-sm font-semibold text-gray-700 min-w-20">
                    FUNDING
                  </th>
                  <th className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 text-left text-sm font-semibold text-gray-700 min-w-20">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedProjects.map((project, index) => (
                  <tr key={project.proposalID || project.id || index} className={`hover:bg-gray-50 transition-colors duration-200 ${index !== filteredAndSortedProjects.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <td className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {project.researchTitle || 'Untitled Project'}
                          </div>
                          <div className="text-xs text-gray-500">ID: {project.proposalID}</div>
                          <div className="text-xs text-gray-500">
                            Submitted: {new Date(project.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'numeric', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{project.author || 'Unknown Author'}</div>
                        <div className="text-xs text-gray-500">{project.researchCenter || 'Not specified'}</div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${index === 0 ? 'bg-red-600 animate-pulse' : 'bg-green-500'}`}></div>
                          <span className={`text-sm font-medium ${index === 0 ? 'text-red-700' : 'text-gray-900'}`}>
                            {project.status?.statusName || 'Unknown Status'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Progress</span>
                            <span className="text-xs font-medium text-gray-900">{getProgressPercentage(project.statusID)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-red-600 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${getProgressPercentage(project.statusID)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{getProgressPercentage(project.statusID)}% complete</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {project.statusID === 2 ? 'Approved' : 'Pending'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {project.statusID === 2 ? 'Funding Approved' : 'Awaiting RDD Approval'}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                      <button
                        onClick={() => {
                          console.log('Tracker - Button clicked for project:', project);
                          console.log('Tracker - Project.id:', project.id);
                          console.log('Tracker - Project.proposalID:', project.proposalID);
                          handleViewDetails(project.proposalID || project.id);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors duration-200"
                      >
                        <Eye size={14} />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tracker;