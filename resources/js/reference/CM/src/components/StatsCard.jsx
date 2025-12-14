import React from 'react';

const StatsCard = ({ number, label }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center transition-transform duration-200 hover:-translate-y-1">
      <div className="text-4xl font-bold text-blue-900 mb-3">{number}</div>
      <div className="text-gray-600 font-medium">{label}</div>
    </div>
  );
};

export default StatsCard; 