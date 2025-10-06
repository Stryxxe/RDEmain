import React from 'react';
import { NavLink } from 'react-router-dom';
import { getRoleConfig } from '../../config/roleConfigs';
import { 
  Search, 
  FileText, 
  BarChart3, 
  Upload, 
  Folder,
  Home,
  Bell,
  MessageCircle,
  FileCheck
} from 'lucide-react';

const RoleBasedNavigation = ({ role, className = '' }) => {
  const config = getRoleConfig(role);
  
  if (!config || !config.routes) {
    return null;
  }

  // Function to get the appropriate icon for each route
  const getRouteIcon = (label) => {
    switch (label) {
      case 'Dashboard':
        return <Home className="w-6 h-6" />;
      case 'Submit Proposal':
        return <Upload className="w-6 h-6" />;
      case 'Tracker':
        return <Search className="w-6 h-6" />;
      case 'Projects':
        return <FileCheck className="w-6 h-6" />;
      case 'Endorsement':
        return <FileText className="w-6 h-6" />;
      case 'Progress Reports':
        return <BarChart3 className="w-6 h-6" />;
      case 'Submit Report':
        return <Upload className="w-6 h-6" />;
      case 'Resources':
        return <Folder className="w-6 h-6" />;
      case 'Notifications':
        return <Bell className="w-6 h-6" />;
      case 'Messages':
        return <MessageCircle className="w-6 h-6" />;
      default:
        return null;
    }
  };

  // Filter out routes that don't have labels, parameterized routes, hidden routes, and exclude Account from sidebar
  const navigationRoutes = config.routes.filter(route => 
    route.label && 
    route.label !== 'Account' && 
    !route.path.includes(':') && // Exclude parameterized routes like 'proposal/:id'
    !route.hidden // Exclude hidden routes
  );

  return (
    <nav className={`flex flex-col ${className}`}>
      {navigationRoutes.map((route) => {
        // Construct the full path with role prefix
        const rolePath = `/${role.toLowerCase()}`;
        const fullPath = route.path === '' ? rolePath : `${rolePath}/${route.path}`;
        
        return (
          <NavLink
            key={route.path}
            to={fullPath}
            end={route.path === ''} // Use exact matching for root path
            className={({ isActive }) => 
              `flex items-center gap-4 px-6 py-4 transition-colors duration-300 ${
                isActive 
                  ? 'bg-white text-gray-900 shadow-md' 
                  : 'text-white hover:bg-red-700'
              }`
            }
          >
            {getRouteIcon(route.label)}
            <span className="font-medium">{route.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default RoleBasedNavigation;
