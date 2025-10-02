import React, { Suspense, lazy } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedLayout from '../Layouts/RoleBasedLayout';
import LoadingSpinner from '../UI/LoadingSpinner';
import { getRoleConfig } from '../../config/roleConfigs';

// Lazy load components
const lazyComponents = {
  // Admin components
  AdminDashboard: lazy(() => import('../../Pages/RoleViews/Dashboards/AdminDashboard')),
  
  // RDD components
  RDDDashboard: lazy(() => import('../../Pages/RoleViews/Dashboards/RDDDashboard')),
  
  // CM components
  CMDashboard: lazy(() => import('../../Pages/RoleViews/CM/CMDashboard')),
  CMReviewProposal: lazy(() => import('../../Pages/RoleViews/CM/CMReviewProposal')),
  CMProgressReport: lazy(() => import('../../Pages/RoleViews/CM/CMProgressReport')),
  CMSubmitReport: lazy(() => import('../../Pages/RoleViews/CM/CMSubmitReport')),
  CMResources: lazy(() => import('../../Pages/RoleViews/CM/CMResources')),
  CMAccount: lazy(() => import('../../Pages/RoleViews/CM/CMAccount')),
  CMProposalDetail: lazy(() => import('../../Pages/RoleViews/CM/CMProposalDetail')),
  CMNotifications: lazy(() => import('../../Pages/RoleViews/CM/CMNotifications')),
  CMMessages: lazy(() => import('../../Pages/RoleViews/CM/CMMessages')),
  // CM uses shared components for Tracker and Projects
  Tracker: lazy(() => import('../../Pages/Tracker')),
  Projects: lazy(() => import('../../Pages/Projects')),
  
  // Proponent components
  SubmitPage: lazy(() => import('../../Pages/SubmitPage')),
  Tracker: lazy(() => import('../../Pages/Tracker')),
  TrackerDetail: lazy(() => import('../../Pages/TrackerDetail')),
  Projects: lazy(() => import('../../Pages/Projects')),
  ProposalDetail: lazy(() => import('../../Pages/ProposalDetail')),
  ResourcesPage: lazy(() => import('../../Pages/Resources')),
  AccountPage: lazy(() => import('../../Pages/Account')),
  NotificationsPage: lazy(() => import('../../Pages/Notification')),
  MessagesPage: lazy(() => import('../../Pages/Messages')),
  
  // OP components
  OPDashboard: lazy(() => import('../../Pages/RoleViews/Dashboards/OPDashboard')),
  
  // OSUORU components
  OSUORUDashboard: lazy(() => import('../../Pages/RoleViews/Dashboards/OSUORUDashboard')),
  
  // Reviewer components
  ReviewerDashboard: lazy(() => import('../../Pages/RoleViews/Dashboards/ReviewerDashboard'))
};

// Layout components
const layoutComponents = {
  RoleBasedLayout: RoleBasedLayout,
  CMLayout: lazy(() => import('../CMLayout')),
  ProponentLayout: lazy(() => import('../ProponentLayout'))
};

const RoleViewFactory = ({ role, children }) => {
  const { user } = useAuth();
  const userRole = role || user?.role?.userRole;
  
  if (!userRole) {
    return <div>Invalid role or role not found</div>;
  }

  const config = getRoleConfig(userRole);
  if (!config) {
    return <div>Role configuration not found</div>;
  }

  const LayoutComponent = layoutComponents[config.layout];

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LayoutComponent roleName={config.roleName}>
        {children}
      </LayoutComponent>
    </Suspense>
  );
};

export const getRoleComponent = (componentName) => lazyComponents[componentName] || null;

export default RoleViewFactory;
