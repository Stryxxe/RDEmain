import React, { useState } from 'react';
import Layout from '../components/Layout';
import { MessageCircle, Send, Search, Filter } from 'lucide-react';

const Messages = () => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  const messages = [
    {
      id: 1,
      sender: 'Dr. Maria Santos',
      senderRole: 'Review Committee Chair',
      subject: 'Review Comments for Proposal PRO-2025-00029',
      preview: 'Thank you for submitting your research proposal. We have completed the initial review and have some comments...',
      time: '2 hours ago',
      unread: true,
      type: 'review'
    },
    {
      id: 2,
      sender: 'Research Office',
      senderRole: 'Administration',
      subject: 'Budget Revision Required',
      preview: 'Your proposed budget needs to be revised based on the committee feedback. Please review the attached guidelines...',
      time: '1 day ago',
      unread: true,
      type: 'revision'
    },
    {
      id: 3,
      sender: 'Dr. John Smith',
      senderRole: 'Department Head',
      subject: 'Meeting Request - Research Discussion',
      preview: 'I would like to schedule a meeting to discuss your research proposal and provide additional guidance...',
      time: '2 days ago',
      unread: false,
      type: 'meeting'
    },
    {
      id: 4,
      sender: 'Dr. Ana Rodriguez',
      senderRole: 'Research Coordinator',
      subject: 'Proposal Status Update',
      preview: 'Your proposal has been moved to the next stage of review. You will receive detailed feedback within 5 business days...',
      time: '3 days ago',
      unread: false,
      type: 'status'
    },
    {
      id: 5,
      sender: 'System Administrator',
      senderRole: 'System',
      subject: 'Account Security Alert',
      preview: 'We noticed unusual activity on your account. Please verify your recent login attempts...',
      time: '1 week ago',
      unread: false,
      type: 'security'
    }
  ];

  const sentMessages = [
    {
      id: 1,
      recipient: 'Dr. Maria Santos',
      subject: 'Re: Review Comments for Proposal PRO-2025-00029',
      preview: 'Thank you for the detailed feedback. I have addressed all the comments and will resubmit the revised proposal...',
      time: '1 hour ago',
      status: 'sent'
    },
    {
      id: 2,
      recipient: 'Research Office',
      subject: 'Budget Revision Submission',
      preview: 'I have revised the budget as requested and attached the updated proposal with detailed budget breakdown...',
      time: '2 days ago',
      status: 'sent'
    }
  ];

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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">Communicate with reviewers and administrators</p>
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
                        onClick={() => setSelectedMessage(message)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedMessage?.id === message.id ? 'bg-red-50 border-r-2 border-red-600' : ''
                        } ${message.unread ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {activeTab === 'inbox' ? message.sender : message.recipient}
                          </h4>
                          <span className="text-xs text-gray-500">{message.time}</span>
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
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
                        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
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
      </div>
    </Layout>
  );
};

export default Messages;