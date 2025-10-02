import React from 'react';
import Dashboard from '../../../Components/UI/Dashboard';

const ReviewerDashboard = () => {
  const cards = [
    {
      title: 'Pending Reviews',
      description: 'Review assigned research proposals',
      bgColor: 'bg-blue-50',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-600'
    },
    {
      title: 'Review History',
      description: 'View your review history',
      bgColor: 'bg-green-50',
      titleColor: 'text-green-800',
      textColor: 'text-green-600'
    },
    {
      title: 'Review Guidelines',
      description: 'Access review criteria and guidelines',
      bgColor: 'bg-purple-50',
      titleColor: 'text-purple-800',
      textColor: 'text-purple-600'
    }
  ];

  const activitySection = {
    title: 'Assigned Reviews',
    placeholder: 'No reviews assigned at this time'
  };

  return (
    <Dashboard 
      title="Reviewer Dashboard"
      cards={cards}
      activitySection={activitySection}
    />
  );
};

export default ReviewerDashboard;
