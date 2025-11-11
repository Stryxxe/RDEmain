import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RoleViewFactory from './RoleViewFactory';
import InertiaRoleRouter from './InertiaRoleRouter';

const RoleBasedView = ({ role }) => {
  const { user } = useAuth();
  const userRole = role || user?.role?.userRole;

  return (
    <RoleViewFactory role={userRole}>
      <InertiaRoleRouter role={userRole} />
    </RoleViewFactory>
  );
};

export default RoleBasedView;
