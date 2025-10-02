import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BiSearch, BiShow } from 'react-icons/bi';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import StatsCard from '../../../Components/StatsCard';

const CMDashboard = () => {
  const { user } = useAuth();
  const [fromYear, setFromYear] = useState('2025');
  const [toYear, setToYear] = useState('2025');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('ID');
  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    ongoing: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
    fetchStatistics();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/proposals');
      if (response.data.success) {
        setProposals(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/api/proposals/statistics');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const filteredProposals = proposals.filter(proposal =>
    proposal.researchTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.researchCenter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProposals = filteredProposals.sort((a, b) => {
    switch (sortBy) {
      case 'ID':
        return a.proposalID - b.proposalID; // Oldest first
      case 'Title':
        return a.researchTitle.localeCompare(b.researchTitle);
      case 'Author':
        return (a.user?.fullName || '').localeCompare(b.user?.fullName || '');
      case 'Status':
        return (a.status?.statusName || '').localeCompare(b.status?.statusName || '');
      case 'Date':
        return new Date(a.created_at) - new Date(b.created_at);
      default:
        return a.proposalID - b.proposalID; // Default to ID sorting (oldest first)
    }
  });

  const getStatusClass = (statusName) => {
    switch (statusName) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Ongoing':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getProgressColor = (statusName) => {
    switch (statusName) {
      case 'Completed':
        return 'bg-green-500';
      case 'Under Review':
        return 'bg-blue-500';
      case 'Ongoing':
        return 'bg-blue-500';
      case 'Approved':
        return 'bg-green-500';
      case 'Rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getProgressPercentage = (statusName) => {
    switch (statusName) {
      case 'Completed':
        return 100;
      case 'Under Review':
        return 20;
      case 'Ongoing':
        return 45;
      case 'Approved':
        return 80;
      case 'Rejected':
        return 0;
      default:
        return 0;
    }
  };

  const statsData = [
    {
      number: stats.total.toString(),
      label: 'Total of Submitted Proposals'
    },
    {
      number: stats.under_review.toString(),
      label: 'Under Review'
    },
    {
      number: stats.completed.toString(),
      label: 'Done/Utilized Proposals'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Research Project Tracker
          </h1>
          <p className="text-lg text-gray-600">
            Monitor and manage all research projects with comprehensive tracking and analytics
          </p>
        </div>
      </div>

      {/* Year Filter Section */}
      <div className="p-5">
        <div className="flex gap-8 mb-8 bg-white p-5 rounded-lg shadow-md">
          <div className="flex items-center gap-3">
            <label className="font-medium text-gray-700">From Year:</label>
            <select 
              value={fromYear} 
              onChange={(e) => setFromYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded bg-white text-sm"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="font-medium text-gray-700">To Year:</label>
            <select 
              value={toYear} 
              onChange={(e) => setToYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded bg-white text-sm"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards Section */}
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {statsData.map((stat, index) => (
            <StatsCard
              key={index}
              number={stat.number}
              label={stat.label}
            />
          ))}
        </div>
      </div>

      {/* Header Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Research Projects</h1>
            <p className="text-gray-600">Comprehensive list of all research initiatives</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ID">ID (Oldest First)</option>
              <option value="Title">Title</option>
              <option value="Author">Author</option>
              <option value="Status">Status</option>
              <option value="Date">Date</option>
            </select>
            <span className="text-gray-500">↑</span>
          </div>
        </div>
        
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 bg-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
          />
          <BiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />
        </div>
      </div>

      {/* Research Projects Table */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_120px] gap-4 p-4 border-b border-gray-200 font-semibold text-gray-700">
            <div>Project Details</div>
            <div>Author & College</div>
            <div>Status & Progress</div>
            <div>Budget</div>
            <div>Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {sortedProposals.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No proposals found
              </div>
            ) : (
              sortedProposals.map((proposal, index) => (
                <div key={proposal.proposalID} className="grid grid-cols-[2fr_1fr_1fr_1fr_120px] gap-4 p-4 hover:bg-gray-50 transition-colors duration-150">
                  {/* Project Details */}
                  <div>
                    <Link 
                      to={`/cm/proposal/${proposal.proposalID}`}
                      className="font-bold text-gray-900 mb-1 hover:text-blue-600 transition-colors duration-200 cursor-pointer block"
                    >
                      {proposal.researchTitle}
                    </Link>
                    <div className="text-sm text-gray-600">ID: PRO-{proposal.proposalID.toString().padStart(6, '0')}</div>
                    <div className="text-sm text-gray-600">Submitted: {new Date(proposal.uploadedAt || proposal.created_at).toLocaleDateString()}</div>
                  </div>

                  {/* Author & College */}
                  <div>
                    <div className="font-medium text-gray-900">{proposal.user?.fullName || 'Unknown'}</div>
                    <div className="text-sm text-gray-600">{proposal.researchCenter}</div>
                  </div>

                  {/* Status & Progress */}
                  <div>
                    <div className="mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusClass(proposal.status?.statusName)}`}>
                        {proposal.status?.statusName || 'Unknown'}
                      </span>
                    </div>
                    <div className="mb-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(proposal.status?.statusName)} transition-all duration-300`}
                          style={{ width: `${getProgressPercentage(proposal.status?.statusName)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">{getProgressPercentage(proposal.status?.statusName)}% complete</div>
                  </div>

                  {/* Budget */}
                  <div>
                    <div className="font-semibold text-gray-900">
                      ₱{proposal.proposedBudget?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Total Budget</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center">
                    <Link to={`/cm/proposal/${proposal.proposalID}`}>
                      <button className="border border-red-500 text-red-500 bg-white px-3 py-1 rounded text-sm font-medium hover:bg-red-50 transition-colors duration-150 flex items-center gap-1">
                        <BiShow className="text-sm" />
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMDashboard;
