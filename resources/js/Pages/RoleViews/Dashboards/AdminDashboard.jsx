import React from 'react';
import Dashboard from '../../../Components/UI/Dashboard';

const AdminDashboard = () => {
  const cards = [
    {
      title: 'User Management',
      description: 'Manage system users and their roles',
      bgColor: 'bg-blue-50',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-600'
    },
    {
      title: 'System Settings',
      description: 'Configure system parameters',
      bgColor: 'bg-green-50',
      titleColor: 'text-green-800',
      textColor: 'text-green-600'
    },
    {
      title: 'Reports',
      description: 'View system reports and analytics',
      bgColor: 'bg-purple-50',
      titleColor: 'text-purple-800',
      textColor: 'text-purple-600'
    }
  ];

  const activitySection = {
    title: 'Recent Activity',
    placeholder: 'No recent activity to display'
  };

  return (
    <Dashboard 
      title="Administrator Dashboard"
      cards={cards}
      activitySection={activitySection}
    />
  );
};

export default AdminDashboard;
