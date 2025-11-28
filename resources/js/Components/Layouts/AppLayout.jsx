import React from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { MessageProvider } from '../../contexts/MessageContext';
import { AdminProvider } from '../../contexts/AdminContext';

/**
 * AppLayout - Wraps all pages with necessary context providers
 * This ensures AuthProvider and other contexts are available throughout the app
 */
const AppLayout = ({ children }) => {
    return (
        <AuthProvider>
            <NotificationProvider>
                <MessageProvider>
                    <AdminProvider>
                        {children}
                    </AdminProvider>
                </MessageProvider>
            </NotificationProvider>
        </AuthProvider>
    );
};

export default AppLayout;
