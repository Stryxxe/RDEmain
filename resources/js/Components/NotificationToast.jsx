import React from 'react';
import NotificationBanner from './NotificationBanner';
import { Clock } from 'lucide-react';

const NotificationToast = ({ notification, onRemove, onMarkAsRead }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    let notificationDate;
    
    // Handle different timestamp formats
    if (typeof timestamp === 'string') {
      notificationDate = new Date(timestamp);
      
      if (isNaN(notificationDate.getTime())) {
        const numTimestamp = parseFloat(timestamp);
        if (!isNaN(numTimestamp)) {
          notificationDate = new Date(numTimestamp * 1000);
        }
      }
    } else if (typeof timestamp === 'number') {
      notificationDate = new Date(timestamp * 1000);
    } else {
      notificationDate = new Date(timestamp);
    }
    
    if (isNaN(notificationDate.getTime())) {
      return 'Unknown time';
    }
    
    const diff = now - notificationDate;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Map notification types to banner types
  const getBannerType = (type) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const messageWithTime = (
    <div>
      <p className="mb-1">{notification.message}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(notification.created_at)}
        </span>
        {!notification.read && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            {onMarkAsRead && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors ml-2"
              >
                Mark as read
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`mb-3 transition-all duration-300 ${
      !notification.read ? 'ring-2 ring-blue-200 rounded-lg' : ''
    }`}>
      <NotificationBanner
        type={getBannerType(notification.type)}
        title={notification.title}
        message={messageWithTime}
        onClose={() => onRemove(notification.id)}
      />
    </div>
  );
};

export default NotificationToast;
