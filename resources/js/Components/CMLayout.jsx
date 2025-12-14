import React from 'react';
import RoleBasedHeader from './RoleBased/RoleBasedHeader';
import RoleBasedNavigation from './RoleBased/RoleBasedNavigation';

const CMLayout = ({ children, roleName }) => {
  return (
    <div className="min-h-screen">
      {/* Fixed top header */}
      <div className="fixed inset-x-0 top-0 z-30">
        <RoleBasedHeader role="CM" />
      </div>

      {/* Sidebar under the header */}
      <div className="fixed left-0 top-20 bottom-0 w-64 z-20">
        <div className="h-full bg-red-900 text-white py-5 shadow-lg overflow-y-auto">
          <RoleBasedNavigation role="CM" />
        </div>
      </div>

      {/* Main content area with padding for header and sidebar */}
      <div className="pt-20 pl-64 min-h-screen">
        <main className="bg-gray-50 p-5 min-h-screen overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default CMLayout;
