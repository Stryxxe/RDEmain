import '../css/app.css';
import './bootstrap';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MessageProvider } from './contexts/MessageContext';
import NotificationContainer from './Components/NotificationContainer';
import Login from './Components/auth/login';

// Modular role-based view system
import RoleBasedView from './Components/RoleBased/RoleBasedView';
import RoleBasedRedirect from './Components/RoleBased/RoleBasedRedirect';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Role-based redirect component is now imported from RoleBasedRedirect.jsx

// App content component with notifications and messages
const AppContent = () => {
  return (
    <Router>
      <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleBasedRedirect />} />
          
          {/* Modular role-based routes */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute>
                <NotificationContainer />
                <RoleBasedView role="Admin" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rdd/*" 
            element={
              <ProtectedRoute>
                <NotificationContainer />
                <RoleBasedView role="RDD" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cm/*" 
            element={
              <ProtectedRoute>
                <NotificationContainer />
                <RoleBasedView role="CM" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/proponent/*" 
            element={
              <ProtectedRoute>
                <NotificationContainer />
                <RoleBasedView role="Proponent" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/op/*" 
            element={
              <ProtectedRoute>
                <NotificationContainer />
                <RoleBasedView role="OP" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/osuur/*" 
            element={
              <ProtectedRoute>
                <NotificationContainer />
                <RoleBasedView role="OSUORU" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reviewer/*" 
            element={
              <ProtectedRoute>
                <NotificationContainer />
                <RoleBasedView role="Reviewer" />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback routes for direct URL access - redirect to proponent routes */}
          <Route path="/projects" element={<Navigate to="/proponent/projects" replace />} />
          <Route path="/projects/:id" element={<Navigate to="/proponent/projects" replace />} />
          <Route path="/resources" element={<Navigate to="/proponent/resources" replace />} />
          <Route path="/account" element={<Navigate to="/proponent/account" replace />} />
          <Route path="/submit" element={<Navigate to="/proponent/submit" replace />} />
          <Route path="/tracker" element={<Navigate to="/proponent/tracker" replace />} />
          <Route path="/notification" element={<Navigate to="/proponent/notification" replace />} />
          <Route path="/messages" element={<Navigate to="/proponent/messages" replace />} />
        </Routes>
      </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MessageProvider>
          <AppContent />
        </MessageProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />);
