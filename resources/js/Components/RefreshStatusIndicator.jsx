import React from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useMessages } from '../contexts/MessageContext';
import { useNotifications } from '../contexts/NotificationContext';

const RefreshStatusIndicator = () => {
  const { 
    isRefreshing: messageRefreshing, 
    lastRefresh: messageLastRefresh,
    unreadCount: messageUnreadCount 
  } = useMessages();
  
  const { 
    isRefreshing: notificationRefreshing, 
    lastRefresh: notificationLastRefresh,
    unreadCount: notificationUnreadCount 
  } = useNotifications();

  const isAnyRefreshing = messageRefreshing || notificationRefreshing;
  const hasUnreadContent = messageUnreadCount > 0 || notificationUnreadCount > 0;

  const formatLastRefresh = (lastRefresh) => {
    if (!lastRefresh) return 'Never';
    const now = new Date();
    const diff = now - new Date(lastRefresh);
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getStatusColor = () => {
    if (isAnyRefreshing) return 'text-blue-600';
    if (hasUnreadContent) return 'text-green-600';
    return 'text-gray-500';
  };

  const getStatusIcon = () => {
    if (isAnyRefreshing) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    if (hasUnreadContent) {
      return <CheckCircle className="w-4 h-4" />;
    }
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isAnyRefreshing) return 'Refreshing...';
    if (hasUnreadContent) return 'New content available';
    return 'Up to date';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
      
      {/* Last refresh time */}
      <div className="text-xs text-gray-500">
        {messageLastRefresh && notificationLastRefresh ? (
          <span>
            Last: {formatLastRefresh(
              new Date(messageLastRefresh) > new Date(notificationLastRefresh) 
                ? messageLastRefresh 
                : notificationLastRefresh
            )}
          </span>
        ) : (
          <span>Initializing...</span>
        )}
      </div>

      {/* Unread counts */}
      {(messageUnreadCount > 0 || notificationUnreadCount > 0) && (
        <div className="flex items-center gap-1">
          {messageUnreadCount > 0 && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {messageUnreadCount} messages
            </span>
          )}
          {notificationUnreadCount > 0 && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              {notificationUnreadCount} notifications
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default RefreshStatusIndicator;
