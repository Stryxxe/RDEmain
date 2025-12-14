import React from 'react';
import Dashboard from '../../../Components/UI/Dashboard';

const OPDashboard = () => {
  const cards = [
    {
      title: 'Executive Review',
      description: 'Review high-level research proposals',
      bgColor: 'bg-blue-50',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-600'
    },
    {
      title: 'Strategic Planning',
      description: 'Oversee research strategic initiatives',
      bgColor: 'bg-green-50',
      titleColor: 'text-green-800',
      textColor: 'text-green-600'
    },
    {
      title: 'Policy Decisions',
      description: 'Make policy-level research decisions',
      bgColor: 'bg-purple-50',
      titleColor: 'text-purple-800',
      textColor: 'text-purple-600'
    }
  ];

  const activitySection = {
    title: 'Executive Summary',
    placeholder: 'No pending executive reviews'
  };

  return (
    <Dashboard 
      title="Office of the President Dashboard"
      cards={cards}
      activitySection={activitySection}
    />
  );
};

export default OPDashboard;
