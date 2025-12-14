import React, { useState } from 'react';

const MessagesPage = () => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample contacts data
  const [contacts] = useState([
    {
      id: 1,
      name: 'Dr. Maria Santos',
      role: 'Research Director',
      avatar: '/api/placeholder/40/40',
      lastMessage: 'Please review the latest research proposal',
      time: '2 hours ago',
      unread: true,
      online: true
    },
    {
      id: 2,
      name: 'Prof. Juan Dela Cruz',
      role: 'Extension Coordinator',
      avatar: '/api/placeholder/40/40',
      lastMessage: 'Meeting scheduled for tomorrow at 2 PM',
      time: '1 day ago',
      unread: false,
      online: false
    },
    {
      id: 3,
      name: 'Dr. Ana Rodriguez',
      role: 'Technology Transfer Officer',
      avatar: '/api/placeholder/40/40',
      lastMessage: 'The patent application has been submitted',
      time: '3 days ago',
      unread: false,
      online: true
    },
    {
      id: 4,
      name: 'Mr. Carlos Mendoza',
      role: 'Research Assistant',
      avatar: '/api/placeholder/40/40',
      lastMessage: 'Data collection completed for Phase 1',
      time: '1 week ago',
      unread: false,
      online: false
    },
    {
      id: 5,
      name: 'Dr. Elena Fernandez',
      role: 'Development Coordinator',
      avatar: '/api/placeholder/40/40',
      lastMessage: 'Budget approval received for Q2 projects',
      time: '2 weeks ago',
      unread: false,
      online: true
    }
  ]);

  // Sample messages data
  const [messages] = useState({
    1: [
      { id: 1, sender: 'Dr. Maria Santos', message: 'Hello! How are you?', time: '10:30 AM', isOwn: false },
      { id: 2, sender: 'You', message: 'I\'m doing well, thank you!', time: '10:32 AM', isOwn: true },
      { id: 3, sender: 'Dr. Maria Santos', message: 'Please review the latest research proposal', time: '10:35 AM', isOwn: false },
      { id: 4, sender: 'You', message: 'I\'ll take a look at it right away.', time: '10:40 AM', isOwn: true }
    ],
    2: [
      { id: 1, sender: 'Prof. Juan Dela Cruz', message: 'Good morning!', time: '9:00 AM', isOwn: false },
      { id: 2, sender: 'You', message: 'Good morning! How can I help you?', time: '9:05 AM', isOwn: true },
      { id: 3, sender: 'Prof. Juan Dela Cruz', message: 'Meeting scheduled for tomorrow at 2 PM', time: '9:10 AM', isOwn: false }
    ]
  });

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageText.trim() && selectedContact) {
      // In a real app, you would send this message to the backend
      console.log('Sending message:', messageText, 'to:', selectedContact.name);
      setMessageText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
            Messages
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Communicate with your research team and colleagues
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex h-[600px]">
            {/* Contacts Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Search Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Contacts List */}
              <div className="flex-1 overflow-y-auto">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedContact?.id === contact.id ? 'bg-red-50 border-r-2 border-red-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {contact.online && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {contact.name}
                          </h3>
                          {contact.unread && (
                            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              1
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{contact.role}</p>
                        <p className="text-xs text-gray-400 truncate">{contact.lastMessage}</p>
                        <p className="text-xs text-gray-400">{contact.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedContact ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {selectedContact.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {selectedContact.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedContact.name}</h3>
                        <p className="text-sm text-gray-500">{selectedContact.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages[selectedContact.id] ? (
                      messages[selectedContact.id].map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.isOwn
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.isOwn ? 'text-red-100' : 'text-gray-500'
                            }`}>
                              {message.time}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p>No messages yet. Start a conversation!</p>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        rows="2"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a contact</h3>
                    <p className="text-gray-500">Choose a contact from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
