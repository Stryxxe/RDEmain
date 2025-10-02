import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedHeader from '../RoleBased/RoleBasedHeader';

const RoleBasedLayout = ({ children, roleName }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="fixed inset-x-0 top-0 z-30">
        <RoleBasedHeader role={user?.role?.userRole} />
      </div>

      {/* Main Content */}
      <main className="pt-20 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default RoleBasedLayout;
