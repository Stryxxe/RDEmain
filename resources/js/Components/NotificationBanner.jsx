import React from 'react';
import { X, AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react';

const NotificationBanner = ({ 
  type = 'info', 
  title, 
  message, 
  onClose,
  className = ''
}) => {
  const getStyles = (type) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-orange-50',
          border: 'border-b-orange-300',
          iconBg: 'bg-yellow-500',
          icon: <AlertTriangle className="w-4 h-4 text-black" />,
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-b-blue-300',
          iconBg: 'bg-blue-500',
          icon: <Info className="w-4 h-4 text-white" />,
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-b-green-300',
          iconBg: 'bg-green-500',
          icon: <CheckCircle className="w-4 h-4 text-white" />,
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-b-red-300',
          iconBg: 'bg-red-500',
          icon: <AlertCircle className="w-4 h-4 text-white" />,
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-b-gray-300',
          iconBg: 'bg-gray-500',
          icon: <Info className="w-4 h-4 text-white" />,
        };
    }
  };

  const styles = getStyles(type);
  const iconContainerClass = type === 'warning' 
    ? 'bg-yellow-500' 
    : `${styles.iconBg} rounded-full`;

  return (
    <div 
      className={`${styles.bg} ${styles.border} border-b-2 rounded-lg shadow-md p-4 flex items-start gap-3 ${className}`}
    >
      {/* Icon */}
      <div className={`${iconContainerClass} flex items-center justify-center flex-shrink-0 ${
        type === 'warning' ? 'w-5 h-5' : 'w-5 h-5'
      }`}>
        {styles.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-bold text-gray-900 mb-1">
            {title}
          </h4>
        )}
        <p className="text-sm text-gray-700">
          {message}
        </p>
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0 ml-2"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default NotificationBanner;

