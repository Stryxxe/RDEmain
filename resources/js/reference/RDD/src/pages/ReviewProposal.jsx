import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ProposalDetails from '../components/ProposalDetails';

const ReviewProposal = () => {
  const location = useLocation();
  const [year, setYear] = useState('2025');
  const [search, setSearch] = useState('');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Check if we're coming from tracker with a selected proposal
  useEffect(() => {
    if (location.state?.selectedProposal) {
      setSelectedProposal(location.state.selectedProposal);
    }
  }, [location.state]);

  const reviewProposals = [
    { id: 1, author: 'Kyla Bea Dorin', dateSubmitted: 'July 11, 2025', title: 'Renewable Energy Implementation' },
    { id: 2, author: 'Nico Eslawan', dateSubmitted: 'July 11, 2025', title: 'ARAY KO: Identifying pain through eye contact' },
    { id: 3, author: 'Troy Balbuena', dateSubmitted: 'July 11, 2025', title: 'MwaMwa: Family is love' },
    { id: 4, author: 'Camyr Gelicame', dateSubmitted: 'July 11, 2025', title: 'SportShield: Real-time Monitoring for Athletes' },
    { id: 5, author: 'Kyla Bea Dorin', dateSubmitted: 'July 11, 2025', title: 'HaHaHa Katawa: Analyzing Smile Dynamics for Psychopath Detection Using Convolutional Neural Networks' },
    { id: 6, author: 'Dr. Ana Rodriguez', dateSubmitted: 'July 12, 2025', title: 'AI-Powered Disease Detection System' },
    { id: 7, author: 'Prof. Maria Santos', dateSubmitted: 'July 13, 2025', title: 'Smart Farming Technology Implementation' },
    { id: 8, author: 'Dr. Sarah Johnson', dateSubmitted: 'July 14, 2025', title: 'Urban Planning with GIS Integration' },
    { id: 9, author: 'Prof. Michael Chen', dateSubmitted: 'July 15, 2025', title: 'Machine Learning for Climate Prediction' },
    { id: 10, author: 'Dr. Emily Davis', dateSubmitted: 'July 16, 2025', title: 'Digital Humanities Research Platform' },
    { id: 11, author: 'Prof. James Wilson', dateSubmitted: 'July 17, 2025', title: 'Telemedicine Solutions for Rural Areas' },
    { id: 12, author: 'Dr. Lisa Thompson', dateSubmitted: 'July 18, 2025', title: 'Sustainable Crop Management System' }
  ];

  const handleViewClick = (proposal) => setSelectedProposal(proposal);
  const handleBack = () => setSelectedProposal(null);

  // Filter proposals based on search
  const filteredProposals = reviewProposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(search.toLowerCase()) ||
                         proposal.author.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProposals = filteredProposals.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);

  if (selectedProposal) {
    return <ProposalDetails proposal={selectedProposal} onBack={handleBack} />;
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
            placeholder="Search proposals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FilterIcon />
            <span className="text-sm font-medium text-gray-700">Year:</span>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
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
            Endorsement
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Manage and endorse research project proposals submitted by researchers
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Main Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <h2 className="text-xl font-semibold text-gray-900">Research Proposals for Review</h2>
            <p className="text-sm text-gray-600 mt-1">{filteredProposals.length} records found</p>
          </div>
          
          {/* Filter Bar */}
          <FilterBar />
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Submitted</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentProposals.map((proposal, index) => (
                  <tr key={proposal.id} className="hover:bg-emerald-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full">
                        {String(indexOfFirstItem + index + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-sm truncate" title={proposal.title}>
                        {proposal.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{proposal.author}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{proposal.dateSubmitted}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewClick(proposal)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-150"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProposals.length)} of {filteredProposals.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        currentPage === page
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewProposal; 