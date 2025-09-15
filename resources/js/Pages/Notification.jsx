import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { Bell, Check, X, Filter, Wifi, WifiOff } from 'lucide-react';

const Notification = () => {
  const [filter, setFilter] = useState('all');
  const { notifications, loading, unreadCount, markAsRead: markAsReadContext, markAllAsRead: markAllAsReadContext, removeNotification: removeNotificationContext, refreshNotifications } = useNotifications();
  const navigate = useNavigate();

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Convert notifications to display format
  const formattedNotifications = notifications.map(notification => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    time: formatTime(notification.created_at),
    unread: !notification.read,
    type: notification.type || 'info'
  }));

  const filteredNotifications = formattedNotifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return notification.unread;
    if (filter === 'read') return !notification.unread;
    return notification.type === filter;
  });

  const markAsRead = async (id) => {
    await markAsReadContext(id);
  };

  const markAllAsRead = async () => {
    await markAllAsReadContext();
  };

  const deleteNotification = (id) => {
    removeNotificationContext(id);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (notification.unread) {
      markAsRead(notification.id);
    }
    // Only navigate if it's a proposal notification, otherwise stay on the page
    if (notification.type === 'proposal') {
      navigate('/proponent/projects');
    }
    // For other notification types, just mark as read and stay on the page
  };

  const getTypeIcon = (type) => {
    const iconClass = "w-5 h-5";
    
    switch (type) {
      case 'proposal':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'reminder':
        return (
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className={`${iconClass} text-orange-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'approval':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className={`${iconClass} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'review':
        return (
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className={`${iconClass} text-purple-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        );
      case 'revision':
        return (
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg className={`${iconClass} text-yellow-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Bell className={`${iconClass} text-gray-600`} />
          </div>
        );
    }
  };

  // Use unreadCount from context instead of calculating locally

  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={refreshNotifications}
                    disabled={loading}
                    className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    <Wifi className="w-5 h-5" />
                    <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>
              <p className="text-gray-600">Stay updated with your research activities</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Read/Unread Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'all', label: 'All', count: formattedNotifications.length },
                { key: 'unread', label: 'Unread', count: formattedNotifications.filter(n => n.unread).length },
                { key: 'read', label: 'Read', count: formattedNotifications.filter(n => !n.unread).length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    filter === tab.key
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    filter === tab.key
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Type Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex gap-2">
              {[
                { key: 'proposal', label: 'Proposals' },
                { key: 'reminder', label: 'Reminders' },
                { key: 'approval', label: 'Approvals' },
                { key: 'success', label: 'Success' },
                { key: 'error', label: 'Error' },
                { key: 'warning', label: 'Warning' },
                { key: 'info', label: 'Info' }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === filterOption.key
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">
                {filter === 'unread' 
                  ? 'You have no unread notifications' 
                  : filter === 'read'
                  ? 'You have no read notifications'
                  : 'You have no notifications yet'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                    notification.unread ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {getTypeIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {notification.unread && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            )}
                            <h4 className="text-sm font-semibold text-gray-900">
                              {notification.title}
                            </h4>
                            {notification.unread && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Live
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400">
                            {notification.time}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {notification.unread && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Mark as read"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete notification"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
};

export default Notification;
