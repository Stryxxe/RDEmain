import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RoleViewFactory from './RoleViewFactory';
import RoleBasedRouter from './RoleBasedRouter';

const RoleBasedView = ({ role }) => {
  const { user } = useAuth();
  const userRole = role || user?.role?.userRole;

  return (
    <RoleViewFactory role={userRole}>
      <RoleBasedRouter role={userRole} />
    </RoleViewFactory>
  );
};

export default RoleBasedView;
