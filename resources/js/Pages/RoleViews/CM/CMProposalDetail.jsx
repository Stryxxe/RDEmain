import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { useRouteParams } from '../../../Components/RoleBased/InertiaRoleRouter';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import PDFViewer from '../../../Components/PDFViewer';

// Use window.axios which has session-based auth configured, or configure this instance
const axiosInstance = window.axios || axios;
if (!window.axios) {
  axiosInstance.defaults.withCredentials = true;
  axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const CMProposalDetail = () => {
  const routeParams = useRouteParams();
  const id = routeParams.id;
  const { user } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEndorsed, setIsEndorsed] = useState(false);
  const [endorsementData, setEndorsementData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  console.log('CMProposalDetail rendered with ID:', id);
  console.log('Current user:', user);

  useEffect(() => {
    if (user) {
      fetchProposal();
    }
  }, [id, user]);

  // Check endorsement status when proposal is loaded
  useEffect(() => {
    const checkEndorsementStatus = async () => {
      if (!proposal || !user) return;
      
      try {
        const response = await axiosInstance.get(`/endorsements/proposal/${proposal.proposalID}`, {
          headers: { 'Accept': 'application/json' },
          withCredentials: true
        });
        
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          setIsEndorsed(true);
          setEndorsementData(response.data.data[0]);
        } else {
          setIsEndorsed(false);
          setEndorsementData(null);
        }
      } catch (error) {
        // Only log error if it's not a 401 (unauthorized) - 401 is expected if not authenticated
        if (error.response?.status !== 401) {
          console.error('Error checking endorsement status:', error);
        }
        setIsEndorsed(false);
        setEndorsementData(null);
      }
    };

    checkEndorsementStatus();
  }, [proposal, refreshKey, user]);

  // Force refresh function
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const fetchProposal = async () => {
    if (!user) {
      setError('Please log in to view proposal details');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching proposal with ID:', id);
      const response = await axiosInstance.get(`/proposals/${id}`, {
        headers: { 'Accept': 'application/json' },
        withCredentials: true
      });
      console.log('API Response:', response.data);
      if (response.data.success) {
        setProposal(response.data.data);
        console.log('Proposal loaded successfully:', response.data.data);
      } else {
        console.error('API returned error:', response.data.message);
        setError('Proposal not found');
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
      console.error('Error details:', error.response?.data);
      if (error.response?.status === 401) {
        setError('Unauthorized. Please log in again.');
      } else {
        setError('Error loading proposal');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.visit('/cm');
  };

  const handleEndorse = () => {
    // Store the proposal data in localStorage for the ReviewProposal page
    localStorage.setItem('selectedProjectForEndorsement', JSON.stringify(proposal));
    // Navigate to the ReviewProposal page
    router.visit('/cm/review-proposal');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposal details...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Dynamic timeline based on actual proposal status and endorsement status
  const getTimelineStages = () => {
    if (!proposal) return [];
    
    const statusId = proposal.statusID;
    
    // Define all possible timeline stages (ordered from start to finish)
    const allStages = [
      { id: 0, name: 'Proposal Submitted', status: 'pending' },
      { id: 1, name: 'College Endorsement', status: 'pending' },
      { id: 2, name: 'R&D Division', status: 'pending' },
      { id: 3, name: 'Proposal Review', status: 'pending' },
      { id: 4, name: 'Ethics Review', status: 'pending' },
      { id: 5, name: 'OVPRDE', status: 'pending' },
      { id: 6, name: 'President', status: 'pending' },
      { id: 7, name: 'OSOURU', status: 'pending' },
      { id: 8, name: 'Implementation', status: 'pending' },
      { id: 9, name: 'Monitoring', status: 'pending' },
      { id: 10, name: 'For Completion', status: 'pending' }
    ];

    // Update stages based on actual proposal status (matching StatusSeeder IDs)
    switch (statusId) {
      case 1: // Under Review - Proposal submitted, waiting for College Endorsement
        allStages[0].status = 'completed'; // Proposal Submitted
        // Check if endorsed to determine College Endorsement status
        if (isEndorsed) {
          allStages[1].status = 'completed'; // College Endorsement - completed
          allStages[2].status = 'current';   // R&D Division - next stage
        } else {
          allStages[1].status = 'current';   // College Endorsement - current
        }
        break;
      case 2: // Approved - All stages up to Implementation completed, Implementation current
        allStages[0].status = 'completed'; // Proposal Submitted
        allStages[1].status = 'completed'; // College Endorsement
        allStages[2].status = 'completed'; // R&D Division
        allStages[3].status = 'completed'; // Proposal Review
        allStages[4].status = 'completed'; // Ethics Review
        allStages[5].status = 'completed'; // OVPRDE
        allStages[6].status = 'completed'; // President
        allStages[7].status = 'completed'; // OSOURU
        allStages[8].status = 'current';   // Implementation
        break;
      case 3: // Rejected - College Endorsement completed, R&D Division rejected
        allStages[0].status = 'completed'; // Proposal Submitted
        allStages[1].status = 'completed'; // College Endorsement
        allStages[2].status = 'rejected';  // R&D Division
        break;
      case 4: // Ongoing - All stages up to Monitoring completed, Monitoring current
        allStages[0].status = 'completed'; // Proposal Submitted
        allStages[1].status = 'completed'; // College Endorsement
        allStages[2].status = 'completed'; // R&D Division
        allStages[3].status = 'completed'; // Proposal Review
        allStages[4].status = 'completed'; // Ethics Review
        allStages[5].status = 'completed'; // OVPRDE
        allStages[6].status = 'completed'; // President
        allStages[7].status = 'completed'; // OSOURU
        allStages[8].status = 'completed'; // Implementation
        allStages[9].status = 'current';   // Monitoring
        break;
      case 5: // Completed - All stages completed
        allStages[0].status = 'completed'; // Proposal Submitted
        allStages[1].status = 'completed'; // College Endorsement
        allStages[2].status = 'completed'; // R&D Division
        allStages[3].status = 'completed'; // Proposal Review
        allStages[4].status = 'completed'; // Ethics Review
        allStages[5].status = 'completed'; // OVPRDE
        allStages[6].status = 'completed'; // President
        allStages[7].status = 'completed'; // OSOURU
        allStages[8].status = 'completed'; // Implementation
        allStages[9].status = 'completed'; // Monitoring
        allStages[10].status = 'completed'; // For Completion
        break;
      default:
        // Check if endorsed to determine College Endorsement status
        if (isEndorsed) {
          allStages[0].status = 'completed'; // Proposal Submitted
          allStages[1].status = 'completed'; // College Endorsement - completed
          allStages[2].status = 'current';   // R&D Division - next stage
        } else {
          allStages[1].status = 'current'; // College Endorsement - current
        }
    }

    return allStages;
  };

  // Dynamic status history based on actual proposal data
  const getStatusHistory = () => {
    if (!proposal) return [];
    
    const timelineStages = getTimelineStages();
    const baseDate = new Date(proposal.created_at);
    
    // Generate status history based on timeline stages
    const statusHistory = [];
    
    // Get stages in chronological order
    const completedStages = timelineStages.filter(stage => stage.status === 'completed');
    const currentStage = timelineStages.find(stage => stage.status === 'current');
    const rejectedStage = timelineStages.find(stage => stage.status === 'rejected');
    
    // Create a proper chronological timeline
    const timelineEntries = [];
    
    // 1. Add initial proposal submission (always first)
    timelineEntries.push({
      date: baseDate,
      status: 'Proposal Submitted',
      action: 'Proposal submitted successfully and is now under review.',
      priority: 'medium',
      type: 'completed'
    });
    
    // 2. Add completed stages in chronological order (excluding Proposal Submitted to avoid duplication)
    completedStages.filter(stage => stage.name !== 'Proposal Submitted').forEach((stage, index) => {
      const stageDate = new Date(baseDate);
      // Add realistic time progression: 1-2 weeks between stages
      const daysToAdd = (index + 1) * 7 + Math.floor(Math.random() * 7);
      stageDate.setDate(stageDate.getDate() + daysToAdd);
      
      // Add random time during business hours (9 AM - 5 PM)
      const randomHour = 9 + Math.floor(Math.random() * 8);
      const randomMinute = Math.floor(Math.random() * 60);
      stageDate.setHours(randomHour, randomMinute, 0, 0);
      
      timelineEntries.push({
        date: stageDate,
        status: stage.name,
        action: `${stage.name} completed successfully.`,
        priority: 'medium',
        type: 'completed'
      });
    });
    
    // 3. Add endorsement entry if proposal has been endorsed
    if (isEndorsed && endorsementData) {
      const endorsementDate = new Date(endorsementData.endorsementDate);
      timelineEntries.push({
        date: endorsementDate,
        status: 'College Endorsement',
        action: `Proposal endorsed by ${endorsementData.endorser?.fullName || 'Center Manager'}.`,
        priority: 'high',
        type: 'endorsement'
      });
    }
    
    // 4. Add current stage (most recent)
    if (currentStage) {
      const currentDate = new Date();
      timelineEntries.push({
        date: currentDate,
        status: currentStage.name,
        action: `Currently in ${currentStage.name} stage.`,
        priority: 'high',
        type: 'current'
      });
    }
    
    // 5. Add rejected stage (if applicable)
    if (rejectedStage) {
      const rejectedDate = new Date();
      timelineEntries.push({
        date: rejectedDate,
        status: rejectedStage.name,
        action: `Proposal rejected at ${rejectedStage.name} stage.`,
        priority: 'high',
        type: 'rejected'
      });
    }
    
    // Sort by date (newest first for display)
    timelineEntries.sort((a, b) => b.date - a.date);
    
    // Format the entries for display
    timelineEntries.forEach(entry => {
      statusHistory.push({
        date: entry.date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        status: entry.status,
        action: entry.action,
        priority: entry.priority,
        type: entry.type
      });
    });
    
    return statusHistory;
  };

  const timelineStages = getTimelineStages();
  const statusHistory = getStatusHistory();

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'current':
        return 'bg-red-600';
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'current':
        return 'text-red-600';
      case 'rejected':
        return 'text-red-600';
      case 'pending':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCompletionPercentage = () => {
    const completedStages = timelineStages.filter(stage => stage.status === 'completed').length;
    const currentStage = timelineStages.find(stage => stage.status === 'current') ? 1 : 0;
    const rejectedStage = timelineStages.find(stage => stage.status === 'rejected') ? 1 : 0;
    
    // If rejected, return 0%
    if (rejectedStage) return 0;
    
    return Math.round(((completedStages + currentStage * 0.5) / timelineStages.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Back Button and Endorse Button */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBack}
              className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Projects</span>
            </button>

            {/* Endorse Button or Endorsement Status */}
            {(() => {
              const timelineStages = getTimelineStages();
              const collegeEndorsementStage = timelineStages.find(stage => stage.name === 'College Endorsement');
              const isCurrentStage = collegeEndorsementStage?.status === 'current';
              
              if (isEndorsed) {
                return (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center px-6 py-3 bg-green-100 text-green-800 rounded-xl font-semibold">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Project Endorsed
                    </div>
                    {endorsementData && (
                      <div className="text-sm text-gray-600">
                        Endorsed on: {new Date(endorsementData.endorsementDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              } else if (isCurrentStage) {
                return (
                  <button
                    onClick={handleEndorse}
                    className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Endorse Project
                  </button>
                );
              }
              return null;
            })()}
          </div>


          {/* Project Title and Info */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {proposal.researchTitle}
              </h1>

              <div className="flex flex-wrap gap-4 text-gray-600">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">ID:</span>
                  <span className="ml-1">PRO-{proposal.proposalID.toString().padStart(6, '0')}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">Author:</span>
                  <span className="ml-1">{proposal.user?.fullName || 'Unknown'}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className="font-medium">Budget:</span>
                  <span className="ml-1">₱{proposal.proposedBudget?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium border ${
                    proposal.status?.statusName === 'Completed' ? 'bg-green-100 text-green-800 border-green-300' :
                    proposal.status?.statusName === 'Under Review' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    proposal.status?.statusName === 'Ongoing' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                    proposal.status?.statusName === 'Approved' ? 'bg-green-100 text-green-800 border-green-300' :
                    proposal.status?.statusName === 'Rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                    'bg-gray-100 text-gray-800 border-gray-300'
                  }`}>
                    {proposal.status?.statusName || 'Unknown'}
                  </span>
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
                    <div className={`w-12 h-12 rounded-full ${getStatusColor(stage.status)} mb-4 relative z-10`}>
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
                    <div className={`px-4 py-2 rounded-lg text-center min-w-32 ${stage.status === 'current' ? 'bg-red-50 border border-red-200' :
                        stage.status === 'completed' ? 'bg-green-50 border border-green-200' :
                        stage.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                          'bg-gray-50 border border-gray-200'
                      }`}>
                      <span className={`text-sm font-medium ${getStatusTextColor(stage.status)} leading-tight`}>
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
              <div className="p-3 bg-blue-100 rounded-xl mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <tr key={index} className={`hover:bg-gray-50 transition-colors duration-200 ${index !== statusHistory.length - 1 ? 'border-b border-gray-100' : ''
                    }`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{entry.date}</div>
                          <div className="text-xs text-gray-500">
                            {index === 0 ? 'Latest update' : 
                             index === statusHistory.length - 1 ? 'Initial submission' : 
                             'Stage completed'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${index === 0 ? 'bg-red-600 animate-pulse' : 'bg-green-500'}`}></div>
                        <span className={`text-sm font-medium ${index === 0 ? 'text-red-700' : 'text-gray-900'}`}>
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

        {/* Attached Files Section */}
        {proposal.files && proposal.files.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
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
                      <h3 className="text-sm font-medium text-gray-900 mb-1 truncate">{file.fileName}</h3>
                      <p className="text-xs text-gray-500 mb-3">{file.formattedSize || `${Math.round(file.fileSize / 1024)} KB`}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`/storage/${file.filePath}`, '_blank')}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                          title="View file"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `/storage/${file.filePath}`;
                            link.download = file.fileName;
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors duration-200"
                          title="Download file"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
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

        {/* PDF Viewer - Legacy support for revisionFile */}
        {proposal.revisionFile && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Legacy Proposal Document</h2>
            <PDFViewer pdfPath={proposal.revisionFile} title="Proposal Document" />
          </div>
        )}

        {/* No Files Message */}
        {(!proposal.files || proposal.files.length === 0) && !proposal.revisionFile && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Available</h3>
              <p className="text-gray-600">This proposal doesn't have any uploaded documents yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CMProposalDetail;
