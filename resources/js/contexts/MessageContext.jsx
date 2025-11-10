import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Use window.axios which has session-based auth configured, or configure this instance
const axiosInstance = window.axios || axios;
if (!window.axios) {
  axiosInstance.defaults.withCredentials = true;
  axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const MessageContext = createContext();

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const { user, loading: authLoading } = useAuth();

  // Auto-refresh state
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default
  const refreshTimeoutRef = useRef(null);
  const isActiveRef = useRef(true);
  const lastActivityRef = useRef(Date.now());

  // Smart refresh interval calculation
  const getSmartRefreshInterval = useCallback(() => {
    if (!autoRefreshEnabled) return null;
    
    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;
    const hasUnreadContent = unreadCount > 0;
    const isTabVisible = !document.hidden;
    const hasActiveConversation = currentConversation && currentConversation.length > 0;
    
    // If tab is hidden, refresh less frequently
    if (!isTabVisible) return 120000; // 2 minutes
    
    // If there's unread content, refresh more frequently
    if (hasUnreadContent) return 10000; // 10 seconds
    
    // If user is actively in a conversation, refresh frequently
    if (hasActiveConversation && timeSinceActivity < 30000) return 15000; // 15 seconds
    
    // If user was recently active, refresh moderately
    if (timeSinceActivity < 60000) return 30000; // 30 seconds
    
    // Default refresh interval
    return 60000; // 1 minute
  }, [autoRefreshEnabled, unreadCount, currentConversation]);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Refresh all message data
  const refreshAllMessages = useCallback(async () => {
    if (isRefreshing || !isActiveRef.current) return;
    
    try {
      setIsRefreshing(true);
      await Promise.all([
        fetchMessages(),
        fetchSentMessages(),
        fetchConversations(),
        fetchUnreadCount()
      ]);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  // Set up auto-refresh
  const setupAutoRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    if (!autoRefreshEnabled || !user) return;

    const interval = getSmartRefreshInterval();
    if (interval) {
      refreshTimeoutRef.current = setTimeout(() => {
        if (isActiveRef.current) {
          refreshAllMessages().then(() => {
            setupAutoRefresh(); // Schedule next refresh
          });
        }
      }, interval);
    }
  }, [autoRefreshEnabled, user, getSmartRefreshInterval, refreshAllMessages]);

  // Fetch received messages from API
  const fetchMessages = async () => {
    try {
      setLoading(true);
      if (!user) { setMessages([]); return; }
      const response = await axiosInstance.get('/messages', {
        withCredentials: true
      });
      setMessages(response.data.data || []);
    } catch (error) {
      // Error handling for fetching messages
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sent messages from API
  const fetchSentMessages = async () => {
    try {
      if (!user) { setSentMessages([]); return; }
      const response = await axiosInstance.get('/messages/sent', {
        withCredentials: true
      });
      setSentMessages(response.data.data || []);
    } catch (error) {
      // Error handling for fetching sent messages
      setSentMessages([]);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      if (!user) { setUnreadCount(0); return; }
      const response = await axiosInstance.get('/messages/unread-count', {
        withCredentials: true
      });
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      setUnreadCount(0);
    }
  };

  // Fetch conversations from API
  const fetchConversations = async () => {
    try {
      if (!user) { setConversations([]); return; }
      const response = await axiosInstance.get('/messages/conversations', {
        withCredentials: true
      });
      setConversations(response.data.data || []);
    } catch (error) {
      // Error handling for fetching conversations
      setConversations([]);
    }
  };

  // Fetch specific conversation
  const fetchConversation = async (otherUserId) => {
    try {
      if (!user) return [];
      const response = await axiosInstance.get(`/messages/conversation/${otherUserId}`, {
        withCredentials: true
      });
      setCurrentConversation(response.data.data || []);
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  };

  // Load messages when authenticated and auth check finished
  useEffect(() => {
    if (authLoading) return;
    
    // Check if we're on the login page
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath === '/login' || currentPath === '/';
    
    if (!user || isLoginPage) {
      // Clear any stale data if not authenticated or on login page
      setMessages([]);
      setSentMessages([]);
      setConversations([]);
      setCurrentConversation(null);
      setUnreadCount(0);
      isActiveRef.current = false;
      return;
    }
    
    isActiveRef.current = true;
    fetchMessages();
    fetchSentMessages();
    fetchConversations();
    fetchUnreadCount();
  }, [user, authLoading]);

  // Set up auto-refresh when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      setupAutoRefresh();
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [user, authLoading, setupAutoRefresh]);

  // Re-setup auto-refresh when dependencies change
  useEffect(() => {
    if (user && !authLoading) {
      setupAutoRefresh();
    }
  }, [unreadCount, currentConversation, autoRefreshEnabled, setupAutoRefresh]);

  // Track user activity for smart refresh
  useEffect(() => {
    const handleActivity = () => {
      updateActivity();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateActivity();
        // Refresh immediately when tab becomes visible
        if (user && !authLoading) {
          refreshAllMessages();
        }
      }
    };

    // Add event listeners for activity tracking
    document.addEventListener('mousedown', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('scroll', handleActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('mousedown', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, authLoading, updateActivity, refreshAllMessages]);

  const markAsRead = async (id) => {
    try {
      if (!user) return;
      await axiosInstance.put(`/messages/${id}/read`, {}, {
        withCredentials: true
      });
      setMessages(prev =>
        prev.map(message =>
          message.id === id
            ? { ...message, read: true, read_at: new Date().toISOString() }
            : message
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      // Error handling for marking message as read
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user) return;
      await axiosInstance.put('/messages/mark-all-read', {}, {
        withCredentials: true
      });
      setMessages(prev =>
        prev.map(message => ({ ...message, read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      // Error handling for marking all messages as read
    }
  };

  const deleteMessage = async (id) => {
    try {
      if (!user) return;
      await axiosInstance.delete(`/messages/${id}`, {
        withCredentials: true
      });
      setMessages(prev => prev.filter(message => message.id !== id));
      // Update unread count if the message was unread
      const message = messages.find(m => m.id === id);
      if (message && !message.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      // Error handling for deleting message
    }
  };

  const deleteSentMessage = async (id) => {
    try {
      if (!user) return;
      await axiosInstance.delete(`/messages/${id}`, {
        withCredentials: true
      });
      setSentMessages(prev => prev.filter(message => message.id !== id));
    } catch (error) {
      // Error handling for deleting sent message
    }
  };

  const sendMessage = async (recipientId, subject, content, type = 'general') => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const response = await axiosInstance.post('/messages', {
        recipientID: recipientId,
        subject,
        content,
        type
      }, {
        withCredentials: true
      });
      
      // Refresh all message data after sending
      await refreshAllMessages();
      
      // If we're in a conversation, refresh it
      if (currentConversation && currentConversation.length > 0) {
        const otherUserId = currentConversation[0].senderID === response.data.senderID 
          ? currentConversation[0].recipientID 
          : currentConversation[0].senderID;
        await fetchConversation(otherUserId);
      }
      
      // Update activity timestamp
      updateActivity();
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Fetch available CM for proponents
  const fetchAvailableCM = async () => {
    try {
      if (!user) return null;
      const response = await axiosInstance.get('/messages/available-cm', {
        headers: { 'Accept': 'application/json' },
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch available CM:', error);
      return null;
    }
  };

  // Fetch available proponents for CM users
  const fetchAvailableProponents = async () => {
    try {
      if (!user) return null;
      const response = await axiosInstance.get('/messages/available-proponents', {
        headers: { 'Accept': 'application/json' },
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch available proponents:', error);
      return null;
    }
  };

  const refreshMessages = () => {
    fetchMessages();
    fetchSentMessages();
    fetchConversations();
    fetchUnreadCount();
  };

  const clearAllMessages = async () => {
    try {
      if (!user) return false;
      await axiosInstance.delete('/messages/clear-all', {
        withCredentials: true
      });
      
      // Clear local state
      setMessages([]);
      setSentMessages([]);
      setConversations([]);
      setCurrentConversation(null);
      setUnreadCount(0);
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const value = {
    messages,
    sentMessages,
    conversations,
    currentConversation,
    loading,
    unreadCount,
    isRefreshing,
    lastRefresh,
    autoRefreshEnabled,
    refreshInterval,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    deleteSentMessage,
    sendMessage,
    refreshMessages,
    refreshAllMessages,
    fetchConversations,
    fetchConversation,
    setCurrentConversation,
    fetchAvailableCM,
    fetchAvailableProponents,
    clearAllMessages,
    setAutoRefreshEnabled,
    setRefreshInterval,
    updateActivity,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};