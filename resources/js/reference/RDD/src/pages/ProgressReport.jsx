import React, { useState } from 'react';
import ProgressReportDetails from '../components/ProgressReportDetails';
import { DollarSign, TrendingUp, Target, BarChart3 } from 'lucide-react';

const ProgressReportPage = () => {
  const [fromYear, setFromYear] = useState('2025');
  const [toYear, setToYear] = useState('2025');
  const [search, setSearch] = useState('');

  const [selectedReport, setSelectedReport] = useState(null);

  const [selectedResearchCenter, setSelectedResearchCenter] = useState('all');

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

  const completedProjects = [
    {
      id: 1,
      researchCenterId: 'RC-001',
      researchCenter: 'Center for Research and Development',
      dateSubmitted: 'March 20, 2025'
    },
    {
      id: 2,
      researchCenterId: 'RC-002',
      researchCenter: 'Center for Technology Innovation',
      dateSubmitted: 'March 25, 2025'
    },
    {
      id: 3,
      researchCenterId: 'RC-003',
      researchCenter: 'Center for Agricultural Research',
      dateSubmitted: 'March 20, 2025'
    },
    {
      id: 4,
      researchCenterId: 'RC-004',
      researchCenter: 'Center for Environmental Studies',
      dateSubmitted: 'March 20, 2025'
    },
    {
      id: 5,
      researchCenterId: 'RC-005',
      researchCenter: 'Center for Health Sciences',
      dateSubmitted: 'March 25, 2025'
    },
    {
      id: 6,
      researchCenterId: 'RC-006',
      researchCenter: 'Center for Engineering Research',
      dateSubmitted: 'March 28, 2025'
    }
  ];

  const handleViewClick = (report) => {
    setSelectedReport(report);
  };

  const handleBack = () => {
    setSelectedReport(null);
  };

  // Filter projects based on search and research center
  const filteredProjects = completedProjects.filter(project => {
    const matchesSearch = project.researchCenter.toLowerCase().includes(search.toLowerCase());
    const matchesResearchCenter = selectedResearchCenter === 'all' || project.researchCenterId === selectedResearchCenter;
    return matchesSearch && matchesResearchCenter;
  });

  if (selectedReport) {
    return <ProgressReportDetails report={selectedReport} onBack={handleBack} />;
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

  const FilterBar = ({ fromYear, setFromYear, toYear, setToYear, search, setSearch, selectedResearchCenter, setSelectedResearchCenter }) => (
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

  const TableSection = ({ title, data, headers, renderRow, fromYear, setFromYear, toYear, setToYear, search, setSearch, selectedResearchCenter, setSelectedResearchCenter }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">{data.length} records found</p>
      </div>
      
      {/* Filter Bar */}
      <FilterBar 
        fromYear={fromYear}
        setFromYear={setFromYear}
        toYear={toYear}
        setToYear={setToYear}
        search={search}
        setSearch={setSearch}
        selectedResearchCenter={selectedResearchCenter}
        setSelectedResearchCenter={setSelectedResearchCenter}
      />
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((item, index) => renderRow(item, index))}
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
        <TableSection
          title="Completed Project Reports"
          data={filteredProjects}
          headers={['No', 'Research Center ID', 'Research Center', 'Date Submitted', 'Action']}
          fromYear={fromYear}
          setFromYear={setFromYear}
          toYear={toYear}
          setToYear={setToYear}
          search={search}
          setSearch={setSearch}
          selectedResearchCenter={selectedResearchCenter}
          setSelectedResearchCenter={setSelectedResearchCenter}
          renderRow={(project, index) => (
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
          )}
        />
      </div>
    </div>
  );
};

export default ProgressReportPage; 