import React, { useState } from 'react';

const NotificationsPage = () => {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New Research Proposal Submitted',
      message: 'A new research proposal has been submitted for review. Please review the proposal and provide feedback within 5 business days.',
      time: '2 hours ago',
      unread: true,
      type: 'proposal'
    },
    {
      id: 2,
      title: 'Progress Report Due',
      message: 'Monthly progress report is due in 3 days. Please ensure all required documentation is submitted on time.',
      time: '1 day ago',
      unread: true,
      type: 'reminder'
    },
    {
      id: 3,
      title: 'Endorsement Approved',
      message: 'Your research endorsement has been approved by the committee. You can now proceed with the next phase of your research.',
      time: '2 days ago',
      unread: false,
      type: 'approval'
    },
    {
      id: 4,
      title: 'Meeting Reminder',
      message: 'Research committee meeting scheduled for tomorrow at 2:00 PM. Please prepare your presentation materials.',
      time: '3 days ago',
      unread: false,
      type: 'meeting'
    },
    {
      id: 5,
      title: 'Document Review Required',
      message: 'New research documents have been uploaded and require your review. Please check the documents section.',
      time: '4 days ago',
      unread: false,
      type: 'document'
    },
    {
      id: 6,
      title: 'Budget Allocation Approved',
      message: 'Your research budget allocation has been approved. Funds will be disbursed within 7 business days.',
      time: '5 days ago',
      unread: false,
      type: 'budget'
    },
    {
      id: 7,
      title: 'Research Extension Request',
      message: 'A request for research extension has been submitted. Please review and provide your decision.',
      time: '1 week ago',
      unread: false,
      type: 'request'
    },
    {
      id: 8,
      title: 'Publication Opportunity',
      message: 'New publication opportunity available for your research area. Deadline for submission is in 2 weeks.',
      time: '1 week ago',
      unread: false,
      type: 'opportunity'
    }
  ]);

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, unread: false } : notif
      )
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, unread: false }))
    );
  };

  const getTypeIcon = (type) => {
    const iconClass = "w-5 h-5";
    
    switch (type) {
      case 'proposal':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className={`${iconClass} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'reminder':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className={`${iconClass} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'approval':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className={`${iconClass} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'meeting':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className={`${iconClass} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'document':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className={`${iconClass} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'budget':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className={`${iconClass} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'request':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className={`${iconClass} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m0 0V9a2 2 0 01-2 2H10a2 2 0 01-2-2V7m6 0H8" />
            </svg>
          </div>
        );
      case 'opportunity':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className={`${iconClass} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className={`${iconClass} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.19 4a2 2 0 00-1.8 1.1L1 8.5v8a2 2 0 002 2h14a2 2 0 002-2v-8l-1.39-3.4A2 2 0 0015.81 4H4.19z" />
            </svg>
          </div>
        );
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'proposal': return 'Proposal';
      case 'reminder': return 'Reminder';
      case 'approval': return 'Approval';
      case 'meeting': return 'Meeting';
      case 'document': return 'Document';
      case 'budget': return 'Budget';
      case 'request': return 'Request';
      case 'opportunity': return 'Opportunity';
      default: return 'General';
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'proposal': return 'bg-red-100 text-red-800 border-red-200';
      case 'reminder': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'approval': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'meeting': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'document': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'budget': return 'bg-green-100 text-green-800 border-green-200';
      case 'request': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'opportunity': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return notification.unread;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(n => n.unread).length;

  const filterOptions = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'proposal', label: 'Proposals' },
    { key: 'reminder', label: 'Reminders' },
    { key: 'approval', label: 'Approvals' },
    { key: 'meeting', label: 'Meetings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Notifications
              </h1>
              <p className="text-gray-600">Stay updated with all your important alerts and messages</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
                              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-amber-600">{unreadCount}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Read</p>
                <p className="text-2xl font-bold text-emerald-600">{notifications.length - unreadCount}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Filter by:</span>
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filter === option.key
                    ? 'bg-red-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                {option.label} {option.count !== undefined && `(${option.count})`}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.19 4a2 2 0 00-1.8 1.1L1 8.5v8a2 2 0 002 2h14a2 2 0 002-2v-8l-1.39-3.4A2 2 0 0015.81 4H4.19z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">There are no notifications matching your current filter.</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group ${
                  notification.unread 
                    ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-white' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {notification.title}
                          </h3>
                          {notification.unread && (
                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                              New
                            </span>
                          )}
                          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getTypeBadgeColor(notification.type)}`}>
                            {getTypeLabel(notification.type)}
                          </span>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {notification.unread && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400 font-medium">
                          {notification.time}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Click to view details</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage; 