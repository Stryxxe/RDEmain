import React from 'react';

const Dashboard = ({ 
  title, 
  cards = [], 
  activitySection = null,
  className = "" 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div 
            key={index}
            className={`${card.bgColor || 'bg-blue-50'} p-6 rounded-lg`}
          >
            <h3 className={`text-lg font-semibold ${card.titleColor || 'text-blue-800'} mb-2`}>
              {card.title}
            </h3>
            <p className={card.textColor || 'text-blue-600'}>
              {card.description}
            </p>
            {card.action && (
              <button 
                onClick={card.action}
                className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  card.actionColor || 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {card.actionText || 'View Details'}
              </button>
            )}
          </div>
        ))}
      </div>
      
      {activitySection && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {activitySection.title}
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            {activitySection.content || (
              <p className="text-gray-600">{activitySection.placeholder || 'No recent activity to display'}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
