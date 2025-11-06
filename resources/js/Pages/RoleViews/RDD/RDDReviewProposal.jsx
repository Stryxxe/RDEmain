import React, { useState, useEffect } from 'react';
import { BiSearch, BiFilter, BiDownload, BiShow } from 'react-icons/bi';
import rddService from '../../../services/rddService';

const RDDReviewProposal = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('Date');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await rddService.getProposalsForReview();
      if (response.success) {
        // Transform the data to match the expected format
        const transformedProposals = response.data.map(proposal => ({
          id: proposal.proposalID, // Use actual database ID for routing
          displayId: `PRO-2025-${String(proposal.proposalID).padStart(5, '0')}`, // Formatted ID for display
          title: proposal.researchTitle,
          author: proposal.user ? `${proposal.user.firstName} ${proposal.user.lastName}` : 'Unknown',
          college: proposal.user?.department?.name || 'Unknown Department',
          status: proposal.status?.statusName || 'Unknown',
          submittedDate: new Date(proposal.uploadedAt).toLocaleDateString(),
          priority: proposal.priority || (proposal.proposedBudget >= 1000000 ? 'High' : proposal.proposedBudget >= 500000 ? 'Medium' : 'Low'),
          budget: `₱${Number(proposal.proposedBudget).toLocaleString()}`,
          duration: proposal.duration || proposal.projectDuration || 'N/A',
          reviewers: Array.isArray(proposal.reviewers) && proposal.reviewers.length > 0
            ? proposal.reviewers.map(r => (typeof r === 'string' ? r : (r.name || `${r.firstName || ''} ${r.lastName || ''}`.trim())))
            : []
        }));
        setProposals(transformedProposals);
      } else {
        setError('Failed to fetch proposals');
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('Error loading proposals');
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.college.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'All' || proposal.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Pending Review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading proposals...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={fetchProposals}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
            Research Proposal Review
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Review and manage research proposals for endorsement and approval
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search proposals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 pl-4 pr-10 py-2 bg-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
              />
              <BiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />
            </div>
            
            <div className="flex gap-2">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="All">All Status</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Date">Sort by Date</option>
                <option value="Title">Sort by Title</option>
                <option value="Author">Sort by Author</option>
                <option value="Status">Sort by Status</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              <BiDownload className="text-sm" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
              <BiFilter className="text-sm" />
              Advanced Filter
            </button>
          </div>
        </div>
      </div>

      {/* Proposals Table */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px] gap-4 p-4 border-b border-gray-200 font-semibold text-gray-700">
            <div>Proposal Details</div>
            <div>Author & College</div>
            <div>Status & Priority</div>
            <div>Budget & Duration</div>
            <div>Reviewers</div>
            <div>Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {filteredProposals.map((proposal, index) => (
              <div key={index} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px] gap-4 p-4 hover:bg-gray-50 transition-colors duration-150">
                {/* Proposal Details */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{proposal.title}</h3>
                  <div className="text-sm text-gray-600">ID: {proposal.displayId}</div>
                  <div className="text-sm text-gray-600">Submitted: {proposal.submittedDate}</div>
                </div>

                {/* Author & College */}
                <div>
                  <div className="font-medium text-gray-900">{proposal.author}</div>
                  <div className="text-sm text-gray-600">{proposal.college}</div>
                </div>

                {/* Status & Priority */}
                <div>
                  <div className="mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusClass(proposal.status)}`}>
                      {proposal.status}
                    </span>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityClass(proposal.priority)}`}>
                      {proposal.priority} Priority
                    </span>
                  </div>
                </div>

                {/* Budget & Duration */}
                <div>
                  <div className="font-bold text-gray-900">{proposal.budget}</div>
                  <div className="text-sm text-gray-600">{proposal.duration}</div>
                </div>

                {/* Reviewers */}
                <div>
                  <div className="text-sm text-gray-600">
                    {proposal.reviewers.map((reviewer, idx) => (
                      <div key={idx} className="truncate">{reviewer}</div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="border border-red-500 text-red-500 bg-white px-3 py-1 rounded text-sm font-medium hover:bg-red-50 transition-colors duration-150 flex items-center gap-1">
                    <BiShow className="text-sm" />
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-gray-900">{proposals.length}</div>
            <div className="text-sm text-gray-600">Total Proposals</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {proposals.filter(p => p.status === 'Pending Review').length}
            </div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {proposals.filter(p => p.status === 'Under Review').length}
            </div>
            <div className="text-sm text-gray-600">Under Review</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">
              {proposals.filter(p => p.status === 'Approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RDDReviewProposal;
