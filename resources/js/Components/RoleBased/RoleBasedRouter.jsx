import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleConfig } from '../../config/roleConfigs';
import { getRoleComponent } from './RoleViewFactory';
import LoadingSpinner from '../UI/LoadingSpinner';

const RoleBasedRouter = ({ role }) => {
  const { user } = useAuth();
  const userRole = role || user?.role?.userRole;
  
  if (!userRole) {
    return <div>Loading...</div>;
  }

  const config = getRoleConfig(userRole);
  if (!config) {
    return <div>Invalid role configuration</div>;
  }

  return (
    <Suspense fallback={<LoadingSpinner className="min-h-screen" />}>
      <Routes>
        {config.routes.map((route) => {
          const Component = getRoleComponent(route.component);
          if (!Component) {
            console.warn(`Component ${route.component} not found for role ${userRole}`);
            return null;
          }

          return (
            <Route
              key={route.path}
              path={route.path}
              element={<Component />}
            />
          );
        })}
        {/* Catch-all route for unmatched paths */}
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </Suspense>
  );
};

export default RoleBasedRouter;
