import React from 'react';
import DocumentCard from './DocumentCard';

const ResourceGrid = ({ 
  resources = [], 
  onDownload, 
  onView, 
  variant = 'default',
  className = "",
  emptyMessage = "No resources available"
}) => {
  if (resources.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Resources</h3>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const getGridClasses = () => {
    switch (variant) {
      case 'compact':
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";
      case 'detailed':
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
      default:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
    }
  };

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {resources.map((resource, index) => (
        <DocumentCard
          key={resource.id || index}
          document={resource}
          onDownload={onDownload}
          onView={onView}
          variant={variant}
        />
      ))}
    </div>
  );
};

export default ResourceGrid;
