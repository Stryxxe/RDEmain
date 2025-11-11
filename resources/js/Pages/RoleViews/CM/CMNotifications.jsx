import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import { useMessages } from '../../../contexts/MessageContext';
import { RefreshCw } from 'lucide-react';
import AutoRefreshControls from '../../../Components/AutoRefreshControls';
import RefreshStatusIndicator from '../../../Components/RefreshStatusIndicator';
import axios from 'axios';

// Use window.axios which has session-based auth configured, or configure this instance
const axiosInstance = window.axios || axios;
if (!window.axios) {
  axiosInstance.defaults.withCredentials = true;
  axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const CMNotifications = () => {
  const { user } = useAuth();
  const { refreshAllNotifications, isRefreshing: notificationRefreshing } = useNotifications();
  const { refreshAllMessages } = useMessages();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      
      // Use window.axios for proper session handling (baseURL is already set to /api)
      const response = await (window.axios || axiosInstance).get('/notifications', {
        headers: { 
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true
      });
      
      if (response.data && response.data.success) {
        setNotifications(response.data.data || []);
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback: if response is directly an array
        setNotifications(response.data);
      } else {
        console.warn('Unexpected notification response format:', response.data);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 401) {
        console.error('Unauthorized - session may have expired');
        setNotifications([]);
      } else if (error.response?.status === 500) {
        console.error('Server error fetching notifications');
        setNotifications([]);
      } else {
        // Network error or other issues
        console.error('Failed to fetch notifications:', error.message);
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        fetchNotifications(),
        refreshAllNotifications(),
        refreshAllMessages()
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      if (!user) return;
      await (window.axios || axiosInstance).put(`/notifications/${notificationId}/read`, {}, {
        headers: { 
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true
      });
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      // Refresh notifications to get updated state
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (error.response?.status === 401) {
        console.error('Unauthorized - session may have expired');
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user) return;
      await (window.axios || axiosInstance).put('/notifications/mark-all-read', {}, {
        headers: { 
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true
      });
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true, read_at: new Date().toISOString() }))
      );
      // Refresh notifications to get updated state
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      if (error.response?.status === 401) {
        console.error('Unauthorized - session may have expired');
      }
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      if (!user) return;
      await (window.axios || axiosInstance).delete(`/notifications/${notificationId}`, {
        headers: { 
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true
      });
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      if (error.response?.status === 401) {
        console.error('Unauthorized - session may have expired');
      }
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read_at;
    if (filter === 'read') return notification.read_at;
    return true;
  });

  const getNotificationIcon = (notification) => {
    // Check data.event first, then fall back to type
    const eventType = notification.data?.event || notification.type;
    
    switch (eventType) {
      case 'proposal.submitted.cm':
      case 'proposal.submitted':
      case 'proposal_submitted':
        return '📄';
      case 'proposal.approved':
      case 'proposal_approved':
        return '✅';
      case 'proposal.rejected':
      case 'proposal_rejected':
        return '❌';
      case 'progress_report':
        return '📊';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (notification) => {
    // Check data.event first, then fall back to type
    const eventType = notification.data?.event || notification.type;
    
    switch (eventType) {
      case 'proposal.submitted.cm':
      case 'proposal.submitted':
      case 'proposal_submitted':
        return 'bg-blue-100 text-blue-800';
      case 'proposal.approved':
      case 'proposal_approved':
        return 'bg-green-100 text-green-800';
      case 'proposal.rejected':
      case 'proposal_rejected':
        return 'bg-red-100 text-red-800';
      case 'progress_report':
        return 'bg-orange-100 text-orange-800';
      case 'system':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Notifications
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Stay updated with the latest activities and updates
          </p>
          
          {/* Auto-refresh Controls */}
          <div className="flex flex-wrap justify-center items-center gap-4">
            <AutoRefreshControls />
            <RefreshStatusIndicator />
            
            {/* Manual Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || notificationRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh notifications and messages"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing || notificationRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing || notificationRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
              <span className="text-sm text-gray-500">
                {filteredNotifications.length} notifications
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Mark All as Read
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">
                {filter === 'unread' ? 'You have no unread notifications' : 
                 filter === 'read' ? 'You have no read notifications' : 
                 'You have no notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.read_at ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xl">{getNotificationIcon(notification)}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getNotificationColor(notification)}`}>
                            {(notification.data?.event || notification.type || 'notification').replace(/[._]/g, ' ').toUpperCase()}
                          </span>
                          {!notification.read_at && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              NEW
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{new Date(notification.created_at).toLocaleString()}</span>
                          {notification.read_at && (
                            <span>Read {new Date(notification.read_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read_at && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CMNotifications;
