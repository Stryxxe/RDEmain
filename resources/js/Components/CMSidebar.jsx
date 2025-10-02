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

const CMSidebar = () => {
  const menuItems = [
    { path: '/cm', label: 'Tracker', icon: BiSearch },
    { path: '/cm/review-proposal', label: 'Endorsement', icon: BiFile },
    { path: '/cm/progress-report', label: 'Progress Reports', icon: BiBarChart },
    { path: '/cm/submit-report', label: 'Submit Report', icon: BiUpload },
    { path: '/cm/resources', label: 'Resources', icon: BiFolder },
    { path: '/cm/account', label: 'Account', icon: BiUser }
  ];

  return (
    <div className="h-full bg-red-900 text-white py-5 shadow-lg overflow-y-auto">
      {/* Navigation Menu */}
      <nav className="flex flex-col">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-4 px-6 py-4 transition-colors duration-300 ${
                  isActive 
                    ? 'bg-white text-gray-900 shadow-md' 
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

export default CMSidebar;
