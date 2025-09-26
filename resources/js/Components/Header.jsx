import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useMessages } from '../contexts/MessageContext';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import usepLogo from '../../assets/logo.png';

const Header = () => {
  const { logout } = useAuth();
  const { notifications, unreadCount, markAsRead, refreshNotifications } = useNotifications();
  const { unreadCount: messageUnreadCount } = useMessages();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    let notificationDate;
    
    try {
      // Handle different timestamp formats
      if (typeof timestamp === 'string') {
        // Try parsing as ISO string first
        notificationDate = new Date(timestamp);
        
        // If that fails, try parsing as a different format
        if (isNaN(notificationDate.getTime())) {
          // Try parsing as Unix timestamp (if it's a number string)
          const numTimestamp = parseFloat(timestamp);
          if (!isNaN(numTimestamp)) {
            notificationDate = new Date(numTimestamp * 1000); // Convert from seconds to milliseconds
          }
        }
      } else if (typeof timestamp === 'number') {
        // Handle Unix timestamp (in seconds)
        notificationDate = new Date(timestamp * 1000);
      } else if (timestamp && typeof timestamp === 'object' && timestamp.date) {
        // Handle Carbon object from Laravel
        notificationDate = new Date(timestamp.date);
      } else {
        notificationDate = new Date(timestamp);
      }
      
      // Check if the date is in the future (which would cause issues)
      if (notificationDate > now) {
        return 'Just now';
      }
      
      // Check if the date is valid
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
      if (days < 7) return `${days}d ago`;
      
      const weeks = Math.floor(days / 7);
      if (weeks < 4) return `${weeks}w ago`;
      
      const months = Math.floor(days / 30);
      if (months < 12) return `${months}mo ago`;
      
      const years = Math.floor(days / 365);
      return `${years}y ago`;
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Convert notifications to header format
  const formattedNotifications = notifications.map(notification => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    time: formatTime(notification.created_at),
    unread: !notification.read,
    type: notification.type || 'info'
  }));

  const handleViewAllMessages = () => {
    setShowNotifications(false);
    navigate('/proponent/messages');
  };

  const handleNotificationClick = async (notificationId) => {
    await markAsRead(notificationId);
    setShowNotifications(false);
    navigate('/proponent/notification');
  };

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    }

    function handleEscapeKey(e) {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const getTypeIcon = (type) => {
    const iconClass = "w-4 h-4";
    
    switch (type) {
      case 'proposal':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'reminder':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'approval':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a7 7 0 00-7 7v4.29l-1.71 1.7a1 1 0 00-.29.7V16a1 1 0 001 1h16a1 1 0 001-1v-.31a1 1 0 00-.29-.7L19 13.29V9a7 7 0 00-7-7zM10 21a2 2 0 104 0" />
            </svg>
          </div>
        );
    }
  };


  return (
    <header className="bg-red-900 text-white px-8 py-4 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-40">
      <div className="flex items-center">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
              <img
                src={usepLogo}
                alt="University of Southeastern Philippines Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
              />
            </div>
          <div>
            <h1 className="text-lg font-bold mb-1">UNIVERSITY OF SOUTHEASTERN PHILIPPINES</h1>
            <p className="text-sm opacity-90">Proponent's Portal</p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {/* Bell Icon for Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-white hover:bg-red-700 rounded-lg transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a7 7 0 00-7 7v4.29l-1.71 1.7a1 1 0 00-.29.7V16a1 1 0 001 1h16a1 1 0 001-1v-.31a1 1 0 00-.29-.7L19 13.29V9a7 7 0 00-7-7zM10 21a2 2 0 104 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <div
            className={`absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 transform transition-all duration-200 ease-out origin-top ${
              showNotifications
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{unreadCount} unread</span>
                </div>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a7 7 0 00-7 7v4.29l-1.71 1.7a1 1 0 00-.29.7V16a1 1 0 001 1h16a1 1 0 001-1v-.31a1 1 0 00-.29-.7L19 13.29V9a7 7 0 00-7-7zM10 21a2 2 0 104 0" />
                  </svg>
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id)}
                      className={`p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
                        notification.unread ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {getTypeIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {notification.title}
                                </h4>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400">
                                {notification.time}
                              </p>
                            </div>
                            <button className="ml-2 text-gray-400 hover:text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button 
                onClick={() => {
                  setShowNotifications(false);
                  navigate('/proponent/notification');
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Notifications
              </button>
            </div>
          </div>
        </div>

        {/* Message Icon */}
        <div className="relative">
          <button
            onClick={() => handleViewAllMessages('messages')}
            className="relative p-2 text-white hover:bg-red-700 rounded-lg transition-colors duration-200"
            title="Messages"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {messageUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {messageUnreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 p-2 text-white hover:bg-red-700 rounded-lg transition-colors duration-200"
            title="Profile Menu"
          >
            <User className="w-6 h-6" />
            <ChevronDown className="w-4 h-4" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  navigate('/proponent/account');
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  logout();
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
