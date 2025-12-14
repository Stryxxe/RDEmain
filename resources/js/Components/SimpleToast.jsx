import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const SimpleToast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          iconBg: 'bg-green-500',
          icon: <CheckCircle className="w-5 h-5 text-white" />,
          text: 'text-green-800',
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          iconBg: 'bg-red-500',
          icon: <AlertCircle className="w-5 h-5 text-white" />,
          text: 'text-red-800',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          iconBg: 'bg-blue-500',
          icon: <CheckCircle className="w-5 h-5 text-white" />,
          text: 'text-blue-800',
        };
    }
  };

  const styles = getStyles();

  return (
    <div 
      className="fixed top-20 right-4 z-[9999]"
      style={{
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div
        className={`${styles.bg} ${styles.border} border-2 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-md`}
      >
        {/* Icon */}
        <div className={`${styles.iconBg} rounded-full flex items-center justify-center flex-shrink-0 w-8 h-8`}>
          {styles.icon}
        </div>

        {/* Message */}
        <p className={`${styles.text} text-sm font-medium flex-1`}>
          {message}
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`${styles.text} hover:opacity-70 transition-opacity flex-shrink-0`}
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SimpleToast;

