import { useState, useEffect } from 'react';
import axios from 'axios';

export const useTimelineStages = () => {
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStages = async () => {
            try {
                const response = await axios.get('/api/timeline-stages/active');
                if (response.data.success) {
                    setStages(response.data.stages);
                }
            } catch (err) {
                console.error('Failed to fetch timeline stages:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStages();
    }, []);

    return { stages, loading, error };
};

export const calculateStageStatus = (proposal, stage, stages) => {
    if (!proposal || !stage || !stages || stages.length === 0) return 'pending';

    const statusId = proposal.statusID;
    const stageIndex = stages.findIndex(s => s.stageID === stage.stageID);
    
    // Check for actual endorsements from the database
    const cmEndorsement = proposal.endorsements?.find(
        (e) => e.endorser?.role?.userRole === "CM" && e.endorsementStatus === "approved"
    );
    const rddEndorsement = proposal.endorsements?.find(
        (e) => e.endorser?.role?.userRole === "RDD" && e.endorsementStatus === "approved"
    );

    // First stage (Proposal Submitted) is always completed if status is not Draft
    if (stageIndex === 0) {
        return statusId > 1 ? 'completed' : 'pending';
    }

    // Handle College Endorsement stage specially
    if (stage.stageName === 'College Endorsement') {
        if (cmEndorsement) return 'completed';
        if (statusId === 3) return 'current'; // Under Review
        return 'pending';
    }

    // Handle R&D Division stage
    if (stage.stageName === 'R&D Division') {
        if (statusId === 6) return 'rejected'; // Rejected status
        if (cmEndorsement && statusId >= 3) {
            return rddEndorsement ? 'completed' : 'current';
        }
        return 'pending';
    }

    // Status-based logic for other stages
    switch (statusId) {
        case 5: // Approved - stages up to Implementation
            if (stage.stageName === 'Implementation') return 'current';
            if (stageIndex < stages.findIndex(s => s.stageName === 'Implementation')) return 'completed';
            return 'pending';
            
        case 4: // Ongoing - stages up to Monitoring
            if (stage.stageName === 'Monitoring') return 'current';
            if (stageIndex < stages.findIndex(s => s.stageName === 'Monitoring')) return 'completed';
            return 'pending';
            
        case 2: // Completed - all stages completed
            return 'completed';
            
        default:
            return 'pending';
    }
};

export const getCompletionPercentage = (proposal, stages) => {
    if (!stages || stages.length === 0) return 0;

    const stagesWithStatus = stages.map(stage => ({
        ...stage,
        status: calculateStageStatus(proposal, stage, stages)
    }));

    const completedStages = stagesWithStatus.filter(s => s.status === 'completed').length;
    const currentStage = stagesWithStatus.find(s => s.status === 'current') ? 1 : 0;
    const rejectedStage = stagesWithStatus.find(s => s.status === 'rejected') ? 1 : 0;

    // If rejected, return 0%
    if (rejectedStage) return 0;

    return Math.round(((completedStages + currentStage * 0.5) / stages.length) * 100);
};
