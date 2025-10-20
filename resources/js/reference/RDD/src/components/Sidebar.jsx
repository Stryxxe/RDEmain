import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BiSearch, 
  BiFile, 
  BiBarChart, 
  BiUpload,
  BiFolder, 
  BiUser 
} from 'react-icons/bi';

const Sidebar = () => {
  const menuItems = [
    { path: '/', label: 'Tracker', icon: BiSearch },
    { path: '/statistics', label: 'Statistics', icon: BiBarChart },
    { path: '/review-proposal', label: 'Endorsement', icon: BiFile },
    { path: '/progress-report', label: 'Progress Reports', icon: BiBarChart },
    { path: '/submit-report', label: 'Submit Report', icon: BiUpload },
    { path: '/resources', label: 'Resources', icon: BiFolder },
    { path: '/account', label: 'Account', icon: BiUser }
  ];

  return (
    <div className="bg-red-900 text-white w-64 flex-shrink-0 flex flex-col h-full">
      {/* Navigation Menu */}
      <nav className="flex flex-col h-full mt-5">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `w-full flex items-center gap-4 px-6 py-4 rounded-lg transition-colors duration-300 ${
                  isActive 
                    ? 'bg-gray-200 text-gray-900 shadow-md' 
                    : 'text-white hover:bg-red-700'
                }`
              }
            >
              <IconComponent className="text-xl w-6 h-6" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar; 