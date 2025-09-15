import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch received messages from API
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/messages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sent messages from API
  const fetchSentMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/messages/sent', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSentMessages(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch sent messages:', error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/messages/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Messages unread count API response:', response.data);
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      setUnreadCount(0);
    }
  };

  // Load messages on mount
  useEffect(() => {
    console.log('MessageContext: Initializing...');
    fetchMessages();
    fetchSentMessages();
    fetchUnreadCount();
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/messages/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
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
      console.error('Failed to mark message as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/messages/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev =>
        prev.map(message => ({ ...message, read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
    }
  };

  const deleteMessage = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.filter(message => message.id !== id));
      // Update unread count if the message was unread
      const message = messages.find(m => m.id === id);
      if (message && !message.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const sendMessage = async (recipientId, subject, content, type = 'general') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/messages', {
        recipientID: recipientId,
        subject,
        content,
        type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh sent messages
      fetchSentMessages();
      
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const refreshMessages = () => {
    fetchMessages();
    fetchSentMessages();
    fetchUnreadCount();
  };

  const value = {
    messages,
    sentMessages,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    sendMessage,
    refreshMessages,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};