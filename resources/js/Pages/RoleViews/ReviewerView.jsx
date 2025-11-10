import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RoleViewFactory from '../../Components/RoleBased/RoleViewFactory';
import InertiaRoleRouter from '../../Components/RoleBased/InertiaRoleRouter';

const ReviewerView = () => {
  const { user } = useAuth();
  const userRole = user?.role?.userRole || 'Reviewer';

  return (
    <RoleViewFactory role={userRole}>
      <InertiaRoleRouter role={userRole} />
    </RoleViewFactory>
  );
};

export default ReviewerView;
