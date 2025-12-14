import React from 'react';

const StatsCard = ({ number, label, colorClass = 'text-blue-900' }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center transition-transform duration-200 hover:-translate-y-1">
      <div className={`text-4xl font-bold ${colorClass} mb-3`}>{number}</div>
      <div className="text-gray-600 font-medium">{label}</div>
    </div>
  );
};

export default StatsCard;










