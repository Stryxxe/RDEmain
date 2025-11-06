import React, { useState, useEffect } from 'react';
import { BiSearch, BiFilter, BiDownload, BiShow, BiCalendar } from 'react-icons/bi';
import rddService from '../../../services/rddService';

const RDDProgressReport = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [progressReports, setProgressReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgressReports();
  }, []);

  const fetchProgressReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await rddService.getProposalsForReview();
      if (response.success) {
        // Transform the data to match the expected format for progress reports
        const transformedReports = response.data.map(proposal => {
          const currentDate = new Date();
          const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // End of current month
          const isOverdue = dueDate < currentDate && proposal.statusID !== 5; // Not completed
          const sourceDate = proposal.uploadedAt ? new Date(proposal.uploadedAt) : currentDate;
          const quarterIndex = Math.floor(sourceDate.getMonth() / 3) + 1; // 1-4
          const dynamicReportPeriod = `Q${quarterIndex} ${sourceDate.getFullYear()}`;
          
          return {
            id: proposal.proposalID, // Use actual database ID for routing
            displayId: `PR-2025-${String(proposal.proposalID).padStart(5, '0')}`, // Formatted ID for display
            projectTitle: proposal.researchTitle,
            author: proposal.user ? `${proposal.user.firstName} ${proposal.user.lastName}` : 'Unknown',
            college: proposal.user?.department?.name || 'Unknown Department',
            status: isOverdue ? 'Overdue' : (proposal.status?.statusName || 'Draft'),
            reportPeriod: dynamicReportPeriod,
            dueDate: dueDate.toISOString().split('T')[0],
            submittedDate: proposal.statusID === 5 ? dueDate.toISOString().split('T')[0] : null,
            progress: proposal.statusID === 5 ? 100 : (proposal.statusID === 4 ? 50 : 25),
            budgetUtilized: `₱${Number(proposal.proposedBudget * 0.25).toLocaleString()}`,
            totalBudget: `₱${Number(proposal.proposedBudget).toLocaleString()}`,
            nextMilestone: 'Data Collection Phase', // Default milestone
            issues: isOverdue ? 'Report overdue' : 'None'
          };
        });
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

  const filteredReports = progressReports.filter(report => {
    const matchesSearch = report.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.college.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || report.status === filterStatus;
    const matchesPeriod = filterPeriod === 'All' || report.reportPeriod === filterPeriod;
    
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Submitted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Overdue':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
            Progress Reports
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Monitor and review research project progress reports
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
                placeholder="Search reports..."
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
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Overdue">Overdue</option>
              </select>
              
              <select 
                value={filterPeriod} 
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="All">All Periods</option>
                <option value="Q1 2025">Q1 2025</option>
                <option value="Q2 2025">Q2 2025</option>
                <option value="Q3 2025">Q3 2025</option>
                <option value="Q4 2025">Q4 2025</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              <BiDownload className="text-sm" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
              <BiCalendar className="text-sm" />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Progress Reports Table */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_120px] gap-4 p-4 border-b border-gray-200 font-semibold text-gray-700">
            <div>Project Details</div>
            <div>Author & College</div>
            <div>Status & Period</div>
            <div>Progress</div>
            <div>Budget</div>
            <div>Next Milestone</div>
            <div>Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {filteredReports.map((report, index) => (
              <div key={index} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_120px] gap-4 p-4 hover:bg-gray-50 transition-colors duration-150">
                {/* Project Details */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{report.projectTitle}</h3>
                  <div className="text-sm text-gray-600">ID: {report.displayId}</div>
                  <div className="text-sm text-gray-600">
                    Due: {report.dueDate} 
                    {isOverdue(report.dueDate) && report.status !== 'Approved' && (
                      <span className="text-red-600 font-semibold ml-2">(Overdue)</span>
                    )}
                  </div>
                  {report.submittedDate && (
                    <div className="text-sm text-gray-600">Submitted: {report.submittedDate}</div>
                  )}
                </div>

                {/* Author & College */}
                <div>
                  <div className="font-medium text-gray-900">{report.author}</div>
                  <div className="text-sm text-gray-600">{report.college}</div>
                </div>

                {/* Status & Period */}
                <div>
                  <div className="mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusClass(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{report.reportPeriod}</div>
                </div>

                {/* Progress */}
                <div>
                  <div className="mb-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(report.progress)} transition-all duration-300`}
                        style={{ width: `${report.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">{report.progress}% complete</div>
                </div>

                {/* Budget */}
                <div>
                  <div className="font-bold text-gray-900">{report.budgetUtilized}</div>
                  <div className="text-sm text-gray-600">of {report.totalBudget}</div>
                </div>

                {/* Next Milestone */}
                <div>
                  <div className="text-sm text-gray-900">{report.nextMilestone}</div>
                  {report.issues && report.issues !== 'None' && (
                    <div className="text-xs text-red-600 mt-1">⚠️ {report.issues}</div>
                  )}
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
            <div className="text-2xl font-bold text-gray-900">{progressReports.length}</div>
            <div className="text-sm text-gray-600">Total Reports</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {progressReports.filter(r => r.status === 'Draft').length}
            </div>
            <div className="text-sm text-gray-600">Draft</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {progressReports.filter(r => r.status === 'Submitted').length}
            </div>
            <div className="text-sm text-gray-600">Submitted</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600">
              {progressReports.filter(r => r.status === 'Overdue').length}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RDDProgressReport;
