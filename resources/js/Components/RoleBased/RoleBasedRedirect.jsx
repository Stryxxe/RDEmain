import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleConfig } from '../../config/roleConfigs';
import { roleConfigs } from '../../config/roleConfigs';

const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role?.userRole;

  // Normalize role into a known config key (e.g., "Administrator" -> "Admin")
  let roleKey = null;
  if (userRole && roleConfigs[userRole]) {
    roleKey = userRole;
  } else if (userRole) {
    // Try matching against roleName/displayName
    const entry = Object.entries(roleConfigs).find(([, cfg]) => cfg.roleName === userRole || cfg.displayName === userRole);
    if (entry) {
      roleKey = entry[0];
    }
  }

  const config = roleKey ? getRoleConfig(roleKey) : null;
  
  if (!config) {
    console.warn(`No configuration found for role: ${userRole}`);
    return <Navigate to="/login" replace />;
  }

  // Get the first route from the role configuration as the default route
  const defaultRoute = config.routes.find(route => route.path === '') || 
                      config.routes[0];
  
  if (!defaultRoute) {
    console.warn(`No default route found for role: ${userRole}`);
    return <Navigate to="/login" replace />;
  }

  // Construct the full path with the normalized role prefix
  const rolePath = `/${roleKey.toLowerCase()}`;
  const fullPath = defaultRoute.path === '' ? rolePath : `${rolePath}/${defaultRoute.path}`;

  return <Navigate to={fullPath} replace />;
};

export default RoleBasedRedirect;
