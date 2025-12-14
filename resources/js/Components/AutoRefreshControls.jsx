import React, { useState } from 'react';
import { useMessages } from '../contexts/MessageContext';
import { useNotifications } from '../contexts/NotificationContext';
import { RefreshCw, Settings, Clock, Eye, EyeOff } from 'lucide-react';

const AutoRefreshControls = () => {
  const { 
    autoRefreshEnabled: messageAutoRefresh, 
    setAutoRefreshEnabled: setMessageAutoRefresh,
    isRefreshing: messageRefreshing,
    lastRefresh: messageLastRefresh,
    refreshAllMessages
  } = useMessages();
  
  const { 
    autoRefreshEnabled: notificationAutoRefresh, 
    setAutoRefreshEnabled: setNotificationAutoRefresh,
    isRefreshing: notificationRefreshing,
    lastRefresh: notificationLastRefresh,
    refreshAllNotifications
  } = useNotifications();

  const [showSettings, setShowSettings] = useState(false);

  const formatLastRefresh = (lastRefresh) => {
    if (!lastRefresh) return 'Never';
    const now = new Date();
    const diff = now - new Date(lastRefresh);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleManualRefresh = async () => {
    try {
      await Promise.all([
        refreshAllMessages(),
        refreshAllNotifications()
      ]);
    } catch (error) {
      console.error('Manual refresh failed:', error);
    }
  };

  const isAnyRefreshing = messageRefreshing || notificationRefreshing;

  return (
    <div className="relative">
      {/* Settings Toggle Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Auto-refresh settings"
      >
        <Settings className="w-4 h-4" />
        <span>Auto-refresh</span>
        {(messageAutoRefresh || notificationAutoRefresh) && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        )}
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Auto-refresh Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages Auto-refresh */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Messages</label>
                <button
                  onClick={() => setMessageAutoRefresh(!messageAutoRefresh)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                    messageAutoRefresh 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {messageAutoRefresh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {messageAutoRefresh ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Last refresh: {formatLastRefresh(messageLastRefresh)}</div>
                <div>Status: {messageRefreshing ? 'Refreshing...' : 'Idle'}</div>
                <div>Interval: Smart (10s-2min based on activity)</div>
              </div>
            </div>

            {/* Notifications Auto-refresh */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Notifications</label>
                <button
                  onClick={() => setNotificationAutoRefresh(!notificationAutoRefresh)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                    notificationAutoRefresh 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {notificationAutoRefresh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {notificationAutoRefresh ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Last refresh: {formatLastRefresh(notificationLastRefresh)}</div>
                <div>Status: {notificationRefreshing ? 'Refreshing...' : 'Idle'}</div>
                <div>Interval: Smart (15s-3min based on activity)</div>
              </div>
            </div>

            {/* Manual Refresh Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleManualRefresh}
                disabled={isAnyRefreshing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isAnyRefreshing ? 'animate-spin' : ''}`} />
                {isAnyRefreshing ? 'Refreshing...' : 'Refresh Now'}
              </button>
            </div>

            {/* Info Section */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-800">
                <div className="font-medium mb-1">Smart Refresh Intervals:</div>
                <ul className="space-y-1 text-blue-700">
                  <li>• Unread content: 10-15 seconds</li>
                  <li>• Active conversation: 15 seconds</li>
                  <li>• Recent activity: 30-45 seconds</li>
                  <li>• Background tab: 2-3 minutes</li>
                  <li>• Idle: 1-1.5 minutes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoRefreshControls;
