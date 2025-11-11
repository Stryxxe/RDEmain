import React, { Suspense, lazy } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedLayout from '../Layouts/RoleBasedLayout';
import LoadingSpinner from '../UI/LoadingSpinner';
import { getRoleConfig } from '../../config/roleConfigs';

// Lazy load components
const lazyComponents = {
  // Admin components
  AdminDashboard: lazy(() => import('../../Pages/RoleViews/Dashboards/AdminDashboard')),
  AdminProfile: lazy(() => import('../../Pages/RoleViews/Admin/Profile')),
  AdminReports: lazy(() => import('../../Pages/RoleViews/Admin/Reports')),
  AdminSystemSettings: lazy(() => import('../../Pages/RoleViews/Admin/SystemSettings')),
  AdminUserManagement: lazy(() => import('../../Pages/RoleViews/Admin/UserManagement')),
  
  // RDD components
  RDDDashboard: lazy(() => import('../../Pages/RoleViews/RDD/RDDDashboard')),
  RDDStatistics: lazy(() => import('../../Pages/RoleViews/RDD/RDDStatistics')),
  RDDEndorsement: lazy(() => import('../../Pages/RoleViews/RDD/RDDEndorsement')),
  RDDProgressReport: lazy(() => import('../../Pages/RoleViews/RDD/RDDProgressReport')),
  RDDProgressReportDetail: lazy(() => import('../../Pages/RoleViews/RDD/RDDProgressReportDetail')),
  RDDSubmitReport: lazy(() => import('../../Pages/RoleViews/RDD/RDDSubmitReport')),
  RDDResources: lazy(() => import('../../Pages/RoleViews/RDD/RDDResources')),
  RDDAccount: lazy(() => import('../../Pages/RoleViews/RDD/RDDAccount')),
  RDDProposalDetail: lazy(() => import('../../Pages/RoleViews/RDD/RDDProposalDetail')),
  
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
  RDDLayout: lazy(() => import('../Layouts/RDDLayout')),
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
