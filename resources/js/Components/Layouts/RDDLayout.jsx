import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedHeader from '../RoleBased/RoleBasedHeader';
import { 
  BiSearch, 
  BiFile, 
  BiBarChart, 
  BiUpload,
  BiFolder
} from 'react-icons/bi';

const RDDLayout = ({ children }) => {
  const { user } = useAuth();
  const { url } = usePage();

  const menuItems = [
    { path: '/rdd', label: 'R&D Initiative Status', icon: BiSearch },
    { path: '/rdd/statistics', label: 'Statistics', icon: BiBarChart },
    { path: '/rdd/review-proposal', label: 'Endorsement', icon: BiFile },
    { path: '/rdd/progress-report', label: 'Progress Reports', icon: BiBarChart },
    { path: '/rdd/submit-report', label: 'Submit Report', icon: BiUpload },
    { path: '/rdd/resources', label: 'Resources', icon: BiFolder }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="fixed inset-x-0 top-0 z-30">
        <RoleBasedHeader role={user?.role?.userRole} />
      </div>

      <div className="flex pt-20">
        {/* Sidebar */}
        <div className="bg-red-900 text-white w-64 flex-shrink-0 flex flex-col h-screen sticky top-20">
          <nav className="flex flex-col h-full mt-5">
            {menuItems.map((item) => {
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
                  key={item.path}
                  href={item.path}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-lg transition-colors duration-300 ${
                    isActive 
                      ? 'bg-gray-200 text-gray-900 shadow-md' 
                      : 'text-white hover:bg-red-700'
                  }`}
                >
                  <IconComponent className="text-xl w-6 h-6" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 p-5 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default RDDLayout;