import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { ArrowLeft, Download, Eye } from 'lucide-react';
import apiService from '../../../../services/api';

const ProposalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading proposal details...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Proposal</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/projects')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!proposal) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h1>
            <p className="text-gray-600 mb-4">The requested proposal could not be found.</p>
            <button
              onClick={() => navigate('/projects')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const matrix = proposal.matrixOfCompliance || {};

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Projects
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {proposal.researchTitle || 'Untitled Proposal'}
              </h1>
              <p className="text-gray-600">Proposal ID: {proposal.proposalID}</p>
            </div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full text-white ${getStatusColor(proposal.statusID)}`}>
              {proposal.status?.statusName || 'Unknown Status'}
            </span>
          </div>
        </div>

        {/* Proposal Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Research Title</label>
                  <p className="text-gray-900">{proposal.researchTitle || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Research Center</label>
                  <p className="text-gray-900">{matrix.researchCenter || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Funding Status</label>
                  <p className="text-gray-900 font-semibold">
                    {proposal.statusID === 2 ? formatCurrency(matrix.proposedBudget) : 'Pending RDD Approval'}
                  </p>
                  {proposal.statusID !== 2 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Proposed Budget: {formatCurrency(matrix.proposedBudget)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted Date</label>
                  <p className="text-gray-900">{new Date(proposal.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Research Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Research Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{matrix.description || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objectives</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{matrix.objectives || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Research Agenda */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Research Agenda</h2>
            <div className="flex flex-wrap gap-2">
              {(matrix.researchAgenda || []).map((agenda, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {agenda}
                </span>
              ))}
            </div>
          </div>

          {/* DOST SPs */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">DOST Strategic Programs</h2>
            <div className="flex flex-wrap gap-2">
              {(matrix.dostSPs || []).map((sp, index) => (
                <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {sp}
                </span>
              ))}
            </div>
          </div>

          {/* Sustainable Development Goals */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sustainable Development Goals</h2>
            <div className="flex flex-wrap gap-2">
              {(matrix.sustainableDevelopmentGoals || []).map((sdg, index) => (
                <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {sdg}
                </span>
              ))}
            </div>
          </div>

          {/* Files */}
          {proposal.files && proposal.files.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Attached Files</h2>
              <div className="space-y-3">
                {proposal.files.map((file) => (
                  <div key={file.fileID} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                        <p className="text-xs text-gray-500">{file.formattedSize}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Download file"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => window.open(`/storage/${file.filePath}`, '_blank')}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="View file"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProposalDetail;