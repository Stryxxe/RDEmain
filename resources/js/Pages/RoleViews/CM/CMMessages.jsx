import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, Search, RefreshCw, User, Clock, AlertCircle } from 'lucide-react';
import { useMessages } from '../../../contexts/MessageContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import AutoRefreshControls from '../../../Components/AutoRefreshControls';
import RefreshStatusIndicator from '../../../Components/RefreshStatusIndicator';
import axios from 'axios';

const CMMessages = () => {
  const { user } = useAuth();
  const { refreshAllMessages, isRefreshing: messageRefreshing } = useMessages();
  const { refreshAllNotifications } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Restore conversation from URL parameter after conversations are loaded
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      const conversationId = searchParams.get('conversation');
      if (conversationId) {
        const conversation = conversations.find(conv => conv.otherUser.userID === conversationId);
        if (conversation) {
          handleConversationClick(conversation);
        }
      }
    }
  }, [conversations, searchParams, selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/messages/conversations');
      if (response.data.data) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setSelectedConversation(null);
    setCurrentConversation(null);
    setSearchParams({});
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        fetchConversations(),
        refreshAllMessages(),
        refreshAllNotifications()
      ]);
      // If a conversation is selected, refresh its messages too
      if (selectedConversation) {
        await fetchConversation(selectedConversation.otherUser.userID);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchConversation = async (otherUserId) => {
    try {
      const response = await axios.get(`/messages/conversation/${otherUserId}`);
      if (response.data.data) {
        setCurrentConversation(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return [];
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;
    
    setSendingMessage(true);
    try {
      const recipientID = String(selectedConversation.otherUser.userID);
      
      const result = await axios.post('/messages', {
        recipientID: recipientID,
        subject: `Re: ${selectedConversation.latestMessage.subject}`,
        content: newMessage,
        type: 'reply'
      });
    
      setNewMessage('');
      
      // Refresh the conversation to show the new message
      await fetchConversation(recipientID);
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send message. Please try again.';
      alert(`Failed to send message: ${errorMessage}`);
    } finally {
      setSendingMessage(false);
    }
  };

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

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleConversationClick = async (conversation) => {
    setSelectedConversation(conversation);
    setSearchParams({ conversation: conversation.otherUser.userID });
    await fetchConversation(conversation.otherUser.userID);
  };

  const filteredConversations = conversations.filter(conversation => {
    const searchLower = searchTerm.toLowerCase();
    const otherUserName = conversation.otherUser?.fullName || 'Unknown';
    const latestMessageContent = conversation.latestMessage?.content || '';
    const latestMessageSubject = conversation.latestMessage?.subject || '';
    
    return otherUserName.toLowerCase().includes(searchLower) ||
           latestMessageContent.toLowerCase().includes(searchLower) ||
           latestMessageSubject.toLowerCase().includes(searchLower);
  });

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing || messageRefreshing}
                  className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing || messageRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing || messageRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
            <p className="text-gray-600">Communicate with researchers and team members</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-refresh Controls */}
            <AutoRefreshControls />
            <RefreshStatusIndicator />
            {getTotalUnreadCount() > 0 && (
              <button
                onClick={() => {
                  // Mark all as read functionality
                  console.log('Mark all as read');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Mark All as Read
              </button>
            )}
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to clear all conversations? This will delete all messages.')) {
                  try {
                    await axios.delete('/messages/clear-all');
                    clearConversation();
                    await fetchConversations();
                  } catch (error) {
                    alert('Failed to clear messages. Please try again.');
                  }
                }
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No conversations found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.otherUser.userID}
                      onClick={() => handleConversationClick(conversation)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.otherUser.userID === conversation.otherUser.userID 
                          ? 'bg-red-50 border-r-2 border-red-600' 
                          : ''
                      } ${conversation.unreadCount > 0 ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {conversation.otherUser.fullName}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                              {conversation.otherUser.role?.userRole || 'User'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.latestMessage.created_at)}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-1 line-clamp-1">
                        {conversation.latestMessage.subject}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {conversation.latestMessage.content?.substring(0, 60) + 
                         (conversation.latestMessage.content?.length > 60 ? '...' : '')}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            {conversation.unreadCount} unread
                          </span>
                          <span className="text-xs text-gray-400">
                            {conversation.totalMessages} messages
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conversation Detail */}
        <div className="lg:col-span-2">
          {selectedConversation && currentConversation ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
              {/* Conversation Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedConversation.otherUser.fullName}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {selectedConversation.otherUser.role?.userRole || 'User'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearConversation}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Close conversation"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto max-h-96">
                <div className="space-y-4">
                  {currentConversation.map((message, index) => {
                    const isFromCurrentUser = message.senderID !== selectedConversation.otherUser.userID;
                    const showDate = index === 0 || 
                      new Date(message.created_at).toDateString() !== 
                      new Date(currentConversation[index - 1].created_at).toDateString();
                    
                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              {new Date(message.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isFromCurrentUser 
                              ? 'bg-red-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isFromCurrentUser ? 'text-red-100' : 'text-gray-500'
                            }`}>
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reply Section */}
              <div className="p-6 border-t border-gray-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reply
                    </label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Type your reply here..."
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                      {sendingMessage ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a conversation to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CMMessages;
