import React, { useState, useEffect } from 'react';
import { BiSearch, BiDownload, BiShow, BiCalendar } from 'react-icons/bi';
import rddService from '../../../services/rddService';

const RDDProgressReport = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [progressReports, setProgressReports] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [periodOptions, setPeriodOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const statusProgressMap = {
    1: 20, // Under Review
    2: 45, // Approved
    3: 10, // Rejected
    4: 70, // Ongoing
    5: 100, // Completed
  };

  const formatCurrency = (value, fallback = null) => {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return `₱${numericValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return fallback;
  };

  const formatDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return null;
    }
    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const buildReportPeriod = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return 'No reporting period';
    }
    const quarterIndex = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarterIndex} ${date.getFullYear()}`;
  };

  useEffect(() => {
    fetchProgressReports();
  }, []);

  const fetchProgressReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await rddService.getProposalsForReview();
      if (response.success) {
        const transformedReports = response.data.map((proposal) => {
          const uploadedAt = proposal.uploadedAt ? new Date(proposal.uploadedAt) : null;
          const updatedAt = proposal.updated_at ? new Date(proposal.updated_at) : null;
          const reportPeriod = buildReportPeriod(uploadedAt);
          const statusName = proposal.status?.statusName || 'Unknown';
          const statusId = proposal.statusID;
          const proposedBudgetValue = proposal.proposedBudget ?? null;
          const budgetUtilizedValue = proposal.actualBudgetUtilized ?? proposal.budgetUtilized ?? null;
          const hasBudgetUtilized = Number.isFinite(Number(budgetUtilizedValue));
          const hasTotalBudget = Number.isFinite(Number(proposedBudgetValue));

          const formattedSubmittedDate = formatDate(uploadedAt);
          const formattedUpdatedDate = formatDate(updatedAt);

          return {
            id: proposal.proposalID,
            displayId: `PR-${String(proposal.proposalID).padStart(5, '0')}`,
            projectTitle: proposal.researchTitle || 'Untitled Proposal',
            author: proposal.user ? `${proposal.user.firstName} ${proposal.user.lastName}`.trim() : 'Unknown User',
            college: proposal.user?.department?.name || 'Unassigned Department',
            status: statusName,
            statusId,
            reportPeriod,
            reportPeriodSortKey: uploadedAt ? uploadedAt.getTime() : Number.MAX_SAFE_INTEGER,
            submittedDate: formattedSubmittedDate,
            lastUpdated: formattedUpdatedDate,
            progress: Math.min(Math.max(statusProgressMap[statusId] ?? 0, 0), 100),
            hasBudgetUtilized,
            hasTotalBudget,
            formattedBudgetUtilized: formatCurrency(budgetUtilizedValue, 'Not reported'),
            formattedTotalBudget: formatCurrency(proposedBudgetValue, 'Not set'),
          };
        });

        const uniqueStatuses = Array.from(
          new Set(transformedReports.map((report) => report.status).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));
        setStatusOptions(uniqueStatuses);

        const periodMap = new Map();
        transformedReports.forEach((report) => {
          if (!report.reportPeriod) return;
          const existingSortKey = periodMap.get(report.reportPeriod);
          if (existingSortKey === undefined || report.reportPeriodSortKey < existingSortKey) {
            periodMap.set(report.reportPeriod, report.reportPeriodSortKey);
          }
        });

        const sortedPeriods = Array.from(periodMap.entries())
          .sort((a, b) => a[1] - b[1])
          .map(([label]) => label);
        setPeriodOptions(sortedPeriods);

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

  const filteredReports = progressReports.filter((report) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [report.projectTitle, report.author, report.college, report.displayId]
        .map((field) => (field || '').toLowerCase())
        .some((field) => field.includes(normalizedSearch));

    const matchesStatus = filterStatus === 'All' || report.status === filterStatus;
    const matchesPeriod = filterPeriod === 'All' || report.reportPeriod === filterPeriod;

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const summary = {
    total: progressReports.length,
    underReview: progressReports.filter((report) => report.statusId === 1).length,
    ongoing: progressReports.filter((report) => report.statusId === 4).length,
    completed: progressReports.filter((report) => report.statusId === 5).length,
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Approved':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Ongoing':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    if (progress > 0) return 'bg-orange-500';
    return 'bg-gray-400';
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
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              
              <select 
                value={filterPeriod} 
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="All">All Periods</option>
                {periodOptions.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
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
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px] gap-4 p-4 border-b border-gray-200 font-semibold text-gray-700">
            <div>Project Details</div>
            <div>Author & College</div>
            <div>Status & Timeline</div>
            <div>Progress</div>
            <div>Budget</div>
            <div>Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {filteredReports.map((report) => (
              <div key={report.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px] gap-4 p-4 hover:bg-gray-50 transition-colors duration-150">
                {/* Project Details */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{report.projectTitle}</h3>
                  <div className="text-sm text-gray-600">ID: {report.displayId}</div>
                  <div className="text-sm text-gray-600">
                    {report.submittedDate ? `Submitted: ${report.submittedDate}` : 'Submission pending'}
                  </div>
                </div>

                {/* Author & College */}
                <div>
                  <div className="font-medium text-gray-900">{report.author}</div>
                  <div className="text-sm text-gray-600">{report.college}</div>
                </div>

                {/* Status & Timeline */}
                <div>
                  <div className="mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusClass(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {report.reportPeriod || 'No reporting period'}
                  </div>
                  {report.lastUpdated && (
                    <div className="text-xs text-gray-500 mt-1">Updated: {report.lastUpdated}</div>
                  )}
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
                  <div className={`font-bold ${report.hasBudgetUtilized ? 'text-gray-900' : 'text-gray-500'}`}>
                    {report.hasBudgetUtilized ? report.formattedBudgetUtilized : 'Not reported'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {report.hasTotalBudget
                      ? `of ${report.formattedTotalBudget}`
                      : 'Total budget not recorded'}
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
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-sm text-gray-600">Total Proposals</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {summary.underReview}
            </div>
            <div className="text-sm text-gray-600">Under Review</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summary.ongoing}
            </div>
            <div className="text-sm text-gray-600">Ongoing</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">
              {summary.completed}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RDDProgressReport;
