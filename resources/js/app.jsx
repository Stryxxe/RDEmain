import '../css/app.css';
import './bootstrap';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './Components/auth/login';

// Role-based view components
import AdminView from './Pages/RoleViews/AdminView';
import RDDView from './Pages/RoleViews/RDDView';
import CMView from './Pages/RoleViews/CMView';
import ProponentView from './Pages/RoleViews/ProponentView';
import OPView from './Pages/RoleViews/OPView';
import OSUURUView from './Pages/RoleViews/OSUURUView';
import ReviewerView from './Pages/RoleViews/ReviewerView';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role?.userRole;
  
  switch (role) {
    case 'Admin':
      return <Navigate to="/admin" replace />;
    case 'RDD':
      return <Navigate to="/rdd" replace />;
    case 'CM':
      return <Navigate to="/cm" replace />;
    case 'Proponent':
      return <Navigate to="/proponent" replace />;
    case 'OP':
      return <Navigate to="/op" replace />;
    case 'OSUURU':
      return <Navigate to="/osuur" replace />;
    case 'Reviewer':
      return <Navigate to="/reviewer" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleBasedRedirect />} />
          
          {/* Role-based routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rdd" 
            element={
              <ProtectedRoute>
                <RDDView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cm" 
            element={
              <ProtectedRoute>
                <CMView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/proponent/*" 
            element={
              <ProtectedRoute>
                <ProponentView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/op" 
            element={
              <ProtectedRoute>
                <OPView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/osuur" 
            element={
              <ProtectedRoute>
                <OSUURUView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reviewer" 
            element={
              <ProtectedRoute>
                <ReviewerView />
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
    </AuthProvider>
  );
};

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />);
