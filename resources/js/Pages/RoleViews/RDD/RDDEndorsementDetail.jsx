import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import PDFViewer from '../../../Components/PDFViewer';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import RDDEditProposal from './RDDEditProposal';
import { updateProposal } from '../../../services/proposalService';
import RDDLayout from '../../../Components/Layouts/RDDLayout';
import AppLayout from '../../../Components/Layouts/AppLayout';
import Breadcrumbs from '../../../Components/Breadcrumbs';

const axiosInstance = window.axios || axios;
if (!window.axios) {
  axiosInstance.defaults.withCredentials = true;
  axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const RDDEndorsementDetail = ({ id: proposalId }) => {
  const { user } = useAuth();
  const { refreshAllNotifications } = useNotifications();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isEndorsing, setIsEndorsing] = useState(false);
  const [endorsementComments, setEndorsementComments] = useState('');
  const [showEndorsementModal, setShowEndorsementModal] = useState(false);
  const [isEndorsed, setIsEndorsed] = useState(false);
  const [endorsementData, setEndorsementData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showEditProposal, setShowEditProposal] = useState(false);
  const [fullProposal, setFullProposal] = useState(null);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionComments, setRevisionComments] = useState('');
  const [isSendingForRevision, setIsSendingForRevision] = useState(false);
  const [revisionImages, setRevisionImages] = useState([]);

  useEffect(() => {
    const fetchFullProposal = async () => {
      if (!proposalId || !user) return;

      try {
        setLoading(true);
        const response = await axiosInstance.get(`/proposals/${proposalId}`, {
          headers: { 'Accept': 'application/json' },
          withCredentials: true
        });

        if (response.data.success && response.data.data) {
          setFullProposal(response.data.data);
          setProposal(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching full proposal:', error);
        setError('Failed to load proposal');
      } finally {
        setLoading(false);
      }
    };

    if (proposalId && user) {
      fetchFullProposal();
    }
  }, [proposalId, user, refreshKey]);

  useEffect(() => {
    const checkEndorsementStatus = async () => {
      if (!fullProposal || !user) return;

      try {
        const response = await axiosInstance.get(`/endorsements/proposal/${fullProposal.proposalID || fullProposal.id}`, {
          headers: { 'Accept': 'application/json' },
          withCredentials: true
        });

        if (response.data.success && response.data.data && response.data.data.length > 0) {
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

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getResearchPaperPath = () => {
    if (fullProposal?.files && fullProposal.files.length > 0) {
      const researchPaper = fullProposal.files.find(f => {
        const fileName = f.fileName?.toLowerCase() || '';
        return f.fileType === 'concept_paper' ||
          f.fileType === 'report' ||
          fileName.includes('concept') ||
          fileName.includes('research') ||
          fileName.includes('paper');
      });

      if (researchPaper && researchPaper.filePath) {
        // Only return path if it's a PDF file
        const isPDF = researchPaper.fileName?.toLowerCase().endsWith('.pdf') ||
                      researchPaper.filePath?.toLowerCase().endsWith('.pdf');
        if (isPDF) {
          return `/storage/${researchPaper.filePath}`;
        }
      }
    }
    return null;
  };

  const researchPaperPath = getResearchPaperPath();

  // Helper function to check if a file is a research proposal file
  const isResearchProposalFile = (file) => {
    const fileName = file.fileName?.toLowerCase() || "";
    return (
      file.fileType === "concept_paper" ||
      file.fileType === "report" ||
      fileName.includes("concept") ||
      fileName.includes("research") ||
      fileName.includes("paper")
    );
  };

  const getAttachedDocuments = () => {
    if (!fullProposal?.files || !Array.isArray(fullProposal.files) || fullProposal.files.length === 0) {
      return [];
    }

    const fileTypeMap = {
      'report': 'Research Paper/Concept Paper',
      'concept_paper': 'Research Paper/Concept Paper',
      'seti_scorecard': 'SETI Scorecard',
      'gad_certificate': 'GAD Checklist and Certificate',
      'matrix_compliance': 'Matrix of Compliance',
      'supporting_document': 'Supporting Document'
    };

    // Exclude SETI, GAD, MOC, and research proposal files from attached documents
    const requiredDocTypes = ['seti_scorecard', 'gad_certificate', 'matrix_compliance'];

    const filtered = fullProposal.files
      .filter(file => {
        // Exclude files without paths
        if (!file.filePath) return false;
        // Exclude SETI, GAD, MOC files
        if (requiredDocTypes.includes(file.fileType)) return false;
        // Exclude research proposal files to avoid duplication
        if (isResearchProposalFile(file)) return false;
        return true;
      })
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
    
    return filtered;
  };

  const attachedDocuments = getAttachedDocuments();

  const handleEndorse = async () => {
    if (isEndorsed) {
      await window.customAlert('This proposal has already been endorsed by you.');
      return;
    }
    setShowEndorsementModal(true);
  };

  const handleEndorsementSubmit = async () => {
    if (isEndorsing) return;

    if (isEndorsed) {
      await window.customAlert('This proposal has already been endorsed by you.');
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
        const proposalTitle = fullProposal.researchTitle || fullProposal.title || 'Untitled';
        const proponentName = fullProposal.user?.fullName || fullProposal.user?.firstName + ' ' + fullProposal.user?.lastName || 'Unknown';
        
        // Immediately refresh notifications to show new notification
        refreshAllNotifications();
        
        await window.customAlert('', 'Endorsed Successfully!', 3000);
        setIsEndorsed(true);
        setEndorsementData(responseData.data);
        setShowEndorsementModal(false);
        setEndorsementComments('');
        // Redirect back to endorsement list page
        router.visit('/rdd/review-proposal', { replace: true });
      } else {
        await window.customAlert('Failed to endorse proposal: ' + (responseData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error endorsing proposal:', error);

      let errorMessage = 'Unknown error';

      if (error.response) {
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

      await window.customAlert('Error endorsing proposal: ' + errorMessage);

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

  const handleForRevision = () => {
    setShowRevisionModal(true);
  };

  const handleRevisionCancel = () => {
    setShowRevisionModal(false);
    setRevisionComments('');
    setRevisionImages([]);
  };

  const handleRevisionCommentsChange = (e) => {
    setRevisionComments(e.target.value);
  };

  const handleImagePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        handleImageAdd(file);
        break;
      }
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        handleImageAdd(file);
      }
    });
    // Reset input
    e.target.value = '';
  };

  const handleImageAdd = (file) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      window.customAlert('Image size must be less than 5MB', 'Error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = {
        id: Date.now() + Math.random(),
        file: file,
        preview: reader.result,
        name: file.name
      };
      setRevisionImages(prev => [...prev, imageData]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (imageId) => {
    setRevisionImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSendForRevision = async () => {
    if (isSendingForRevision) return;

    try {
      setIsSendingForRevision(true);
      
      // Prepare update data with images if present
      const updateData = {
        statusID: 4, // Revisions Required status
        revisionComments: revisionComments
      };

      // If there are images, add them to the data object
      // The updateProposal function will handle FormData conversion
      if (revisionImages.length > 0) {
        updateData.revisionImages = revisionImages.map(img => img.file);
      }

      const response = await updateProposal(fullProposal.proposalID || fullProposal.id, updateData);
      
      if (response && response.success) {
        setShowRevisionModal(false);
        setRevisionComments('');
        setRevisionImages([]);
        
        await window.customAlert('', 'Proposal sent for revision successfully!', 3000);
        
        setTimeout(() => {
          router.visit('/rdd/for-revision', { replace: true });
        }, 3500);
      } else {
        await window.customAlert('Failed to send proposal for revision: ' + (response?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending proposal for revision:', error);
      let errorMessage = 'Unknown error';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      await window.customAlert('Error sending proposal for revision: ' + errorMessage);
    } finally {
      setIsSendingForRevision(false);
    }
  };

  const handleDocumentClick = (document) => {
    if (document && document.pdfPath) {
      // Check if file is PDF by extension
      const isPDF = document.fileName?.toLowerCase().endsWith('.pdf') || 
                    document.pdfPath?.toLowerCase().endsWith('.pdf');
      
      if (isPDF) {
        // Open PDF in modal
        setSelectedDocument(document);
        setShowDocumentModal(true);
      } else {
        // For non-PDF files, open in new tab (browser will handle download)
        window.open(document.pdfPath, '_blank', 'noopener');
      }
    }
  };

  const handleCloseModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
  };

  const DocumentModal = () => {
    if (!selectedDocument) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"} />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedDocument.name}</h2>
                {selectedDocument.fileName && (
                  <p className="text-sm text-gray-600">{selectedDocument.fileName}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M6 18L18 6M6 6l12 12"} />
              </svg>
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] bg-gray-50">
            <div className="h-full bg-white rounded-lg shadow-inner p-2">
              {selectedDocument.pdfPath ? (
                <PDFViewer
                  pdfPath={selectedDocument.pdfPath}
                  title={selectedDocument.name || selectedDocument.fileName || 'Document'}
                />
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"} />
                  </svg>
                  <p className="font-medium text-lg">Document path not available.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end items-center space-x-3 p-6 border-t border-gray-200 bg-gradient-to-r from-white to-gray-50">
            <button
              onClick={handleCloseModal}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Close
            </button>
            {selectedDocument.pdfPath && (
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedDocument.pdfPath;
                  link.download = selectedDocument.fileName || selectedDocument.name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"} />
                </svg>
                Download PDF
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleEndorsementCommentsChange = React.useCallback((e) => {
    setEndorsementComments(e.target.value);
  }, []);

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

  const handleSaveProposal = async (formData) => {
    try {
      setIsEndorsing(true);

      const updateData = {
        researchTitle: formData.researchTitle || fullProposal?.researchTitle,
        description: formData.description || fullProposal?.description,
        objectives: formData.objectives || fullProposal?.objectives,
        researchAgenda: formData.researchAgenda || [],
        dostSPs: formData.dostSPs || [],
        sustainableDevelopmentGoals: formData.sustainableDevelopmentGoals || [],
        proposedBudget: formData.proposedBudget || fullProposal?.proposedBudget || 0,
      };

      if (formData.updatedForm) {
        updateData.updatedForm = formData.updatedForm;
      }

      const response = await updateProposal(fullProposal.proposalID || fullProposal.id, updateData);

      if (response.success) {
        setFullProposal(response.data);
        alert('Proposal updated successfully!');
        setShowEditProposal(false);
        handleRefresh();
      } else {
        throw new Error(response.message || 'Failed to update proposal');
      }
    } catch (error) {
      console.error('Error saving proposal:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save proposal';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsEndorsing(false);
    }
  };

  if (showEditProposal) {
    return (
      <RDDEditProposal
        proposal={fullProposal || proposal}
        onBack={() => setShowEditProposal(false)}
        onSave={handleSaveProposal}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !fullProposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
          </svg>
          <p className="text-gray-600 font-medium text-lg">{error || 'Proposal not found'}</p>
          <button
            onClick={() => router.visit('/rdd/review-proposal')}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Endorsements
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <Breadcrumbs items={[
          { label: 'Endorsement', href: '/rdd/review-proposal' },
          { label: 'Review Details', href: null }
        ]} />
      </div>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex items-center">
          <button
            onClick={() => router.visit('/rdd/review-proposal')}
            className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-all duration-200 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M15 19l-7-7 7-7"} />
            </svg>
            <span className="font-medium">Back to Endorsements</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {fullProposal?.researchTitle || fullProposal?.title}
                </h1>

                <div className="flex flex-wrap gap-4 text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"} />
                    </svg>
                    <span className="font-medium">ID:</span>
                    <span className="ml-1">{fullProposal?.custom_proposal_id || `PRO-${String(fullProposal?.proposalID || fullProposal?.id || '0').padStart(6, '0')}`}</span>
                  </div>
                </div>
              </div>

              {isEndorsed && endorsementData && (
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                    </svg>
                    <div>
                      <p className="font-bold text-sm">ENDORSED</p>
                      <p className="text-xs opacity-90">{formatDate(endorsementData.endorsementDate)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Research Center</p>
                    <p className="text-base font-semibold text-slate-900 truncate">{fullProposal?.researchCenter || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Funding Status</p>
                    <p className="text-base font-semibold text-amber-900 truncate">{fullProposal?.status?.statusName || 'Pending Approval'}</p>
                    <p className="text-sm text-amber-700 mt-1">₱{(fullProposal?.proposedBudget || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Submission Date</p>
                    <p className="text-base font-semibold text-emerald-900">{formatDate(fullProposal?.dateSubmitted || fullProposal?.uploadedAt || fullProposal?.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-6 py-2">
                <div className="flex items-center mb-3">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"} />
                  </svg>
                  <h4 className="text-lg font-bold text-gray-900">Research Agenda</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {fullProposal?.researchAgenda && Array.isArray(fullProposal.researchAgenda) && fullProposal.researchAgenda.length > 0 ? (
                    fullProposal.researchAgenda.map((agenda, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-sm font-medium border border-blue-200">
                        {agenda}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No research agenda specified</span>
                  )}
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-6 py-2">
                <div className="flex items-center mb-3">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"} />
                  </svg>
                  <h4 className="text-lg font-bold text-gray-900">DOST Strategic Programs</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {fullProposal?.dostSPs && Array.isArray(fullProposal.dostSPs) && fullProposal.dostSPs.length > 0 ? (
                    fullProposal.dostSPs.map((dost, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-md text-sm font-medium border border-green-200">
                        {dost}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No DOST strategic programs specified</span>
                  )}
                </div>
              </div>

              <div className="border-l-4 border-purple-500 pl-6 py-2">
                <div className="flex items-center mb-3">
                  <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                  </svg>
                  <h4 className="text-lg font-bold text-gray-900">Sustainable Development Goals</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {fullProposal?.sustainableDevelopmentGoals && Array.isArray(fullProposal.sustainableDevelopmentGoals) && fullProposal.sustainableDevelopmentGoals.length > 0 ? (
                    fullProposal.sustainableDevelopmentGoals.map((sdg, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-md text-sm font-medium border border-purple-200">
                        {sdg}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No SDGs specified</span>
                  )}
                </div>
              </div>
            </div>

            {(fullProposal?.description || fullProposal?.objectives) && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="bg-slate-50 rounded-xl p-6 space-y-6">
                  {fullProposal?.description && (
                    <div>
                      <h5 className="flex items-center text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M4 6h16M4 12h16M4 18h7"} />
                        </svg>
                        Description
                      </h5>
                      <p className="text-gray-700 leading-relaxed text-justify">{fullProposal.description}</p>
                    </div>
                  )}

                  {fullProposal?.objectives && (
                    <div>
                      <h5 className="flex items-center text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"} />
                        </svg>
                        Objectives
                      </h5>
                      <p className="text-gray-700 leading-relaxed text-justify">{fullProposal.objectives}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Research Paper Section */}
        {(() => {
          const researchPaper = fullProposal?.files?.find(f => {
            const fileName = f.fileName?.toLowerCase() || '';
            return f.fileType === 'concept_paper' || 
                   f.fileType === 'report' ||
                   fileName.includes('concept') ||
                   fileName.includes('research') ||
                   fileName.includes('paper');
          });

          if (!researchPaper || !researchPaper.filePath) {
            return null;
          }

          const fileUrl = `/storage/${researchPaper.filePath}`;

          return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Research Paper</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm w-full md:col-span-2 md:col-start-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-bold text-red-900">Main Document</h4>
                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      1 file
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Primary research document</p>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900 truncate">{researchPaper.fileName}</p>
                    {researchPaper.fileSize && <p className="text-xs text-gray-500 mt-1">{(researchPaper.fileSize / 1024).toFixed(0)} KB</p>}
                    <div className="mt-3">
                      <button
                        onClick={() => handleDocumentClick({...researchPaper, pdfPath: fileUrl})}
                        className="w-full flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Supporting Documents Section - SETI, GAD, MOC */}
        {fullProposal?.files?.filter(d => ['seti_scorecard', 'gad_certificate', 'matrix_compliance'].includes(d.fileType)).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Supporting Documents</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* SETI */}
              <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-bold text-blue-900">SETI</h4>
                  <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    {fullProposal?.files?.filter(f => f.fileType === 'seti_scorecard').length} file
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Science and Engineering Technology Initiative</p>
                {fullProposal?.files?.filter(f => f.fileType === 'seti_scorecard').map((doc, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg mb-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">{doc.fileName}</p>
                    {doc.fileSize && <p className="text-xs text-gray-500 mt-1">{doc.fileSize}</p>}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleDocumentClick({
                          fileName: doc.fileName,
                          pdfPath: `/storage/${doc.filePath}`
                        })}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                      <a
                        href={`/storage/${doc.filePath}`}
                        download={doc.fileName}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* GAD */}
              <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-bold text-green-900">GAD</h4>
                  <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    {fullProposal?.files?.filter(f => f.fileType === 'gad_certificate').length} file
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Gender and Development</p>
                {fullProposal?.files?.filter(f => f.fileType === 'gad_certificate').map((doc, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg mb-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">{doc.fileName}</p>
                    {doc.fileSize && <p className="text-xs text-gray-500 mt-1">{doc.fileSize}</p>}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleDocumentClick({
                          fileName: doc.fileName,
                          pdfPath: `/storage/${doc.filePath}`
                        })}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                      <a
                        href={`/storage/${doc.filePath}`}
                        download={doc.fileName}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* MOC */}
              <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-bold text-amber-900">MOC</h4>
                  <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    {fullProposal?.files?.filter(f => f.fileType === 'matrix_compliance').length} file
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Matrix of Compliance</p>
                {fullProposal?.files?.filter(f => f.fileType === 'matrix_compliance').map((doc, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg mb-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">{doc.fileName}</p>
                    {doc.fileSize && <p className="text-xs text-gray-500 mt-1">{doc.fileSize}</p>}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleDocumentClick({
                          fileName: doc.fileName,
                          pdfPath: `/storage/${doc.filePath}`
                        })}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                      <a
                        href={`/storage/${doc.filePath}`}
                        download={doc.fileName}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other Supporting Documents - Separate Container */}
        {attachedDocuments.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Other Supporting Documents</h3>
                  <p className="text-sm text-gray-600">Additional files and attachments</p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
                {attachedDocuments.length} files
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {attachedDocuments.map((document, index) => (
                <div key={index} className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{document.fileName}</p>
                  {document.fileSize && <p className="text-xs text-gray-500 mb-4">{document.fileSize}</p>}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDocumentClick(document)}
                      className="flex items-center justify-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium text-sm transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    <a
                      href={`/storage/${document.filePath}`}
                      download={document.fileName}
                      className="flex items-center justify-center px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded font-medium text-sm transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-8">
            {!isEndorsed && (
              <>
                <button
                  onClick={() => setShowEditProposal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"} />
                  </svg>
                  Edit Proposal
                </button>
                <button
                  onClick={handleForRevision}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  For Revision
                </button>
              </>
            )}
            {!isEndorsed && (
              <button
                onClick={handleEndorse}
                disabled={isEndorsed || isEndorsing}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                </svg>
                Endorse Proposal
              </button>
            )}
          </div>



        {showDocumentModal && <DocumentModal />}

        {/* For Revision Modal */}
        {showRevisionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full animate-fadeIn">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Send for Revision</h2>
                </div>
                <button
                  onClick={handleRevisionCancel}
                  className="text-gray-400 hover:text-gray-600 hover:bg-white p-1 rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5">
                <div className="mb-5 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-2 leading-tight">
                    {fullProposal?.researchTitle || fullProposal?.title || proposal?.researchTitle || proposal?.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">By:</span>
                    <span className="ml-2">{fullProposal?.user?.fullName || fullProposal?.author || proposal?.user?.fullName || proposal?.author || 'Unknown'}</span>
                  </div>
                </div>

                <div className="mb-5">
                  <label htmlFor="revisionComments" className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                    <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Revision Comments
                    <span className="text-xs text-gray-500 font-normal ml-2">(Optional)</span>
                  </label>
                  <textarea
                    id="revisionComments"
                    value={revisionComments}
                    onChange={handleRevisionCommentsChange}
                    onPaste={handleImagePaste}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    placeholder="Add revision comments or notes for the proponent... (You can paste images here)"
                  />
                  
                  {/* Image Upload Button */}
                  <div className="mt-2 flex items-center gap-2">
                    <label className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 cursor-pointer transition-colors">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        multiple
                      />
                    </label>
                    <span className="text-xs text-gray-500">or paste image from clipboard</span>
                  </div>

                  {/* Image Previews */}
                  {revisionImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {revisionImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.preview}
                            alt={image.name}
                            className="w-full h-24 object-cover rounded-md border border-gray-300"
                          />
                          <button
                            onClick={() => handleRemoveImage(image.id)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            type="button"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <p className="text-xs text-gray-600 mt-1 truncate">{image.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleRevisionCancel}
                    disabled={isSendingForRevision}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendForRevision}
                    disabled={isSendingForRevision}
                    className="px-6 py-2 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {isSendingForRevision ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d={"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"}></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"} />
                        </svg>
                        Send for Revision
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEndorsementModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full animate-fadeIn">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Endorse Proposal</h2>
                </div>
                <button
                  onClick={handleEndorsementCancel}
                  className="text-gray-400 hover:text-gray-600 hover:bg-white p-2 rounded-lg transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M6 18L18 6M6 6l12 12"} />
                  </svg>
                </button>
              </div>

              <div className="p-8">
                <div className="mb-8 bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                    {fullProposal?.researchTitle || fullProposal?.title}
                  </h3>
                  <div className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"} />
                    </svg>
                    <span className="font-medium">ID:</span>
                    <span className="ml-2">{fullProposal?.custom_proposal_id || `PRO-${String(fullProposal?.proposalID || fullProposal?.id || '0').padStart(6, '0')}`}</span>
                  </div>
                </div>

                <div className="mb-8">
                  <label htmlFor="endorsementComments" className="flex items-center text-base font-semibold text-gray-800 mb-3">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"} />
                    </svg>
                    Endorsement Comments
                    <span className="text-sm text-gray-500 font-normal ml-2">(Optional)</span>
                  </label>
                  <textarea
                    id={"endorsementComments"}
                    value={endorsementComments}
                    onChange={handleEndorsementCommentsChange}
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                    placeholder="Add any comments, recommendations, or notes about this endorsement..."
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Your comments will be visible to other reviewers and administrators.
                  </p>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleEndorsementCancel}
                    disabled={isEndorsing}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEndorsementSubmit}
                    disabled={isEndorsing}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl transition-all disabled:opacity-50 flex items-center font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {isEndorsing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d={"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"}></path>
                        </svg>
                        Endorsing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                        </svg>
                        Confirm Endorsement
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

RDDEndorsementDetail.layout = (page) => (
  <AppLayout>
    <RDDLayout>{page}</RDDLayout>
  </AppLayout>
);

export default RDDEndorsementDetail;
