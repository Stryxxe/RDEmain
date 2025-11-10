import React, { Suspense, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleConfig } from '../../config/roleConfigs';
import { getRoleComponent } from './RoleViewFactory';
import LoadingSpinner from '../UI/LoadingSpinner';

const InertiaRoleRouter = ({ role }) => {
  const { user } = useAuth();
  const { url } = usePage();
  const userRole = role || user?.role?.userRole;
  
  if (!userRole) {
    return <div>Loading...</div>;
  }

  const config = getRoleConfig(userRole);
  if (!config) {
    return <div>Invalid role configuration</div>;
  }

  // Extract the sub-path from the current URL
  // Map role names to URL prefixes
  const rolePrefixMap = {
    'Administrator': '/admin',
    'Admin': '/admin',
    'RDD': '/rdd',
    'CM': '/cm',
    'Proponent': '/proponent',
    'OP': '/op',
    'OSUORU': '/osuur',
    'Reviewer': '/reviewer',
  };
  
  const rolePrefix = rolePrefixMap[userRole] || `/${userRole.toLowerCase()}`;
  let currentPath = url;
  
  // Remove role prefix from URL
  if (currentPath.startsWith(rolePrefix)) {
    currentPath = currentPath.replace(rolePrefix, '').replace(/^\//, '') || '';
  } else {
    // Fallback: try to extract path after first slash
    const parts = currentPath.split('/').filter(p => p);
    if (parts.length > 1) {
      currentPath = parts.slice(1).join('/');
    } else {
      currentPath = '';
    }
  }
  
  // Find matching route
  let matchedRoute = null;
  let routeParams = {};
  
  // First, try exact match
  matchedRoute = config.routes.find(route => {
    if (route.path === currentPath) return true;
    if (route.path === '' && currentPath === '') return true;
    return false;
  });
  
  // If no exact match, try parameterized routes
  if (!matchedRoute) {
    matchedRoute = config.routes.find(route => {
      if (!route.path.includes(':')) return false;
      
      // Convert route path to regex pattern
      const pattern = route.path.replace(/:[^/]+/g, '([^/]+)');
      const regex = new RegExp(`^${pattern}$`);
      const match = currentPath.match(regex);
      
      if (match) {
        // Extract parameter names and values
        const paramNames = route.path.match(/:([^/]+)/g)?.map(p => p.slice(1)) || [];
        paramNames.forEach((name, index) => {
          routeParams[name] = match[index + 1];
        });
        return true;
      }
      return false;
    });
  }
  
  // Default to first route if no match
  if (!matchedRoute) {
    matchedRoute = config.routes.find(route => route.path === '') || config.routes[0];
  }

  const Component = matchedRoute ? getRoleComponent(matchedRoute.component) : null;

  if (!Component) {
    console.warn(`Component ${matchedRoute?.component} not found for role ${userRole}`);
    return <div>Component not found</div>;
  }

  // Pass route params as props to the component
  // Components can access params via props (e.g., props.id)
  return (
    <Suspense fallback={<LoadingSpinner className="min-h-screen" />}>
      <Component {...routeParams} />
    </Suspense>
  );
};

// Export a hook to get route params in components
export const useRouteParams = () => {
  const { url } = usePage();
  
  // Extract ID from common patterns
  const params = {};
  const idMatch = url.match(/\/(tracker|proposal|projects)\/([^/]+)/);
  if (idMatch) {
    params.id = idMatch[2];
  }
  
  // Extract from URL path segments
  const parts = url.split('/').filter(p => p);
  if (parts.length >= 3) {
    // Assume format: /role/route/:param
    const paramValue = parts[parts.length - 1];
    if (paramValue && !isNaN(paramValue)) {
      params.id = paramValue;
    }
  }
  
  return params;
};

export default InertiaRoleRouter;

