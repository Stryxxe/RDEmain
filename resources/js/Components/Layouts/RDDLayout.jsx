import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedHeader from '../RoleBased/RoleBasedHeader';
import { 
  BiSearch, 
  BiFile, 
  BiBarChart, // Still used for Statistics menu item
  BiFolder
} from 'react-icons/bi';

const RDDLayout = ({ children }) => {
  const { user, role } = useAuth();
  const { url } = usePage();

  const menuItems = [
    { path: '/rdd', label: 'R&D Initiative Status', icon: BiSearch },
    { path: '/rdd/statistics', label: 'Statistics', icon: BiBarChart },
    { path: '/rdd/review-proposal', label: 'Endorsement', icon: BiFile },
    { path: '/rdd/archive', label: 'Archive', icon: BiFolder },
    { path: '/rdd/resources', label: 'Resources', icon: BiFolder }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="fixed inset-x-0 top-0 z-30">
        <RoleBasedHeader role={role} />
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-24 bottom-0 w-64 bg-red-900 text-white z-20 overflow-y-auto">
        <nav className="flex flex-col py-4 space-y-1">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              // Special handling for root path (/rdd) - only match exact path or /rdd/
              // For other paths, match exact or paths that start with the path + /
              let isActive;
              if (item.path === '/rdd') {
                // Tracker should only be active on exact /rdd or /rdd/ paths
                isActive = url === '/rdd' || url === '/rdd/';
              } else {
                // Other menu items match exact path or paths starting with path + /
                isActive = url === item.path || url.startsWith(item.path + '/');
              }
              return (
                <Link
                  key={`${item.path}-${index}`}
                  href={item.path}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-lg transition-colors duration-300 min-h-[48px] flex-shrink-0 ${
                    isActive 
                      ? 'bg-gray-200 text-gray-900 shadow-md' 
                      : 'text-white hover:bg-red-700'
                  }`}
                  style={{ 
                    display: 'flex',
                    visibility: 'visible',
                    opacity: 1
                  }}
                >
                  <IconComponent className="text-xl w-6 h-6 flex-shrink-0" />
                  <span className="font-medium flex-1 whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 pt-24 bg-gray-50 p-5 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default RDDLayout;