import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RoleViewFactory from '../../Components/RoleBased/RoleViewFactory';
import InertiaRoleRouter from '../../Components/RoleBased/InertiaRoleRouter';

const AdminView = () => {
  const { user } = useAuth();
  const userRole = user?.role?.userRole || 'Admin';

  return (
    <RoleViewFactory role={userRole}>
      <InertiaRoleRouter role={userRole} />
    </RoleViewFactory>
  );
};

export default AdminView;
