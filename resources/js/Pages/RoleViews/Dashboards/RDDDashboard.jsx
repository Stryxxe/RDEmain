import React, { useState, useEffect } from 'react';
import Dashboard from '../../../Components/UI/Dashboard';
import rddService from '../../../services/rddService';

const RDDDashboard = () => {
  const [statistics, setStatistics] = useState({
    total: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    ongoing: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await rddService.getProposalStatistics();
      if (response.success) {
        setStatistics(response.data);
      } else {
        setError('Failed to fetch statistics');
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Error loading statistics');
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Research Proposals',
      description: `Total: ${statistics.total} | Under Review: ${statistics.under_review}`,
      bgColor: 'bg-blue-50',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-600'
    },
    {
      title: 'Approval Process',
      description: `Approved: ${statistics.approved} | Rejected: ${statistics.rejected}`,
      bgColor: 'bg-green-50',
      titleColor: 'text-green-800',
      textColor: 'text-green-600'
    },
    {
      title: 'Research Projects',
      description: `Ongoing: ${statistics.ongoing} | Completed: ${statistics.completed}`,
      bgColor: 'bg-purple-50',
      titleColor: 'text-purple-800',
      textColor: 'text-purple-600'
    }
  ];

  const activitySection = {
    title: 'Pending Reviews',
    placeholder: loading ? 'Loading...' : error ? 'Error loading data' : 'No pending reviews at this time'
  };

  return (
    <Dashboard 
      title="RDD Dashboard"
      cards={cards}
      activitySection={activitySection}
    />
  );
};

export default RDDDashboard;
