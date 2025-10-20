import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BiArrowBack } from 'react-icons/bi';

const ProposalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateIssued, setCertificateIssued] = useState(false);

  // Mock project data - in a real app this would come from props or API
  const project = {
    id: id || 'PRO-2025-00022',
    title: 'ARAY KO: Identifying pain through eye contact',
    author: 'Nico Eslawan',
    proposalId: id || 'PRO-2025-00022'
  };

  // Mock completion documents data - supporting multiple documents
  const completionDocuments = {
    terminalReport: {
      name: 'Terminal Report',
      description: 'Technical and financial report',
      documents: [
        {
          fileName: 'terminal_report_pro_2025_00022.pdf',
          uploadDate: '2025-01-15',
          size: '2.4 MB',
          type: 'Main Report'
        },
        {
          fileName: 'financial_summary_pro_2025_00022.pdf',
          uploadDate: '2025-01-16',
          size: '1.2 MB',
          type: 'Financial Summary'
        },
        {
          fileName: 'technical_appendices_pro_2025_00022.pdf',
          uploadDate: '2025-01-17',
          size: '3.1 MB',
          type: 'Technical Appendices'
        }
      ]
    },
    evidence6Ps: {
      name: 'Evidence of 6P\'s',
      description: 'Evidence of People, Planet, Prosperity, Peace, Partnership, and Purpose',
      documents: [
        {
          fileName: 'evidence_6ps_pro_2025_00022.pdf',
          uploadDate: '2025-01-15',
          size: '1.8 MB',
          type: 'Main Evidence'
        },
        {
          fileName: 'people_impact_photos.pdf',
          uploadDate: '2025-01-16',
          size: '4.2 MB',
          type: 'People Impact Photos'
        },
        {
          fileName: 'environmental_impact_assessment.pdf',
          uploadDate: '2025-01-17',
          size: '2.7 MB',
          type: 'Environmental Impact'
        },
        {
          fileName: 'partnership_agreements.pdf',
          uploadDate: '2025-01-18',
          size: '1.5 MB',
          type: 'Partnership Documents'
        }
      ]
    }
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

  const handleEndorse = () => {
    // Store the project data in localStorage so the endorsement page can access it
    localStorage.setItem('selectedProjectForEndorsement', JSON.stringify(project));
    navigate('/review-proposal', { state: { selectedProposal: project } });
  };

  const getCompletionPercentage = () => {
    const completedStages = timelineStages.filter(stage => stage.status === 'completed').length;
    const currentStage = timelineStages.find(stage => stage.status === 'current') ? 1 : 0;
    return Math.round(((completedStages + currentStage * 0.5) / timelineStages.length) * 100);
  };

  const handleOpenPDF = (fileName) => {
    // Use the sample PDF file from the public folder
    const pdfPath = '/sample-document.pdf';
    window.open(pdfPath, '_blank');
  };

  const handleCompletionClick = () => {
    setShowCompletionModal(true);
  };

  const handleIssueCertificate = () => {
    setShowCertificateModal(true);
  };

  const handleConfirmCertificate = () => {
    setCertificateIssued(true);
    setShowCertificateModal(false);
    setShowCompletionModal(false);
    // In a real application, this would trigger an API call to issue the certificate
    alert('Certificate has been issued successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Back Button and Endorse Button */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Projects</span>
            </button>

            {/* Endorse Button */}
            <button
              onClick={handleEndorse}
              className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Endorse Project
            </button>
          </div>

          {/* Project Title and Info */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {project.title}
              </h1>

              <div className="flex flex-wrap gap-4 text-gray-600">
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
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-6 min-w-[280px]">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center mb-8">
            <div className="p-3 bg-red-100 rounded-xl mr-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Project Timeline</h2>
              <p className="text-gray-600">Track your project's progress through each stage</p>
            </div>
          </div>
          
          {/* Horizontal Timeline */}
          <div className="relative">
            {/* Scrollable Timeline Container */}
            <div className="overflow-x-auto pb-4">
              <div className="flex justify-between items-start relative min-w-max px-4">
                {timelineStages.map((stage, index) => (
                  <div key={stage.id} className="flex flex-col items-center relative mx-8">
                    {/* Stage Dot */}
                    <div 
                      className={`w-12 h-12 rounded-full ${getStatusColor(stage.status)} mb-4 relative z-10 ${
                        stage.name === 'For Completion' ? 'cursor-pointer hover:scale-110 transition-transform duration-200' : ''
                      }`}
                      onClick={stage.name === 'For Completion' ? handleCompletionClick : undefined}
                    >
                      {stage.status === 'completed' && (
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-green-200">
                          <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Connecting Line */}
                    {index < timelineStages.length - 1 && (
                      <div className="absolute top-3 left-full w-16 h-0.5 bg-gray-300 z-0">
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
                      className={`px-4 py-2 rounded-lg text-center min-w-32 ${
                        stage.status === 'current' ? 'bg-red-50 border border-red-200' : 
                        stage.status === 'completed' ? 'bg-green-50 border border-green-200' : 
                        'bg-gray-50 border border-gray-200'
                      } ${
                        stage.name === 'For Completion' ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all duration-200' : ''
                      }`}
                      onClick={stage.name === 'For Completion' ? handleCompletionClick : undefined}
                    >
                      <span className={`text-sm font-medium ${getStatusTextColor(stage.status)} leading-tight ${
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
          <div className="p-8 pb-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-red-100 rounded-xl mr-4">
                                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Status History</h2>
                <p className="text-gray-600">Detailed timeline of all project activities</p>
              </div>
            </div>
          </div>

          {/* Enhanced Status History Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-y border-gray-200">
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                    Date & Time
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                    Action Details
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody>
                {statusHistory.map((entry, index) => (
                  <tr key={index} className={`hover:bg-gray-50 transition-colors duration-200 ${
                    index !== statusHistory.length - 1 ? 'border-b border-gray-100' : ''
                  }`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{entry.date}</div>
                          <div className="text-xs text-gray-500">Recently updated</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          index === 0 ? 'bg-red-600 animate-pulse' : 'bg-green-500'
                        }`}></div>
                        <span className={`text-sm font-medium ${
                          index === 0 ? 'text-red-700' : 'text-gray-900'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm text-gray-600 leading-relaxed">
                        {entry.action || 'No additional details'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
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

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2025 University Of Southeastern Philippines. All rights reserved.
          </p>
        </div>
      </div>

      {/* Completion Documents Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Completion Documents</h3>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Terminal Report Section */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{completionDocuments.terminalReport.name}</h4>
                    <p className="text-gray-600 mb-4">{completionDocuments.terminalReport.description}</p>
                    <div className="text-sm text-gray-500 mb-3">
                      <span className="font-medium">{completionDocuments.terminalReport.documents.length} documents uploaded</span>
                    </div>
                  </div>
                </div>
                
                {/* Terminal Report Documents List */}
                <div className="space-y-3">
                  {completionDocuments.terminalReport.documents.map((doc, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{doc.type}</div>
                          <div className="text-sm text-gray-500">
                            {doc.uploadDate} • {doc.size}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenPDF(doc.fileName)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>View</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence of 6P's Section */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{completionDocuments.evidence6Ps.name}</h4>
                    <p className="text-gray-600 mb-4">{completionDocuments.evidence6Ps.description}</p>
                    <div className="text-sm text-gray-500 mb-3">
                      <span className="font-medium">{completionDocuments.evidence6Ps.documents.length} documents uploaded</span>
                    </div>
                  </div>
                </div>
                
                {/* Evidence 6P's Documents List */}
                <div className="space-y-3">
                  {completionDocuments.evidence6Ps.documents.map((doc, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{doc.type}</div>
                          <div className="text-sm text-gray-500">
                            {doc.uploadDate} • {doc.size}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenPDF(doc.fileName)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>View</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {certificateIssued ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Certificate Issued</span>
                  </div>
                ) : (
                  <span>All documents reviewed and ready for certificate issuance</span>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                >
                  Close
                </button>
                {!certificateIssued && (
                  <button
                    onClick={handleIssueCertificate}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Issue the Certificate</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Issuance Confirmation Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Issue Completion Certificate</h3>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Confirm Certificate Issuance</h4>
                <p className="text-gray-600">
                  Are you sure you want to issue the completion certificate for this project? 
                  This action will mark the project as officially completed.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600">
                  <div className="font-medium text-gray-900 mb-2">Project Details:</div>
                  <div className="space-y-1">
                    <div><span className="font-medium">Title:</span> {project.title}</div>
                    <div><span className="font-medium">ID:</span> {project.proposalId}</div>
                    <div><span className="font-medium">Author:</span> {project.author}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCertificate}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Issue Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalDetail; 