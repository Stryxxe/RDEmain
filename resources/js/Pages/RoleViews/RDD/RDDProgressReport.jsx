import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import rddService from '../../../services/rddService';

const RDDProgressReport = () => {
  const [fromYear, setFromYear] = useState('2025');
  const [toYear, setToYear] = useState('2025');
  const [search, setSearch] = useState('');
  const [selectedResearchCenter, setSelectedResearchCenter] = useState('all');
  const [progressReports, setProgressReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const researchCenters = [
    { id: 'all', name: 'All Research Centers' },
    { id: 'RC-001', name: 'Center for Research and Development' },
    { id: 'RC-002', name: 'Center for Technology Innovation' },
    { id: 'RC-003', name: 'Center for Agricultural Research' },
    { id: 'RC-004', name: 'Center for Environmental Studies' },
    { id: 'RC-005', name: 'Center for Health Sciences' },
    { id: 'RC-006', name: 'Center for Engineering Research' },
    { id: 'RC-007', name: 'Center for Social Sciences' },
    { id: 'RC-008', name: 'Center for Business and Economics' }
  ];

  const formatDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return null;
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  useEffect(() => {
    fetchProgressReports();
  }, []);

  const fetchProgressReports = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch actual submitted progress reports
      const response = await rddService.getProgressReports();
      if (response.success) {
        // Transform progress reports to match the reference structure
        // Group by research center/department
        const reportsByCenter = {};
        
        response.data.forEach((report) => {
          const submittedAt = report.submittedAt ? new Date(report.submittedAt) : null;
          const formattedDate = formatDate(submittedAt);
          const researchCenter = report.proposal?.user?.department?.name || 'Unassigned Department';
          const centerId = `RC-${String(report.reportID).padStart(3, '0')}`;
          
          // Use department as research center, create unique ID
          if (!reportsByCenter[researchCenter]) {
            reportsByCenter[researchCenter] = {
              id: centerId,
              researchCenterId: centerId,
              researchCenter: researchCenter,
              dateSubmitted: formattedDate || 'Not specified',
              reportCount: 0,
              latestReport: report
            };
          }
          reportsByCenter[researchCenter].reportCount += 1;
          
          // Use the most recent date
          if (submittedAt && (!reportsByCenter[researchCenter].dateSubmitted || 
              submittedAt > new Date(reportsByCenter[researchCenter].dateSubmitted))) {
            reportsByCenter[researchCenter].dateSubmitted = formattedDate;
            reportsByCenter[researchCenter].latestReport = report;
          }
        });

        const transformedReports = Object.values(reportsByCenter);
        setProgressReports(transformedReports);
      } else {
        setError('Failed to fetch progress reports');
      }
    } catch (err) {
      console.error('Error fetching progress reports:', err);
      setError('Error loading progress reports');
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (project) => {
    // Navigate to progress report detail page
    if (project.latestReport && project.latestReport.reportID) {
      router.visit(`/rdd/progress-report/${project.latestReport.reportID}`);
    } else {
      console.error('No report ID found for this progress report');
      console.log('Project data:', project);
    }
  };

  // Filter projects based on search and research center
  const filteredProjects = progressReports.filter(project => {
    const matchesSearch = project.researchCenter.toLowerCase().includes(search.toLowerCase());
    const matchesResearchCenter = selectedResearchCenter === 'all' || project.researchCenterId === selectedResearchCenter;
    return matchesSearch && matchesResearchCenter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading progress reports...</p>
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
                onClick={fetchProgressReports}
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        
        {/* Research Center Filter */}
        <div className="flex items-center space-x-2">
          <FilterIcon />
          <span className="text-sm font-medium text-gray-700">Research Center:</span>
          <select
            value={selectedResearchCenter}
            onChange={(e) => setSelectedResearchCenter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-48"
          >
            {researchCenters.map(center => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Year Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">From:</span>
            <input
              type="text"
              value={fromYear}
              onChange={(e) => setFromYear(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">To:</span>
            <input
              type="text"
              value={toYear}
              onChange={(e) => setToYear(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          <SortIcon />
        </div>
      </div>
    </div>
  );

  const TableSection = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-xl font-semibold text-gray-900">Completed Project Reports</h2>
            <p className="text-sm text-gray-600 mt-1">{filteredProjects.length} {filteredProjects.length === 1 ? 'record' : 'records'} found</p>
          </div>
      
      {/* Filter Bar */}
      <FilterBar />
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Research Center ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Research Center</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Submitted</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
              <tbody className="bg-white divide-y divide-gray-100">
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 text-lg font-medium mb-2">No progress reports found</p>
                    <p className="text-gray-500 text-sm">Progress reports will appear here once they have been submitted.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProjects.map((project, index) => (
                <tr key={project.id} className="hover:bg-red-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {project.researchCenterId}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{project.researchCenter}</div>
                    {project.reportCount > 1 && (
                      <div className="text-xs text-gray-500 mt-1">{project.reportCount} reports</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{project.dateSubmitted}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                      onClick={() => handleViewClick(project)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Monitor and track project progress across research centers
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Completed Project Reports */}
        <TableSection />
      </div>
    </div>
  );
};

export default RDDProgressReport;
