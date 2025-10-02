import React, { useState } from 'react';
import { BiSearch, BiShow } from 'react-icons/bi';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';

const Dashboard = () => {
  const [fromYear, setFromYear] = useState('2025');
  const [toYear, setToYear] = useState('2025');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Title');

  const statsData = [
    {
      number: '49',
      label: 'Total of Submitted Proposals'
    },
    {
      number: '18',
      label: 'Under Review'
    },
    {
      number: '31',
      label: 'Done/Utilized Proposals'
    }
  ];

  const researchData = [
    {
      id: 'PRO-2025-00029',
      title: 'AI-Powered Educational Assessment Tools',
      author: 'Prof. Michael Chen',
      college: 'College of Computer Science',
      status: 'Under Review',
      progress: 20,
      budget: 250000,
      submittedDate: '4/2/2025'
    },
    {
      id: 'PRO-2025-00025',
      title: 'ARAY KO: Identifying pain through eye contact',
      author: 'Dr. Nico Eslawan',
      college: 'College of Engineering',
      status: 'Completed',
      progress: 100,
      budget: 180000,
      submittedDate: '1/15/2025'
    },
    {
      id: 'PRO-2025-00028',
      title: 'Community Health Initiatives and Wellness Programs',
      author: 'Dr. Ana Rodriguez',
      college: 'College of Medicine',
      status: 'Ongoing',
      progress: 45,
      budget: 320000,
      submittedDate: '3/20/2025'
    },
    {
      id: 'PRO-2025-00026',
      title: 'Digital Transformation in Local Government Units',
      author: 'Prof. Maria Santos',
      college: 'College of Business',
      status: 'Completed',
      progress: 100,
      budget: 150000,
      submittedDate: '2/10/2025'
    },
    {
      id: 'PRO-2025-00030',
      title: 'Marine Biodiversity Conservation Project',
      author: 'Dr. Sarah Johnson',
      college: 'College of Marine Sciences',
      status: 'Ongoing',
      progress: 30,
      budget: 450000,
      submittedDate: '4/15/2025'
    }
  ];

  const filteredResearch = researchData.filter(research =>
    research.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    research.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    research.college.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Ongoing':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'Under Review':
        return 'bg-blue-500';
      case 'Ongoing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

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
            {filteredResearch.map((research, index) => (
              <div key={index} className="grid grid-cols-[2fr_1fr_1fr_1fr_120px] gap-4 p-4 hover:bg-gray-50 transition-colors duration-150">
                {/* Project Details */}
                <div>
                  <Link 
                    to={`/proposal/${research.id}`}
                    className="font-bold text-gray-900 mb-1 hover:text-blue-600 transition-colors duration-200 cursor-pointer block"
                  >
                    {research.title}
                  </Link>
                  <div className="text-sm text-gray-600">ID: {research.id}</div>
                  <div className="text-sm text-gray-600">Submitted: {research.submittedDate}</div>
                </div>

                {/* Author & College */}
                <div>
                  <div className="font-medium text-gray-900">{research.author}</div>
                  <div className="text-sm text-gray-600">{research.college}</div>
                </div>

                {/* Status & Progress */}
                <div>
                  <div className="mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusClass(research.status)}`}>
                      {research.status}
                    </span>
                  </div>
                  <div className="mb-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(research.status)} transition-all duration-300`}
                        style={{ width: `${research.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">{research.progress}% complete</div>
                </div>

                {/* Budget */}
                <div>
                  <div className="font-semibold text-gray-900">
                    ₱{research.budget.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Budget</div>
                </div>

                {/* Actions */}
                <div className="flex items-center">
                  <Link to={`/proposal/${research.id}`}>
                    <button className="border border-red-500 text-red-500 bg-white px-3 py-1 rounded text-sm font-medium hover:bg-red-50 transition-colors duration-150 flex items-center gap-1">
                      <BiShow className="text-sm" />
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 