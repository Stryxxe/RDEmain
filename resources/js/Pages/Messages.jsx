import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../contexts/MessageContext';
import { MessageCircle, Send, Search, Filter, Wifi, WifiOff } from 'lucide-react';

const Messages = () => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    recipient: '',
    subject: '',
    content: '',
    type: 'general'
  });
  const { messages: realTimeMessages, sentMessages: realTimeSentMessages, markAsRead, markAllAsRead, deleteMessage, deleteSentMessage, sendMessage } = useMessages();
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

  // Convert real-time messages to display format
  const messages = realTimeMessages.map(message => ({
    id: message.id,
    sender: message.sender?.fullName || 'Unknown',
    senderRole: message.sender?.role?.userRole || 'Unknown',
    subject: message.subject,
    preview: message.content?.substring(0, 100) + '...' || message.preview,
    time: formatTime(message.created_at),
    unread: !message.read,
    type: message.type || 'general'
  }));

  const sentMessages = realTimeSentMessages.map(message => ({
    id: message.id,
    recipient: message.recipient?.fullName || 'Unknown',
    subject: message.subject,
    preview: message.content?.substring(0, 100) + '...' || message.preview,
    time: formatTime(message.created_at),
    status: 'sent'
  }));

  const currentMessages = activeTab === 'inbox' ? messages : sentMessages;
  const filteredMessages = currentMessages.filter(message => {
    const searchLower = searchTerm.toLowerCase();
    return message.subject.toLowerCase().includes(searchLower) ||
           message.preview.toLowerCase().includes(searchLower) ||
           (activeTab === 'inbox' ? message.sender : message.recipient).toLowerCase().includes(searchLower);
  });

  const getTypeColor = (type) => {
    switch (type) {
      case 'review': return 'text-blue-600 bg-blue-100';
      case 'revision': return 'text-yellow-600 bg-yellow-100';
      case 'meeting': return 'text-green-600 bg-green-100';
      case 'status': return 'text-purple-600 bg-purple-100';
      case 'security': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'review': return 'Review';
      case 'revision': return 'Revision';
      case 'meeting': return 'Meeting';
      case 'status': return 'Status';
      case 'security': return 'Security';
      default: return 'General';
    }
  };

  const unreadCount = messages.filter(m => m.unread).length;

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    if (message.unread) {
      markAsRead(message.id);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedMessage) return;
    
    // Send reply
    sendMessage(
      selectedMessage.sender, // This would be the actual recipient ID
      `Re: ${selectedMessage.subject}`,
      newMessage,
      'reply'
    );
    
    setNewMessage('');
  };

  const handleComposeMessage = () => {
    if (!composeData.recipient.trim() || !composeData.subject.trim() || !composeData.content.trim()) return;
    
    // Send new message
    sendMessage(
      composeData.recipient,
      composeData.subject,
      composeData.content,
      composeData.type
    );
    
    // Reset form and close modal
    setComposeData({
      recipient: '',
      subject: '',
      content: '',
      type: 'general'
    });
    setShowCompose(false);
  };

  const handleDeleteMessage = (messageId) => {
    if (activeTab === 'inbox') {
      deleteMessage(messageId);
    } else {
      deleteSentMessage(messageId);
    }
    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <Wifi className="w-5 h-5" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
              <p className="text-gray-600">Communicate with reviewers and administrators</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCompose(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send size={16} />
                Compose
              </button>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('inbox')}
                    className={`flex-1 px-4 py-3 text-sm font-medium text-center ${
                      activeTab === 'inbox'
                        ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Inbox {unreadCount > 0 && (
                      <span className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('sent')}
                    className={`flex-1 px-4 py-3 text-sm font-medium text-center ${
                      activeTab === 'sent'
                        ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Sent
                  </button>
                </nav>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
              </div>

              {/* Messages List */}
              <div className="max-h-96 overflow-y-auto">
                {filteredMessages.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No messages found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => handleMessageClick(message)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedMessage?.id === message.id ? 'bg-red-50 border-r-2 border-red-600' : ''
                        } ${message.unread ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {activeTab === 'inbox' ? message.sender : message.recipient}
                            </h4>
                            {message.unread && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{message.time}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMessage(message.id);
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete message"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {message.subject}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {message.preview}
                        </p>
                        {activeTab === 'inbox' && (
                          <div className="flex items-center justify-between mt-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(message.type)}`}>
                              {getTypeLabel(message.type)}
                            </span>
                            {message.unread && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Live
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
                {/* Message Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedMessage.subject}
                      </h2>
                      <p className="text-sm text-gray-600">
                        From: {activeTab === 'inbox' ? selectedMessage.sender : selectedMessage.recipient}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activeTab === 'inbox' ? selectedMessage.senderRole : 'To you'} • {selectedMessage.time}
                      </p>
                    </div>
                    {activeTab === 'inbox' && (
                      <span className={`px-3 py-1 text-xs rounded-full ${getTypeColor(selectedMessage.type)}`}>
                        {getTypeLabel(selectedMessage.type)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1 p-6">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {selectedMessage.preview}
                    </p>
                    <p className="text-gray-700 leading-relaxed mt-4">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <p className="text-gray-700 leading-relaxed mt-4">
                      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                  </div>
                </div>

                {/* Reply Section */}
                {activeTab === 'inbox' && (
                  <div className="p-6 border-t border-gray-200">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reply
                        </label>
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Type your reply here..."
                        />
                      </div>
                      <div className="flex justify-end">
                        <button 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={16} />
                          Send Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a message to view</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compose Message Modal */}
        {showCompose && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Compose Message</h3>
                  <button
                    onClick={() => setShowCompose(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To
                  </label>
                  <input
                    type="text"
                    value={composeData.recipient}
                    onChange={(e) => setComposeData({...composeData, recipient: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter recipient name or email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={composeData.subject}
                    onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter message subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Type
                  </label>
                  <select
                    value={composeData.type}
                    onChange={(e) => setComposeData({...composeData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="general">General</option>
                    <option value="review">Review</option>
                    <option value="revision">Revision</option>
                    <option value="meeting">Meeting</option>
                    <option value="status">Status</option>
                    <option value="security">Security</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={composeData.content}
                    onChange={(e) => setComposeData({...composeData, content: e.target.value})}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Type your message here..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComposeMessage}
                  disabled={!composeData.recipient.trim() || !composeData.subject.trim() || !composeData.content.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Messages;
