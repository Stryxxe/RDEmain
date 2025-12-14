import React from 'react';

const PageHeader = ({ title, subtitle, children }) => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 mt-2">{subtitle}</p>
            )}
          </div>
          {children && (
            <div className="flex items-center space-x-6">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;


