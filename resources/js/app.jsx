import '../css/app.css';
import './bootstrap';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MessageProvider } from './contexts/MessageContext';
import { AdminProvider } from './contexts/AdminContext';

// Debug: Check if session cookie exists
if (typeof window !== 'undefined' && !import.meta.env.PROD) {
    console.log('=== Session Cookie Debug ===');
    console.log('Current URL:', window.location.href);
    console.log('document.cookie:', document.cookie);
    console.log('Axios withCredentials:', window.axios?.defaults?.withCredentials);
    console.log('Axios baseURL:', window.axios?.defaults?.baseURL);
    
    // Check if cookies exist (they might be HttpOnly, so document.cookie might be empty)
    // But we can still check if axios is configured correctly
    if (window.axios) {
        console.log('✅ Axios is configured');
        if (window.axios.defaults.withCredentials) {
            console.log('✅ withCredentials is set to true');
        } else {
            console.error('❌ withCredentials is NOT set to true!');
        }
    } else {
        console.error('❌ window.axios is not available!');
    }
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        
        // Get user from Inertia props - safely access nested properties
        let user = null;
        try {
            if (props && props.initialPage && props.initialPage.props && props.initialPage.props.auth) {
                user = props.initialPage.props.auth.user || null;
            }
        } catch (error) {
            console.warn('Error accessing user from Inertia props:', error);
        }

        root.render(
            <AuthProvider user={user}>
                <NotificationProvider>
                    <MessageProvider>
                        <AdminProvider>
                            <App {...props} />
                        </AdminProvider>
                    </MessageProvider>
                </NotificationProvider>
            </AuthProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
