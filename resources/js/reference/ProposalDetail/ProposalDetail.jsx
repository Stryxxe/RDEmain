import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const ProposalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    terminalReport: null,
    evidence6Ps: null
  });



  // Mock project data - in a real app this would come from props or API
  const project = {
    id: id || 'PRO-2025-00022',
    title: 'ARAY KO: Identifying pain through eye contact',
    author: 'Nico Eslawan',
    proposalId: id || 'PRO-2025-00022'
  };

  // Timeline stages data
  const timelineStages = [
    { id: 1, name: 'College Endorsement', status: 'completed' },
    { id: 2, name: 'R&D Division', status: 'completed' },
    { id: 3, name: 'Proposal Review', status: 'completed' },
    { id: 4, name: 'Ethics Review', status: 'current' },
    { id: 5, name: 'OVPRDE', status: 'pending' },
    { id: 6, name: 'President', status: 'pending' },
    { id: 7, name: 'OSOURU', status: 'pending' },
    { id: 8, name: 'Implementation', status: 'pending' },
    { id: 9, name: 'Monitoring', status: 'pending' },
    { id: 10, name: 'For Completion', status: 'pending' }
  ];

  // Status history data
  const statusHistory = [
    {
      date: 'July 14, 2025',
      status: 'College Endorsement',
      action: 'Proposal submitted for initial review and endorsement by the college committee.',
      priority: 'high'
    },
    {
      date: 'July 12, 2025',
      status: 'R&D Division Review',
      action: 'Proposal forwarded to R&D Division for technical assessment and evaluation.',
      priority: 'medium'
    },
    {
      date: 'July 10, 2025',
      status: 'Proposal Review',
      action: 'Initial proposal review completed with minor revisions requested.',
      priority: 'medium'
    },
    {
      date: 'July 8, 2025',
      status: 'Ethics Review',
      action: 'Currently under ethics committee review for compliance and safety assessment.',
      priority: 'high'
    }
  ];

  // Helper functions for styling
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'current':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-700';
      case 'current':
        return 'text-red-700';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCompletionPercentage = () => {
    const completedStages = timelineStages.filter(stage => stage.status === 'completed').length;
    const currentStage = timelineStages.find(stage => stage.status === 'current') ? 1 : 0;
    return Math.round(((completedStages + currentStage * 0.5) / timelineStages.length) * 100);
  };

  const handleCompletionClick = () => {
    setShowUploadModal(true);
  };

  const handleFileUpload = (fileType, file) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: file
    }));
  };

  const handleSubmitCompletion = () => {
    // Here you would typically send the files to your backend
    console.log('Submitting completion files:', uploadedFiles);
    setShowUploadModal(false);
    // You might want to show a success message here
  };

  return (
    <Layout>
      <div className="w-full max-w-full mx-auto space-y-8 px-2 sm:px-4 md:px-6 lg:px-8 overflow-hidden" style={{ maxWidth: '100vw', width: '100%' }}>
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 lg:p-8">
          {/* Back Button */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Projects</span>
            </button>
          </div>

          {/* Project Title and Info */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {project.title}
              </h1>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 text-gray-600">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">ID:</span>
                  <span className="ml-1">{project.proposalId}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">Author:</span>
                  <span className="ml-1">{project.author}</span>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-3 sm:p-4 md:p-6 w-full lg:min-w-[240px] xl:min-w-[280px] lg:w-auto flex-shrink-0">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1">
                  {getCompletionPercentage()}%
                </div>
                <div className="text-sm text-red-700 font-medium mb-3">Project Progress</div>
                <div className="w-full bg-red-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getCompletionPercentage()}%` }}
                  ></div>
                </div>
                <div className="text-xs text-red-600 mt-2">
                  {timelineStages.filter(s => s.status === 'completed').length} of {timelineStages.length} stages completed
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Timeline Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
            <div className="p-3 bg-red-100 rounded-xl mr-0 sm:mr-4 w-fit">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Project Timeline</h2>
              <p className="text-gray-600">Track your project's progress through each stage</p>
              <p className="text-xs text-gray-400 mt-1">← Scroll horizontally to view all stages →</p>
            </div>
          </div>

          {/* Horizontal Timeline */}
          <div className="relative">
            {/* Scrollable Timeline Container */}
            <div className="overflow-x-auto pb-4">
              <div className="flex justify-between items-start relative min-w-max px-4">
                {timelineStages.map((stage, index) => (
                  <div key={stage.id} className="flex flex-col items-center relative mx-4 sm:mx-8">
                    {/* Stage Dot */}
                    <div 
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${getStatusColor(stage.status)} mb-4 relative z-10 ${
                        stage.name === 'For Completion' ? 'cursor-pointer hover:scale-110 transition-transform duration-200' : ''
                      }`}
                      onClick={stage.name === 'For Completion' ? handleCompletionClick : undefined}
                    >
                      {stage.status === 'completed' && (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center border-2 border-green-200">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Connecting Line */}
                    {index < timelineStages.length - 1 && (
                      <div className="absolute top-2 sm:top-3 left-full w-8 sm:w-16 h-0.5 bg-gray-300 z-0">
                        <div
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{
                            width: stage.status === 'completed' ? '100%' : '0%'
                          }}
                        ></div>
                      </div>
                    )}

                    {/* Stage Label */}
                    <div 
                      className={`px-3 sm:px-4 py-2 rounded-lg text-center min-w-24 sm:min-w-32 ${stage.status === 'current' ? 'bg-red-50 border border-red-200' :
                        stage.status === 'completed' ? 'bg-green-50 border border-green-200' :
                          'bg-gray-50 border border-gray-200'
                      } ${stage.name === 'For Completion' ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors duration-200' : ''}`}
                      onClick={stage.name === 'For Completion' ? handleCompletionClick : undefined}
                    >
                      <span className={`text-xs sm:text-sm font-medium ${getStatusTextColor(stage.status)} leading-tight ${
                        stage.name === 'For Completion' ? 'hover:text-blue-700' : ''
                      }`}>
                        {stage.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status History Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center mb-6 space-y-4 sm:space-y-0">
              <div className="p-3 bg-blue-100 rounded-xl mr-0 sm:mr-4 w-fit">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Status History</h2>
                <p className="text-gray-600">Detailed timeline of all project activities</p>
              </div>
            </div>
          </div>

          {/* Enhanced Status History Table */}
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-y border-gray-200">
                  <th className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 text-left text-sm font-semibold text-gray-700 min-w-24">
                    Date & Time
                  </th>
                  <th className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 text-left text-sm font-semibold text-gray-700 min-w-20">
                    Status
                  </th>
                  <th className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 text-left text-sm font-semibold text-gray-700 min-w-48">
                    Action Details
                  </th>
                  <th className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 text-left text-sm font-semibold text-gray-700 min-w-20">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody>
                {statusHistory.map((entry, index) => (
                  <tr key={index} className={`hover:bg-gray-50 transition-colors duration-200 ${index !== statusHistory.length - 1 ? 'border-b border-gray-100' : ''
                    }`}>
                    <td className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{entry.date}</div>
                          <div className="text-xs text-gray-500">Recently updated</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${index === 0 ? 'bg-red-600 animate-pulse' : 'bg-green-500'
                          }`}></div>
                        <span className={`text-sm font-medium ${index === 0 ? 'text-red-700' : 'text-gray-900'
                          }`}>
                          {entry.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                      <span className="text-sm text-gray-600 leading-relaxed break-words max-w-xs">
                        {entry.action || 'No additional details'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(entry.priority)}`}>
                        {entry.priority?.toUpperCase() || 'NORMAL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ scrollBehavior: 'smooth' }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Submit Completion Documents</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Terminal Report Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors">
                  <div className="mb-3">
                    <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Terminal Report</h4>
                  <p className="text-sm text-gray-600 mb-3">Upload PDF file containing technical and financial report</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload('terminalReport', e.target.files[0])}
                    className="hidden"
                    id="terminal-report"
                  />
                  <label
                    htmlFor="terminal-report"
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose File
                  </label>
                  {uploadedFiles.terminalReport && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {uploadedFiles.terminalReport.name}
                    </p>
                  )}
                </div>

                {/* Evidence of 6P's Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors">
                  <div className="mb-3">
                    <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Evidence of 6P's</h4>
                  <p className="text-sm text-gray-600 mb-3">Upload PDF file containing evidence of People, Planet, Prosperity, Peace, Partnership, and Purpose</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload('evidence6Ps', e.target.files[0])}
                    className="hidden"
                    id="evidence-6ps"
                  />
                  <label
                    htmlFor="evidence-6ps"
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose File
                  </label>
                  {uploadedFiles.evidence6Ps && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {uploadedFiles.evidence6Ps.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitCompletion}
                  disabled={!uploadedFiles.terminalReport || !uploadedFiles.evidence6Ps}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Completion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProposalDetail;
