import React from 'react';
import Dashboard from '../../../Components/UI/Dashboard';

const RDDDashboard = () => {
  const cards = [
    {
      title: 'Research Proposals',
      description: 'Review and manage research proposals',
      bgColor: 'bg-blue-50',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-600'
    },
    {
      title: 'Approval Process',
      description: 'Handle proposal approvals',
      bgColor: 'bg-green-50',
      titleColor: 'text-green-800',
      textColor: 'text-green-600'
    },
    {
      title: 'Research Projects',
      description: 'Monitor ongoing research projects',
      bgColor: 'bg-purple-50',
      titleColor: 'text-purple-800',
      textColor: 'text-purple-600'
    }
  ];

  const activitySection = {
    title: 'Pending Reviews',
    placeholder: 'No pending reviews at this time'
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
