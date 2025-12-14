import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      title: 'New Research Proposal Submitted',
      message: 'A new research proposal has been submitted for review.',
      time: '2 hours ago',
      unread: true
    },
    {
      id: 2,
      title: 'Progress Report Due',
      message: 'Monthly progress report is due in 3 days.',
      time: '1 day ago',
      unread: true
    },
    {
      id: 3,
      title: 'Endorsement Approved',
      message: 'Your research endorsement has been approved.',
      time: '2 days ago',
      unread: false
    },
    {
      id: 4,
      title: 'Meeting Reminder',
      message: 'Research committee meeting scheduled for tomorrow.',
      time: '3 days ago',
      unread: false
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleViewAllNotifications = () => {
    setShowNotifications(false);
    navigate('/notifications');
  };

  const handleMessagesClick = () => {
    navigate('/messages');
  };

  return (
    <header className="bg-red-900 text-white h-20 px-8 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center">
            <img 
              src="/usep-logo.png" 
              alt="USeP Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold mb-1">UNIVERSITY OF SOUTHEASTERN PHILIPPINES</h1>
            <p className="text-sm opacity-90">Center Manager</p>
          </div>
        </div>
      </div>
      
      {/* User Controls */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {/* Messages Button */}
          <button 
            className="p-2 hover:bg-gray-700 rounded-full relative"
            onClick={handleMessagesClick}
            title="Messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              2
            </span>
          </button>

          {/* Notification Button */}
          <div className="relative">
            <button 
              className="p-2 hover:bg-gray-700 rounded-full relative"
              onClick={handleNotificationClick}
              title="Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-800 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                {/* Dropdown Header */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                    <span className="text-sm text-gray-500">{unreadCount} unread</span>
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        notification.unread ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          notification.unread ? 'bg-blue-500' : 'bg-gray-300'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View All Button */}
                <div className="px-4 py-3 border-t border-gray-200">
                  <button
                    onClick={handleViewAllNotifications}
                    className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 