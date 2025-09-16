import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationToast from './NotificationToast';

const NotificationContainer = () => {
  const { user } = useAuth();
  const { getToastNotifications, dismissToast, markAsRead } = useNotifications();
  
  // Only show notifications if user is authenticated
  if (!user) {
    return null;
  }
  
  const toastNotifications = getToastNotifications();

  if (toastNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full space-y-2">
      {toastNotifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={dismissToast}
          onMarkAsRead={markAsRead}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
