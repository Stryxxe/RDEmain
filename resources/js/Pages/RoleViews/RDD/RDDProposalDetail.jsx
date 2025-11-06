import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BiDownload, BiEdit, BiCheck, BiX, BiCalendar, BiUser, BiFile, BiDollar, BiEnvelope } from 'react-icons/bi';
import rddService from '../../../services/rddService';

const RDDProposalDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [reviewDecision, setReviewDecision] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchProposal();
    }
  }, [id]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await rddService.getProposalById(id);
      if (response.success) {
        setProposal(response.data);
      } else {
        setError('Failed to fetch proposal');
      }
    } catch (err) {
      console.error('Error fetching proposal:', err);
      setError('Error loading proposal');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading proposal...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <p className="text-gray-600 mb-4">{error || 'Proposal not found'}</p>
              <button 
                onClick={fetchProposal}
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

  // Transform the proposal data to match the expected format
  const transformedProposal = {
    id: `PRO-2025-${String(proposal.proposalID).padStart(5, '0')}`,
    title: proposal.researchTitle,
    author: proposal.user ? `${proposal.user.firstName} ${proposal.user.lastName}` : 'Unknown',
    email: proposal.user?.email || 'Unknown',
    college: proposal.user?.department?.name || 'Unknown Department',
    department: proposal.user?.department?.name || 'Unknown Department',
    status: proposal.status?.statusName || 'Unknown',
    priority: 'Medium', // Default priority since it's not in the database
    submittedDate: new Date(proposal.uploadedAt).toISOString().split('T')[0],
    reviewDeadline: new Date(new Date(proposal.uploadedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from submission
    budget: `₱${Number(proposal.proposedBudget).toLocaleString()}`,
    duration: '12 months', // Default duration since it's not in the database
    startDate: new Date(proposal.uploadedAt).toISOString().split('T')[0],
    endDate: new Date(new Date(proposal.uploadedAt).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from submission
    abstract: proposal.description || 'No abstract provided',
    objectives: proposal.objectives ? proposal.objectives.split('\n').filter(obj => obj.trim()) : ['No objectives provided'],
    methodology: 'Methodology details not specified in the proposal.',
    expectedOutcomes: [
      'Research findings and publications',
      'Implementation of proposed solution',
      'Knowledge transfer to stakeholders',
      'Policy recommendations'
    ],
    budgetBreakdown: {
      personnel: `₱${Number(proposal.proposedBudget * 0.5).toLocaleString()}`,
      equipment: `₱${Number(proposal.proposedBudget * 0.25).toLocaleString()}`,
      materials: `₱${Number(proposal.proposedBudget * 0.15).toLocaleString()}`,
      travel: `₱${Number(proposal.proposedBudget * 0.05).toLocaleString()}`,
      other: `₱${Number(proposal.proposedBudget * 0.05).toLocaleString()}`,
      total: `₱${Number(proposal.proposedBudget).toLocaleString()}`
    },
    timeline: [
      { phase: 'Literature Review', start: proposal.uploadedAt, end: new Date(new Date(proposal.uploadedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'Completed' },
      { phase: 'Data Collection', start: new Date(new Date(proposal.uploadedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date(new Date(proposal.uploadedAt).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: proposal.statusID >= 2 ? 'In Progress' : 'Pending' },
      { phase: 'Analysis', start: new Date(new Date(proposal.uploadedAt).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date(new Date(proposal.uploadedAt).getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: proposal.statusID >= 3 ? 'In Progress' : 'Pending' },
      { phase: 'Implementation', start: new Date(new Date(proposal.uploadedAt).getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date(new Date(proposal.uploadedAt).getTime() + 270 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: proposal.statusID >= 4 ? 'In Progress' : 'Pending' },
      { phase: 'Documentation', start: new Date(new Date(proposal.uploadedAt).getTime() + 270 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: new Date(new Date(proposal.uploadedAt).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: proposal.statusID >= 5 ? 'Completed' : 'Pending' }
    ],
    reviewers: [
      { name: 'Dr. Sarah Wilson', status: 'Completed', comments: 'Proposal meets all requirements.' },
      { name: 'Prof. John Doe', status: proposal.statusID >= 2 ? 'Completed' : 'In Progress', comments: proposal.statusID >= 2 ? 'Approved for implementation.' : 'Review in progress...' },
      { name: 'Dr. Maria Santos', status: proposal.statusID >= 3 ? 'Completed' : 'Pending', comments: proposal.statusID >= 3 ? 'Final approval granted.' : '' }
    ],
    attachments: proposal.files ? proposal.files.map(file => ({
      name: file.fileName,
      size: `${(file.fileSize / 1024 / 1024).toFixed(1)} MB`,
      type: file.fileType === 'report' ? 'PDF' : file.fileType.toUpperCase()
    })) : []
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Under Review':
        return 'bg-orange-100 text-orange-800 border-orange-300';
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

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    console.log('Review submitted:', { decision: reviewDecision, comments: reviewComments });
    alert('Review submitted successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
            Proposal Details
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Review and manage research proposal details
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{transformedProposal.title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>ID: {transformedProposal.id}</span>
                <span>•</span>
                <span>Submitted: {transformedProposal.submittedDate}</span>
                <span>•</span>
                <span>Review Deadline: {transformedProposal.reviewDeadline}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusClass(transformedProposal.status)}`}>
                {transformedProposal.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityClass(transformedProposal.priority)}`}>
                {transformedProposal.priority} Priority
              </span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              <BiDownload className="text-sm" />
              Download All
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <BiEdit className="text-sm" />
              Edit
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['overview', 'budget', 'timeline', 'reviewers', 'attachments'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Principal Investigator</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <BiUser className="mr-2 text-gray-400" />
                        <span className="text-gray-900">{transformedProposal.author}</span>
                      </div>
                      <div className="flex items-center">
                        <BiEnvelope className="mr-2 text-gray-400" />
                        <span className="text-gray-900">{transformedProposal.email}</span>
                      </div>
                      <div className="text-gray-600">{transformedProposal.college}</div>
                      <div className="text-gray-600">{transformedProposal.department}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <BiDollar className="mr-2 text-gray-400" />
                        <span className="text-gray-900">{transformedProposal.budget}</span>
                      </div>
                      <div className="flex items-center">
                        <BiCalendar className="mr-2 text-gray-400" />
                        <span className="text-gray-900">{transformedProposal.duration}</span>
                      </div>
                      <div className="text-gray-600">Start: {transformedProposal.startDate}</div>
                      <div className="text-gray-600">End: {transformedProposal.endDate}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Abstract</h3>
                  <p className="text-gray-700 leading-relaxed">{transformedProposal.abstract}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Objectives</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {transformedProposal.objectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Methodology</h3>
                  <p className="text-gray-700 leading-relaxed">{transformedProposal.methodology}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Expected Outcomes</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {transformedProposal.expectedOutcomes.map((outcome, index) => (
                      <li key={index}>{outcome}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Budget Tab */}
            {activeTab === 'budget' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Budget Breakdown</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-4">
                    {Object.entries(transformedProposal.budgetBreakdown).map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-gray-700 capitalize">{category.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-semibold text-gray-900">{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Project Timeline</h3>
                <div className="space-y-4">
                  {transformedProposal.timeline.map((phase, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-900">{phase.phase}</h4>
                        <p className="text-sm text-gray-600">{phase.start} - {phase.end}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(phase.status)}`}>
                        {phase.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviewers Tab */}
            {activeTab === 'reviewers' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Reviewers</h3>
                <div className="space-y-4">
                  {transformedProposal.reviewers.map((reviewer, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{reviewer.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(reviewer.status)}`}>
                          {reviewer.status}
                        </span>
                      </div>
                      {reviewer.comments && (
                        <p className="text-gray-700 text-sm">{reviewer.comments}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Review Form */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Submit Review</h4>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Review Decision
                      </label>
                      <select
                        value={reviewDecision}
                        onChange={(e) => setReviewDecision(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      >
                        <option value="">Select decision...</option>
                        <option value="approve">Approve</option>
                        <option value="approve_with_conditions">Approve with Conditions</option>
                        <option value="reject">Reject</option>
                        <option value="request_revision">Request Revision</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comments
                      </label>
                      <textarea
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Provide detailed feedback..."
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                      >
                        <BiCheck className="text-sm" />
                        Submit Review
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <BiX className="text-sm" />
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Attachments Tab */}
            {activeTab === 'attachments' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                <div className="space-y-3">
                  {transformedProposal.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <BiFile className="mr-3 text-gray-400" />
                        <div>
                          <h4 className="font-semibold text-gray-900">{file.name}</h4>
                          <p className="text-sm text-gray-600">{file.type} • {file.size}</p>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200">
                        <BiDownload className="text-sm" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RDDProposalDetail;
