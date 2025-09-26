import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import apiService from '../services/api';

const TrackerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    terminalReport: null,
    evidence6Ps: null
  });

  useEffect(() => {
    if (id) {
      loadProposal();
    } else {
      setLoading(false);
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
    // Submitting completion files
    setShowUploadModal(false);
  };

  const getTimelineStages = () => {
    if (!proposal) return [];
    
    const statusId = proposal.statusID;
    
    // Define all possible timeline stages based on the images
    const allStages = [
      { id: 1, name: 'College Endorsement', status: 'completed' },
      { id: 2, name: 'R&D Division', status: 'completed' },
      { id: 3, name: 'Proposal Review', status: 'completed' },
      { id: 4, name: 'Ethics Review', status: 'pending' },
      { id: 5, name: 'OVPRDE', status: 'pending' },
      { id: 6, name: 'President', status: 'pending' },
      { id: 7, name: 'OSOURU', status: 'pending' },
      { id: 8, name: 'Implementation', status: 'pending' },
      { id: 9, name: 'Monitoring', status: 'pending' },
      { id: 10, name: 'For Completion', status: 'pending' }
    ];

    // Update stages based on actual proposal status
    switch (statusId) {
      case 3: case 8: // Under Review
        allStages[3].status = 'current'; // Ethics Review
        break;
      case 5: case 9: // Approved
        allStages[3].status = 'completed'; // Ethics Review
        allStages[4].status = 'completed'; // OVPRDE
        allStages[5].status = 'completed'; // President
        allStages[6].status = 'completed'; // OSOURU
        allStages[7].status = 'current'; // Implementation
        break;
      case 6: case 10: // Rejected
        allStages[3].status = 'rejected'; // Ethics Review
        break;
      case 11: // Ongoing
        allStages[3].status = 'completed'; // Ethics Review
        allStages[4].status = 'completed'; // OVPRDE
        allStages[5].status = 'completed'; // President
        allStages[6].status = 'completed'; // OSOURU
        allStages[7].status = 'completed'; // Implementation
        allStages[8].status = 'current'; // Monitoring
        break;
      case 12: // Completed
        allStages.forEach(stage => stage.status = 'completed');
        break;
      default:
        allStages[3].status = 'current'; // Ethics Review
    }

    return allStages;
  };

  const getCompletionPercentage = () => {
    const timelineStages = getTimelineStages();
    const completedStages = timelineStages.filter(stage => stage.status === 'completed').length;
    const currentStage = timelineStages.find(stage => stage.status === 'current') ? 1 : 0;
    const rejectedStage = timelineStages.find(stage => stage.status === 'rejected') ? 1 : 0;
    
    // If rejected, return 0%
    if (rejectedStage) return 0;
    
    return Math.round(((completedStages + currentStage * 0.5) / timelineStages.length) * 100);
  };

  const getCompletedStagesCount = () => {
    const timelineStages = getTimelineStages();
    return timelineStages.filter(stage => stage.status === 'completed').length;
  };

  const getStatusHistory = () => {
    if (!proposal) return [];
    
    const timelineStages = getTimelineStages();
    const statusId = proposal.statusID;
    const baseDate = new Date(proposal.created_at);
    
    // Generate status history based on timeline stages
    const statusHistory = [];
    
    // Always include initial submission
    statusHistory.push({
      date: baseDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      status: 'Proposal Submitted',
      action: 'Research proposal submitted for initial review and processing.',
      priority: 'high'
    });
    
    // Add completed stages in reverse chronological order
    const completedStages = timelineStages.filter(stage => stage.status === 'completed');
    const currentStage = timelineStages.find(stage => stage.status === 'current');
    const rejectedStage = timelineStages.find(stage => stage.status === 'rejected');
    
    // Add completed stages
    completedStages.forEach((stage, index) => {
      const stageDate = new Date(baseDate);
      stageDate.setDate(stageDate.getDate() + (completedStages.length - index) * 2); // 2 days between each stage
      
      let action = '';
      switch (stage.name) {
        case 'College Endorsement':
          action = 'Proposal endorsed by the college committee and forwarded for further review.';
          break;
        case 'R&D Division':
          action = 'Technical assessment completed by R&D Division with positive evaluation.';
          break;
        case 'Proposal Review':
          action = 'Initial proposal review completed with recommendations for improvement.';
          break;
        case 'Ethics Review':
          action = 'Ethics committee review completed with compliance approval.';
          break;
        case 'OVPRDE':
          action = 'Office of Vice President for Research and Development approval granted.';
          break;
        case 'President':
          action = 'Presidential approval received for project implementation.';
          break;
        case 'OSOURU':
          action = 'Office of Student Organizations and University Relations approval completed.';
          break;
        case 'Implementation':
          action = 'Project implementation phase initiated and research work commenced.';
          break;
        case 'Monitoring':
          action = 'Project monitoring and progress tracking phase activated.';
          break;
        case 'For Completion':
          action = 'Project completed successfully with all deliverables submitted.';
          break;
        default:
          action = `${stage.name} stage completed successfully.`;
      }
      
      statusHistory.push({
        date: stageDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        status: stage.name,
        action: action,
        priority: stage.name === 'Ethics Review' || stage.name === 'President' ? 'high' : 'medium'
      });
    });
    
    // Add current stage
    if (currentStage) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(currentDate.getDate() + (completedStages.length + 1) * 2);
      
      let action = '';
      switch (currentStage.name) {
        case 'Ethics Review':
          action = 'Currently under ethics committee review for compliance and safety assessment.';
          break;
        case 'OVPRDE':
          action = 'Under review by Office of Vice President for Research and Development.';
          break;
        case 'President':
          action = 'Awaiting presidential approval for project authorization.';
          break;
        case 'OSOURU':
          action = 'Under review by Office of Student Organizations and University Relations.';
          break;
        case 'Implementation':
          action = 'Project implementation in progress with active research activities.';
          break;
        case 'Monitoring':
          action = 'Project monitoring phase with regular progress assessments.';
          break;
        case 'For Completion':
          action = 'Final completion phase with document preparation and submission.';
          break;
        default:
          action = `Currently in ${currentStage.name} stage.`;
      }
      
      statusHistory.push({
        date: currentDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        status: currentStage.name,
        action: action,
        priority: 'high'
      });
    }
    
    // Add rejected stage if applicable
    if (rejectedStage) {
      const rejectedDate = new Date(baseDate);
      rejectedDate.setDate(rejectedDate.getDate() + (completedStages.length + 1) * 2);
      
      statusHistory.push({
        date: rejectedDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        status: rejectedStage.name,
        action: `Proposal rejected at ${rejectedStage.name} stage. Please review feedback and resubmit with necessary revisions.`,
        priority: 'high'
      });
    }
    
    // Sort by date (most recent first)
    return statusHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project details...</p>
            <p className="text-sm text-gray-500 mt-2">ID: {id || 'No ID provided'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">Invalid Project ID</h3>
            <p className="text-red-600 mb-4">No project ID was provided in the URL.</p>
            <button
              onClick={() => navigate('/proponent/tracker')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Tracker
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Project</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/tracker')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Tracker
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
          <p className="text-gray-600 mb-4">The requested project could not be found.</p>
          <p className="text-sm text-gray-500 mb-4">Project ID: {id}</p>
          <button
            onClick={() => navigate('/proponent/tracker')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Tracker
          </button>
        </div>
      </div>
    );
  }

  // Debug logging
  // Proposal data and ID available

  return (
    <div className="w-full max-w-full mx-auto space-y-4 px-2 sm:px-4 md:px-6 lg:px-8 overflow-hidden" style={{ maxWidth: '100vw', width: '100%' }}>
      {/* Header */}
      <div className="">
        <button
          onClick={() => navigate('/proponent/tracker')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-1 transition-colors duration-200 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-medium">Back to Tracker</span>
        </button>
        
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
                  <p className="text-sm font-medium text-red-600">Research Project</p>
                  <p className="text-xs text-gray-500">ID: {proposal.proposalID}</p>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">
                {proposal.researchTitle || proposal.title || 'Untitled Proposal'}
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
              <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-lg ${
                proposal.statusID === 3 || proposal.statusID === 8 ? 'bg-yellow-500' : // Under Review
                proposal.statusID === 5 || proposal.statusID === 9 ? 'bg-green-500' : // Approved
                proposal.statusID === 6 || proposal.statusID === 10 ? 'bg-red-600' : // Rejected
                proposal.statusID === 11 ? 'bg-blue-500' : // Ongoing
                proposal.statusID === 12 ? 'bg-green-600' : // Completed
                'bg-gray-500'
              }`}>
                {proposal.status?.statusName || 'Unknown Status'}
              </span>
              {/* Progress Card */}
              <div className={`bg-gradient-to-r rounded-2xl p-4 w-full lg:min-w-[240px] xl:min-w-[280px] lg:w-auto flex-shrink-0 ${
                proposal.statusID === 6 || proposal.statusID === 10 ? 'from-red-50 to-red-100' : // Rejected
                proposal.statusID === 12 ? 'from-green-50 to-green-100' : // Completed
                proposal.statusID === 11 ? 'from-blue-50 to-blue-100' : // Ongoing
                'from-red-50 to-red-100' // Default
              }`}>
                <div className="text-center">
                  <div className={`text-2xl sm:text-3xl font-bold mb-1 ${
                    proposal.statusID === 6 || proposal.statusID === 10 ? 'text-red-600' : // Rejected
                    proposal.statusID === 12 ? 'text-green-600' : // Completed
                    proposal.statusID === 11 ? 'text-blue-600' : // Ongoing
                    'text-red-600' // Default
                  }`}>
                    {getCompletionPercentage()}%
                  </div>
                  <div className={`text-sm font-medium mb-3 ${
                    proposal.statusID === 6 || proposal.statusID === 10 ? 'text-red-700' : // Rejected
                    proposal.statusID === 12 ? 'text-green-700' : // Completed
                    proposal.statusID === 11 ? 'text-blue-700' : // Ongoing
                    'text-red-700' // Default
                  }`}>
                    Project Progress
                  </div>
                  <div className={`w-full rounded-full h-2 ${
                    proposal.statusID === 6 || proposal.statusID === 10 ? 'bg-red-200' : // Rejected
                    proposal.statusID === 12 ? 'bg-green-200' : // Completed
                    proposal.statusID === 11 ? 'bg-blue-200' : // Ongoing
                    'bg-red-200' // Default
                  }`}>
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        proposal.statusID === 6 || proposal.statusID === 10 ? 'bg-red-600' : // Rejected
                        proposal.statusID === 12 ? 'bg-green-600' : // Completed
                        proposal.statusID === 11 ? 'bg-blue-600' : // Ongoing
                        'bg-red-600' // Default
                      }`}
                      style={{ width: `${getCompletionPercentage()}%` }}
                    ></div>
                  </div>
                  <div className={`text-xs mt-2 ${
                    proposal.statusID === 6 || proposal.statusID === 10 ? 'text-red-600' : // Rejected
                    proposal.statusID === 12 ? 'text-green-600' : // Completed
                    proposal.statusID === 11 ? 'text-blue-600' : // Ongoing
                    'text-red-600' // Default
                  }`}>
                    {getCompletedStagesCount()} of 10 stages completed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Timeline Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 lg:p-8">
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

        {/* Timeline stages data */}
        {(() => {
          const timelineStages = getTimelineStages();

          const getStatusColor = (status) => {
            switch (status) {
              case 'completed':
                return 'bg-green-500';
              case 'current':
                return 'bg-blue-500';
              case 'rejected':
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
                return 'text-blue-700';
              case 'rejected':
                return 'text-red-700';
              default:
                return 'text-gray-600';
            }
          };

          return (
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
                        className={`px-3 sm:px-4 py-2 rounded-lg text-center min-w-24 sm:min-w-32 ${
                          stage.status === 'current' ? 'bg-blue-50 border border-blue-200' :
                          stage.status === 'completed' ? 'bg-green-50 border border-green-200' :
                          stage.status === 'rejected' ? 'bg-red-50 border border-red-200' :
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
          );
        })()}
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

        {(() => {
          const statusHistory = getStatusHistory();

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

          return (
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
                    <tr key={index} className={`hover:bg-gray-50 transition-colors duration-200 ${index !== statusHistory.length - 1 ? 'border-b border-gray-100' : ''}`}>
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
                          <div className={`w-3 h-3 rounded-full mr-3 ${index === 0 ? 'bg-red-600 animate-pulse' : 'bg-green-500'}`}></div>
                          <span className={`text-sm font-medium ${index === 0 ? 'text-red-700' : 'text-gray-900'}`}>
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
          );
        })()}
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
    </div>
  );
};

export default TrackerDetail;
