import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dismissedToasts, setDismissedToasts] = useState(new Set());

  // Load dismissed notifications from localStorage on mount
  useEffect(() => {
    const loadDismissedToasts = () => {
      try {
        const stored = localStorage.getItem('dismissedNotifications');
        if (stored) {
          const dismissedArray = JSON.parse(stored);
          setDismissedToasts(new Set(dismissedArray));
        }
      } catch (error) {
        setDismissedToasts(new Set());
      }
    };

    loadDismissedToasts();
  }, []);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) { setNotifications([]); return; }
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(response.data.data || []);
    } catch (error) {
      // Set empty array on error to prevent undefined issues
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setUnreadCount(0); return; }
      const response = await axios.get('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      setUnreadCount(0);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, []);

  // React to token changes across the app
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'token') {
        const token = e.newValue;
        if (token) {
          fetchNotifications();
          fetchUnreadCount();
        } else {
          setNotifications([]);
          setUnreadCount(0);
          // Clear dismissed notifications when user logs out
          clearDismissedToasts();
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state immediately for better UX
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Refresh from API after a short delay to ensure consistency
      setTimeout(() => {
        fetchNotifications();
        fetchUnreadCount();
      }, 500);
    } catch (error) {
      // Error handling for marking notification as read
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      // Error handling for marking all notifications as read
    }
  };

  const removeNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      // Update unread count if the notification was unread
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      // Error handling for deleting notification
    }
  };

  const dismissToast = (id) => {
    // Add to dismissed set and save to localStorage
    setDismissedToasts(prev => {
      const newDismissed = new Set([...prev, id]);
      
      // Save to localStorage
      try {
        const dismissedArray = Array.from(newDismissed);
        localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedArray));
      } catch (error) {
        // Error handling for saving dismissed notifications
      }
      
      return newDismissed;
    });
  };

  const refreshNotifications = () => {
    fetchNotifications();
    fetchUnreadCount();
  };

  // Clear dismissed notifications (useful for logout)
  const clearDismissedToasts = () => {
    setDismissedToasts(new Set());
    try {
      localStorage.removeItem('dismissedNotifications');
    } catch (error) {
      // Error handling for clearing dismissed notifications
    }
  };

  // Get notifications that should be shown as toasts (unread and not dismissed)
  const getToastNotifications = () => {
    const toastNotifications = notifications.filter(notification => 
      !notification.read && !dismissedToasts.has(notification.id)
    );
    return toastNotifications;
  };

  // Clean up dismissed notifications that no longer exist in the notifications list
  useEffect(() => {
    if (notifications.length > 0 && dismissedToasts.size > 0) {
      const notificationIds = new Set(notifications.map(n => n.id));
      const validDismissed = Array.from(dismissedToasts).filter(id => notificationIds.has(id));
      
      if (validDismissed.length !== dismissedToasts.size) {
        setDismissedToasts(new Set(validDismissed));
        try {
          localStorage.setItem('dismissedNotifications', JSON.stringify(validDismissed));
        } catch (error) {
          // Error handling for cleaning up dismissed notifications
        }
      }
    }
  }, [notifications, dismissedToasts]);

  const value = {
    notifications,
    loading,
    unreadCount,
    removeNotification,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    dismissToast,
    getToastNotifications,
    clearDismissedToasts,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
