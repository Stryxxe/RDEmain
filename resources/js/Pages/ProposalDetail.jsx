import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Eye, X } from 'lucide-react';
import apiService from '../services/api';

const ProposalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingFile, setViewingFile] = useState(null);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    terminalReport: null,
    evidence6Ps: null
  });

  useEffect(() => {
    if (id) {
      loadProposal();
    }
  }, [id]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getProposal(id);
      
      if (response.success) {
        setProposal(response.data);
      } else {
        setError(response.message || 'Failed to load proposal');
      }
    } catch (error) {
      setError('Failed to load proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statusId) => {
    switch (statusId) {
      case 1: return 'bg-red-500'; // Under Review
      case 2: return 'bg-green-500'; // Approved
      case 3: return 'bg-red-600'; // Rejected
      case 4: return 'bg-orange-500'; // Ongoing
      case 5: return 'bg-green-600'; // Completed
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₱0';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleDownloadFile = (file) => {
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = `/storage/${file.filePath}`;
    link.download = file.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewFile = (file) => {
    const fileUrl = `/storage/${file.filePath}`;
    
    // Test if the file exists first
    fetch(fileUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          setViewingFile({ ...file, url: fileUrl });
          setFileViewerOpen(true);
        } else {
        }
      })
      .catch(error => {
      });
  };

  const closeFileViewer = () => {
    setFileViewerOpen(false);
    setViewingFile(null);
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

  const getCompletionPercentage = () => {
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
    const completedStages = timelineStages.filter(stage => stage.status === 'completed').length;
    const currentStage = timelineStages.find(stage => stage.status === 'current') ? 1 : 0;
    return Math.round(((completedStages + currentStage * 0.5) / timelineStages.length) * 100);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading proposal details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-64">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Proposal</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/proponent/projects')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h1>
          <p className="text-gray-600 mb-4">The requested proposal could not be found.</p>
          <p className="text-sm text-gray-500 mb-4">Proposal ID: {id}</p>
          <button
            onClick={() => navigate('/proponent/projects')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const matrix = proposal.matrixOfCompliance || {};
  

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/proponent/projects')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Back to Projects</span>
            </button>
            
            <button
              onClick={() => navigate(`/proponent/tracker/${id}`)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 group"
            >
              <Eye size={16} className="group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Track Progress</span>
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 border border-red-100">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600">Research Proposal</p>
                    <p className="text-xs text-gray-500">ID: {proposal.proposalID}</p>
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">
                  {proposal.researchTitle || 'Untitled Proposal'}
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  Submitted on {new Date(proposal.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-lg ${getStatusColor(proposal.statusID)}`}>
                  {proposal.status?.statusName || 'Unknown Status'}
                </span>
                {matrix.proposedBudget && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Proposed Budget</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(matrix.proposedBudget)}</p>
                  </div>
                )}
                {/* Progress Card */}
                <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-4 w-full lg:min-w-[240px] xl:min-w-[280px] lg:w-auto flex-shrink-0">
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
                      3 of 10 stages completed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Research Center</label>
              <p className="text-lg font-medium text-gray-900">{matrix.researchCenter || 'Not specified'}</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Funding Status</label>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${proposal.statusID === 2 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <p className="text-lg font-medium text-gray-900">
                  {proposal.statusID === 2 ? 'Approved' : 'Pending RDD Approval'}
                </p>
              </div>
              {proposal.statusID !== 2 && matrix.proposedBudget && (
                <p className="text-sm text-gray-500 mt-2">
                  Proposed: {formatCurrency(matrix.proposedBudget)}
                </p>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Submitted Date</label>
              <p className="text-lg font-medium text-gray-900">
                {new Date(proposal.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Research Details Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Research Details</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Description</label>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{matrix.description || 'Not specified'}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Objectives</label>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{matrix.objectives || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tags and Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Research Agenda */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Research Agenda</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(matrix.researchAgenda || []).map((agenda, index) => (
                <span key={index} className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200">
                  {agenda}
                </span>
              ))}
              {(!matrix.researchAgenda || matrix.researchAgenda.length === 0) && (
                <p className="text-gray-500 text-sm">No research agenda specified</p>
              )}
            </div>
          </div>

          {/* DOST Strategic Programs */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">DOST Programs</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(matrix.dostSPs || []).map((sp, index) => (
                <span key={index} className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors duration-200">
                  {sp}
                </span>
              ))}
              {(!matrix.dostSPs || matrix.dostSPs.length === 0) && (
                <p className="text-gray-500 text-sm">No DOST programs specified</p>
              )}
            </div>
          </div>

          {/* Sustainable Development Goals */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">SDGs</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(matrix.sustainableDevelopmentGoals || []).map((sdg, index) => (
                <span key={index} className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors duration-200">
                  {sdg}
                </span>
              ))}
              {(!matrix.sustainableDevelopmentGoals || matrix.sustainableDevelopmentGoals.length === 0) && (
                <p className="text-gray-500 text-sm">No SDGs specified</p>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Files Section */}
        {proposal.files && proposal.files.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Attached Files</h2>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                {proposal.files.length} file{proposal.files.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proposal.files.map((file) => (
                <div key={file.fileID} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors duration-200 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{file.fileName}</h3>
                      <p className="text-xs text-gray-500 mb-3">{file.formattedSize || `${Math.round(file.fileSize / 1024)} KB`}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewFile(file)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                          title="View file"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadFile(file)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors duration-200"
                          title="Download file"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced File Viewer Modal */}
        {fileViewerOpen && viewingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl max-h-[95vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{viewingFile.fileName}</h3>
                  <p className="text-sm text-gray-500">{viewingFile.formattedSize || `${Math.round(viewingFile.fileSize / 1024)} KB`}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadFile(viewingFile)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors duration-200"
                  title="Download file"
                >
                  <Download size={18} />
                  Download
                </button>
                <button
                  onClick={closeFileViewer}
                  className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-4 h-[70vh] overflow-auto">
              {viewingFile.fileName.toLowerCase().endsWith('.pdf') ? (
                <div className="h-full">
                  <iframe
                    src={viewingFile.url}
                    className="w-full h-full border-0"
                    title={viewingFile.fileName}
                    onError={() => {}}
                  />
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-500 mb-2">
                      If the PDF doesn't load, try downloading it instead.
                    </p>
                    <button
                      onClick={() => window.open(viewingFile.url, '_blank')}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Open in New Tab
                    </button>
                  </div>
                </div>
              ) : viewingFile.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                <img
                  src={viewingFile.url}
                  alt={viewingFile.fileName}
                  className="max-w-full max-h-full mx-auto"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {viewingFile.fileName}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    This file type cannot be previewed in the browser.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(viewingFile.url, '_blank')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Open in New Tab
                    </button>
                    <button
                      onClick={() => handleDownloadFile(viewingFile)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Download File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default ProposalDetail;
