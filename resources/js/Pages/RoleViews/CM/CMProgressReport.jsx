import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import { useMessages } from '../../../contexts/MessageContext';
import { RefreshCw } from 'lucide-react';
import AutoRefreshControls from '../../../Components/AutoRefreshControls';
import RefreshStatusIndicator from '../../../Components/RefreshStatusIndicator';
import axios from 'axios';

// Use window.axios which has session-based auth configured, or configure this instance
const axiosInstance = window.axios || axios;
if (!window.axios) {
  axiosInstance.defaults.withCredentials = true;
  axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const CMProgressReport = () => {
  const { user } = useAuth();
  const { refreshAllNotifications } = useNotifications();
  const { refreshAllMessages } = useMessages();
  const [proposals, setProposals] = useState([]);
  const [progressReports, setProgressReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedProposals, setExpandedProposals] = useState(new Set());

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch proposals and progress reports in parallel
      const [proposalsResponse, reportsResponse] = await Promise.all([
        axiosInstance.get('/proposals', {
          headers: { 'Accept': 'application/json' },
          withCredentials: true
        }),
        axiosInstance.get('/progress-reports', {
          headers: { 'Accept': 'application/json' },
          withCredentials: true
        })
      ]);
      
      if (proposalsResponse.data.success) {
        // Filter proposals from the same department
        const filteredProposals = proposalsResponse.data.data.filter(proposal => {
          return proposal.user?.departmentID === user?.departmentID;
        });
        setProposals(filteredProposals);
      }
      
      if (reportsResponse.data.success) {
        setProgressReports(reportsResponse.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        console.error('Unauthorized - session may have expired');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressReports = async () => {
    try {
      const response = await axiosInstance.get('/progress-reports', {
        headers: { 'Accept': 'application/json' },
        withCredentials: true
      });
      if (response.data.success) {
        setProgressReports(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching progress reports:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        fetchData(),
        refreshAllNotifications(),
        refreshAllMessages()
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Group progress reports by proposal ID
  const reportsByProposal = progressReports.reduce((acc, report) => {
    const proposalId = report.proposalID || report.proposal?.proposalID;
    if (!acc[proposalId]) {
      acc[proposalId] = [];
    }
    acc[proposalId].push(report);
    return acc;
  }, {});

  // Filter proposals based on search
  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.researchTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || proposal.status?.statusName === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Toggle proposal expansion
  const toggleProposal = (proposalId) => {
    setExpandedProposals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(proposalId)) {
        newSet.delete(proposalId);
      } else {
        newSet.add(proposalId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800';
      case 'Ongoing':
        return 'bg-orange-100 text-orange-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading progress reports...</p>
        </div>
      </div>
    );
  }


  const SearchIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const FilterIcon = () => (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );

  const SortIcon = () => (
    <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );

  const FilterBar = () => (
    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FilterIcon />
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Approved">Approved</option>
              <option value="Under Review">Under Review</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          
          <SortIcon />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
            Progress Reports
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-6">
            Monitor and track project progress across divisions
          </p>
          
          {/* Manual Refresh Button */}
          <div className="flex flex-wrap justify-center items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh progress reports and notifications"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Projects and Reports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-xl font-semibold text-gray-900">Projects and Progress Reports</h2>
            <p className="text-sm text-gray-600 mt-1">{filteredProposals.length} projects found</p>
          </div>
          
          {/* Filter Bar */}
          <FilterBar />
          
          {/* Projects List */}
          <div className="divide-y divide-gray-200">
            {filteredProposals.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No projects found
              </div>
            ) : (
              filteredProposals.map((proposal, index) => {
                const proposalId = proposal.proposalID;
                const reports = reportsByProposal[proposalId] || [];
                const isExpanded = expandedProposals.has(proposalId);
                
                return (
                  <div key={proposalId} className="hover:bg-gray-50 transition-colors">
                    {/* Proposal Row */}
                    <div 
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => toggleProposal(proposalId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-sm font-medium text-gray-900">
                                {proposal.researchTitle}
                              </h3>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                PRO-{proposalId.toString().padStart(6, '0')}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status?.statusName)}`}>
                                {proposal.status?.statusName || 'Unknown'}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Researcher: {proposal.user?.fullName || 'Unknown'} | 
                              Submitted: {new Date(proposal.created_at).toLocaleDateString()} |
                              Reports: {reports.length}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {reports.length} report{reports.length !== 1 ? 's' : ''}
                          </span>
                          <svg 
                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Reports for this Proposal */}
                    {isExpanded && (
                      <div className="bg-gray-50 border-t border-gray-200">
                        {reports.length === 0 ? (
                          <div className="px-14 py-4 text-sm text-gray-500">
                            No progress reports submitted for this project yet.
                          </div>
                        ) : (
                          <div className="px-14 py-4 space-y-3">
                            {reports.map((report) => (
                              <div 
                                key={report.reportID} 
                                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className="text-sm font-medium text-gray-900">
                                        {report.reportType || 'Progress Report'}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {report.reportPeriod || 'N/A'}
                                      </span>
                                      {report.progressPercentage !== null && (
                                        <span className="text-xs text-blue-600 font-medium">
                                          {report.progressPercentage}% Complete
                                        </span>
                                      )}
                                    </div>
                                    {report.achievements && (
                                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                        {report.achievements}
                                      </p>
                                    )}
                                    <div className="text-xs text-gray-500">
                                      Submitted: {new Date(report.submittedAt || report.created_at).toLocaleString()}
                                    </div>
                                    {report.files && report.files.length > 0 && (
                                      <div className="mt-2 text-xs text-gray-500">
                                        {report.files.length} file{report.files.length !== 1 ? 's' : ''} attached
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMProgressReport;
