import React from 'react';
import Dashboard from '../../../Components/UI/Dashboard';

const OSUORUDashboard = () => {
  const cards = [
    {
      title: 'Student Research',
      description: 'Manage student research initiatives',
      bgColor: 'bg-blue-50',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-600'
    },
    {
      title: 'University Relations',
      description: 'Handle external research partnerships',
      bgColor: 'bg-green-50',
      titleColor: 'text-green-800',
      textColor: 'text-green-600'
    },
    {
      title: 'Student Affairs',
      description: 'Oversee student research activities',
      bgColor: 'bg-purple-50',
      titleColor: 'text-purple-800',
      textColor: 'text-purple-600'
    }
  ];

  const activitySection = {
    title: 'Student Research Activities',
    placeholder: 'No active student research activities'
  };

  return (
    <Dashboard 
      title="OSUORU Dashboard"
      cards={cards}
      activitySection={activitySection}
    />
  );
};

export default OSUORUDashboard;
