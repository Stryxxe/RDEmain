import React, { useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useAuth } from '../../contexts/AuthContext';
import RoleViewFactory from '../../Components/RoleBased/RoleViewFactory';
import InertiaRoleRouter from '../../Components/RoleBased/InertiaRoleRouter';

const AdminView = () => {
  const { user } = useAuth();
  const { props } = usePage();
  
  // Get user from Inertia props (more reliable than context on initial load)
  const currentUser = user || props?.auth?.user;
  const userRole = currentUser?.role?.userRole || 'Admin';

  // Validate authentication and role
  useEffect(() => {
    // Prevent redirect loop - check if we're already on login page
    if (window.location.pathname === '/login' || window.location.pathname === '/') {
      return;
    }

    // Wait a bit for user to be available (in case of initial page load)
    const checkAuth = setTimeout(() => {
      if (!currentUser) {
        router.visit('/login');
        return;
      }
      
      // Check if user is an Admin or Administrator
      const isAdmin = currentUser.role?.userRole === 'Admin' || 
                     currentUser.role?.userRole === 'Administrator';
      
      if (!isAdmin) {
        router.visit('/dashboard');
        return;
      }
    }, 100);

    return () => clearTimeout(checkAuth);
  }, [currentUser]);

  // Show loading if user is not yet available
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleViewFactory role={userRole}>
      <InertiaRoleRouter role={userRole} />
    </RoleViewFactory>
  );
};

export default AdminView;
