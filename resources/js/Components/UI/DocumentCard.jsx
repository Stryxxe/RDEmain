import React from 'react';
import { Download, Eye, FileText } from 'lucide-react';

const DocumentCard = ({ 
  document, 
  onDownload, 
  onView, 
  variant = 'default',
  className = "" 
}) => {
  const getFileIcon = (type) => {
    const iconClass = "w-6 h-6";
    switch (type?.toLowerCase()) {
      case 'pdf':
        return <FileText className={`${iconClass} text-red-600`} />;
      case 'xlsx':
      case 'xls':
        return <FileText className={`${iconClass} text-green-600`} />;
      case 'docx':
      case 'doc':
        return <FileText className={`${iconClass} text-blue-600`} />;
      default:
        return <FileText className={`${iconClass} text-gray-600`} />;
    }
  };

  const getCardStyles = () => {
    switch (variant) {
      case 'compact':
        return "bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 p-4";
      case 'detailed':
        return "bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden group h-full flex flex-col";
      default:
        return "bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 p-6";
    }
  };

  return (
    <div className={`${getCardStyles()} ${className}`}>
      <div className="flex items-start space-x-4">
        {/* Document icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            {getFileIcon(document.type)}
          </div>
        </div>
        
        {/* Document content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {document.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {document.description}
          </p>
          
          {/* File info */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <span className="font-medium">{document.fileName || document.title}</span>
            <span>{document.fileSize || document.size}</span>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-2">
            {onView && (
              <button
                onClick={() => onView(document)}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
            )}
            {onDownload && (
              <button
                onClick={() => onDownload(document)}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
