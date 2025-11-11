import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
  BiSearch, 
  BiFile, 
  BiBarChart, 
  BiUpload,
  BiFolder, 
  BiUser
} from 'react-icons/bi';

const CMSidebar = () => {
  const { url } = usePage();
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
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-4 px-6 py-4 transition-colors duration-300 ${
                (url === item.path || url.startsWith(item.path + '/')) 
                  ? 'bg-white text-gray-900 shadow-md' 
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
  );
};

export default CMSidebar;
