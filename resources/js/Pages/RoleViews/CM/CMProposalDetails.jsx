import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import PDFViewer from '../../../Components/PDFViewer';
import { useAuth } from '../../../contexts/AuthContext';

// Use window.axios which has session-based auth configured, or configure this instance
const axiosInstance = window.axios || axios;
if (!window.axios) {
  axiosInstance.defaults.withCredentials = true;
  axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const CMProposalDetails = ({ proposal, onBack, onEndorsed }) => {
  const { user } = useAuth();
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isEndorsing, setIsEndorsing] = useState(false);
  const [endorsementComments, setEndorsementComments] = useState('');
  const [showEndorsementModal, setShowEndorsementModal] = useState(false);
  const [isEndorsed, setIsEndorsed] = useState(false);
  const [endorsementData, setEndorsementData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);


  const [fullProposal, setFullProposal] = useState(proposal);

  // Fetch full proposal with files if not already loaded
  useEffect(() => {
    const fetchFullProposal = async () => {
      if (!proposal || !user) return;
      
      // If proposal already has files, use it as is
      if (proposal.files && Array.isArray(proposal.files) && proposal.files.length > 0) {
        setFullProposal(proposal);
        return;
      }

      // Otherwise, fetch the full proposal with files
      try {
        const response = await axiosInstance.get(`/proposals/${proposal.proposalID || proposal.id}`, {
          headers: { 'Accept': 'application/json' },
          withCredentials: true
        });
        
        if (response.data.success && response.data.data) {
          setFullProposal(response.data.data);
        }
      } catch (error) {
        // If fetch fails, use the original proposal
        console.error('Error fetching full proposal:', error);
        setFullProposal(proposal);
      }
    };

    if (proposal && user) {
      fetchFullProposal();
    }
  }, [proposal, user]);

  // Check if proposal has been endorsed by the current user
  useEffect(() => {
    const checkEndorsementStatus = async () => {
      if (!fullProposal || !user) return;
      
      try {
        const response = await axiosInstance.get(`/endorsements/proposal/${fullProposal.proposalID || fullProposal.id}`, {
          headers: { 'Accept': 'application/json' },
          withCredentials: true
        });
        
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          // Check if the current user has already endorsed this proposal
          const userEndorsement = response.data.data.find(
            endorsement => endorsement.endorserID === user.userID || 
                          endorsement.endorser?.userID === user.userID
          );
          
          if (userEndorsement) {
            setIsEndorsed(true);
            setEndorsementData(userEndorsement);
          } else {
            setIsEndorsed(false);
            setEndorsementData(null);
          }
        } else {
          setIsEndorsed(false);
          setEndorsementData(null);
        }
      } catch (error) {
        // Only log error if it's not a 401 (unauthorized)
        if (error.response?.status !== 401) {
          console.error('Error checking endorsement status:', error);
        }
        setIsEndorsed(false);
        setEndorsementData(null);
      }
    };

    if (fullProposal && user) {
      checkEndorsementStatus();
    }
  }, [fullProposal, refreshKey, user]);

  // Force refresh function
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Get the research paper PDF path from uploaded files
  const getResearchPaperPath = () => {
    if (fullProposal?.files && fullProposal.files.length > 0) {
      // Look specifically for research paper/concept paper file
      // Priority: concept_paper type > report type > filename contains 'concept' or 'research' or 'paper'
      const researchPaper = fullProposal.files.find(f => {
        const fileName = f.fileName?.toLowerCase() || '';
        return f.fileType === 'concept_paper' || 
               f.fileType === 'report' ||
               fileName.includes('concept') ||
               fileName.includes('research') ||
               fileName.includes('paper');
      });
      
      if (researchPaper && researchPaper.filePath) {
        return `/storage/${researchPaper.filePath}`;
      }
    }
    // Return null if no research paper found - don't show fallback
    return null;
  };

  const researchPaperPath = getResearchPaperPath();

  // Get attached documents dynamically from uploaded files
  const getAttachedDocuments = () => {
    if (!fullProposal?.files || !Array.isArray(fullProposal.files) || fullProposal.files.length === 0) {
      return [];
    }

    // Map file types to display names
    const fileTypeMap = {
      'report': 'Research Paper/Concept Paper',
      'concept_paper': 'Research Paper/Concept Paper',
      'seti_scorecard': 'SETI Scorecard',
      'gad_certificate': 'GAD Checklist and Certificate',
      'matrix_compliance': 'Matrix of Compliance'
    };

    // Create document list from actual uploaded files
    return fullProposal.files
      .filter(file => file.filePath) // Only include files with valid paths
      .map(file => {
        const fileType = file.fileType || '';
        const displayName = fileTypeMap[fileType] || file.fileName || 'Document';
        const pdfPath = `/storage/${file.filePath}`;
        
        return {
          name: displayName,
          fileName: file.fileName,
          available: true,
          pdfPath: pdfPath,
          fileType: fileType,
          fileSize: file.fileSize
        };
      });
  };

  const attachedDocuments = getAttachedDocuments();

  const handleEndorse = () => {
    // Prevent opening modal if already endorsed
    if (isEndorsed) {
      alert('This proposal has already been endorsed by you.');
      return;
    }
    setShowEndorsementModal(true);
  };

  const handleEndorsementSubmit = async () => {
    // Prevent duplicate submissions
    if (isEndorsing) return;
    
    // Check if already endorsed before submitting
    if (isEndorsed) {
      alert('This proposal has already been endorsed by you.');
      setShowEndorsementModal(false);
      return;
    }

    try {
      setIsEndorsing(true);
      
      const endorsementData = {
        proposalID: fullProposal.proposalID || fullProposal.id,
        endorsementComments: endorsementComments,
        endorsementStatus: 'approved'
      };

      const response = await axiosInstance.post('/endorsements', endorsementData, {
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        withCredentials: true
      });
      
      const responseData = response.data;
      
      if (responseData.success) {
        alert('Proposal endorsed successfully!');
        setIsEndorsed(true);
        setEndorsementData(responseData.data);
        setShowEndorsementModal(false);
        setEndorsementComments('');
        // Refresh the endorsement status
        handleRefresh();
        
        // Notify parent component that this proposal has been endorsed
        const proposalId = fullProposal.proposalID || fullProposal.id;
        if (onEndorsed && proposalId) {
          onEndorsed(proposalId);
        }
      } else {
        alert('Failed to endorse proposal: ' + (responseData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error endorsing proposal:', error);
      
      // Extract error message from response
      let errorMessage = 'Unknown error';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 409) {
          errorMessage = data.message || 'This proposal has already been endorsed by you.';
        } else if (status === 403) {
          errorMessage = data.message || 'You do not have permission to endorse this proposal.';
        } else if (status === 404) {
          errorMessage = data.message || 'Proposal not found.';
        } else if (data && data.message) {
          errorMessage = data.message;
        } else if (data && data.errors) {
          // Validation errors
          const errorMessages = Object.values(data.errors).flat();
          errorMessage = errorMessages.join(', ');
        } else {
          errorMessage = `Server error (${status})`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      alert('Error endorsing proposal: ' + errorMessage);
      
      // If it's a 409 conflict, refresh the endorsement status
      if (error.response?.status === 409) {
        handleRefresh();
      }
    } finally {
      setIsEndorsing(false);
    }
  };

  const handleEndorsementCancel = () => {
    setShowEndorsementModal(false);
    setEndorsementComments('');
  };

  const handleDocumentClick = (document) => {
    if (document && document.pdfPath) {
      setSelectedDocument(document);
      setShowDocumentModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
  };

  // Document Modal Component
  const DocumentModal = () => {
    if (!selectedDocument) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">{selectedDocument.name}</h2>
            <button
              onClick={handleCloseModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Content - All documents show as PDFs */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="h-full">
              {selectedDocument.pdfPath ? (
                <PDFViewer 
                  pdfPath={selectedDocument.pdfPath} 
                  title={selectedDocument.name || selectedDocument.fileName || 'Document'}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Document path not available.</p>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
                {selectedDocument.pdfPath && (
                  <a
                    href={selectedDocument.pdfPath}
                    download={selectedDocument.fileName || selectedDocument.name}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors inline-block"
                  >
                    Download PDF
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Memoize the endorsement modal handlers to prevent re-creation
  const handleEndorsementCommentsChange = React.useCallback((e) => {
    setEndorsementComments(e.target.value);
  }, []);

  // Format date to be easily understood
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 h-full overflow-y-auto">
      {/* Back Button */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Proposals</span>
        </button>
      </div>

      {/* Proposal Details Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 leading-tight">
            {fullProposal?.researchTitle || fullProposal?.title || proposal?.researchTitle || proposal?.title}
          </h1>
          <p className="text-gray-600 text-lg">Research Proposal Details</p>
        </div>
        
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center mb-1">
              <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Proposal ID</h3>
            </div>
            <p className="text-lg font-bold text-blue-600">
              PRO-{(fullProposal?.proposalID || fullProposal?.id || proposal?.proposalID || proposal?.id).toString().padStart(6, '0')}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
            <div className="flex items-center mb-1">
              <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center mr-2">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Submission Date</h3>
            </div>
            <p className="text-lg font-bold text-purple-600">
              {formatDate(fullProposal?.dateSubmitted || fullProposal?.uploadedAt || proposal?.dateSubmitted || fullProposal?.created_at || proposal?.created_at)}
            </p>
          </div>
        </div>

        {/* Proposal Information */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Proposal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Author</h4>
              <p className="text-gray-600">{fullProposal?.user?.fullName || fullProposal?.author || proposal?.user?.fullName || proposal?.author || 'Unknown'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Research Center</h4>
              <p className="text-gray-600">{fullProposal?.researchCenter || proposal?.researchCenter || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Proposed Budget</h4>
              <p className="text-gray-600">₱{((fullProposal?.proposedBudget || proposal?.proposedBudget) || 0).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Status</h4>
              <p className="text-gray-600">{fullProposal?.status?.statusName || proposal?.status?.statusName || 'Unknown'}</p>
            </div>
          </div>
          
          {(fullProposal?.description || proposal?.description) && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600 leading-relaxed">{fullProposal?.description || proposal?.description}</p>
            </div>
          )}
          
          {(fullProposal?.objectives || proposal?.objectives) && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-700 mb-2">Objectives</h4>
              <p className="text-gray-600 leading-relaxed">{fullProposal?.objectives || proposal?.objectives}</p>
            </div>
          )}
        </div>

        {/* Attached Documents */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Attached Documents</h3>
          </div>
          
          {attachedDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attachedDocuments.map((document, index) => (
                <div 
                  key={index} 
                  className="flex items-center p-4 rounded-lg border transition-all duration-200 cursor-pointer group bg-blue-50 hover:bg-blue-100 border-blue-200"
                  onClick={() => handleDocumentClick(document)}
                >
                  <div className="w-3 h-3 rounded-full mr-4 transition-colors bg-blue-500 group-hover:bg-blue-600"></div>
                  <div className="flex-1">
                    <span className="font-medium text-sm text-blue-700 hover:text-blue-800 group-hover:underline block">
                      {document.name}
                    </span>
                    {document.fileName && (
                      <span className="text-xs text-gray-500 block mt-1">{document.fileName}</span>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No documents attached to this proposal.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          {isEndorsed ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center px-6 py-3 bg-green-100 text-green-800 rounded-lg font-semibold">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Proposal Endorsed
              </div>
              {endorsementData && endorsementData.endorsementDate && (
                <div className="text-sm text-gray-600">
                  Endorsed on: {formatDate(endorsementData.endorsementDate)}
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={handleEndorse}
              disabled={isEndorsed || isEndorsing}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Endorse Proposal
            </button>
          )}
        </div>
        
      </div>

      {/* PDF Viewer - Only show if research paper file exists */}
      {researchPaperPath ? (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Research Paper</h3>
          <PDFViewer 
            pdfPath={researchPaperPath} 
            title={fullProposal?.files?.find(f => {
              const fileName = f.fileName?.toLowerCase() || '';
              return f.fileType === 'concept_paper' || 
                     f.fileType === 'report' ||
                     fileName.includes('concept') ||
                     fileName.includes('research') ||
                     fileName.includes('paper');
            })?.fileName || "Research Paper"} 
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Research Paper</h3>
          <div className="text-center py-8 text-gray-500">
            <p>No research paper available for this proposal.</p>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && <DocumentModal />}
      
      {/* Endorsement Modal */}
      {showEndorsementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Endorse Proposal</h2>
              <button
                onClick={handleEndorsementCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {fullProposal?.researchTitle || fullProposal?.title || proposal?.researchTitle || proposal?.title}
              </h3>
              <p className="text-sm text-gray-600">
                By: {fullProposal?.user?.fullName || fullProposal?.author || proposal?.user?.fullName || proposal?.author || 'Unknown'}
              </p>
              </div>

              <div className="mb-6">
                <label htmlFor="endorsementComments" className="block text-sm font-medium text-gray-700 mb-2">
                  Endorsement Comments (Optional)
                </label>
                <textarea
                  id="endorsementComments"
                  value={endorsementComments}
                  onChange={handleEndorsementCommentsChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Add any comments about this endorsement..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleEndorsementCancel}
                  disabled={isEndorsing}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndorsementSubmit}
                  disabled={isEndorsing}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                >
                  {isEndorsing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Endorsing...
                    </>
                  ) : (
                    'Endorse Proposal'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CMProposalDetails;
