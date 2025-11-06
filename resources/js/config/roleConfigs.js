// Role-specific configurations
export const roleConfigs = {
  Admin: {
    layout: 'RoleBasedLayout',
    roleName: 'Administrator',
    displayName: 'Administrator',
    color: 'blue',
    routes: [
      { path: '', component: 'AdminDashboard', label: 'Dashboard' },
      { path: 'user-management', component: 'AdminUserManagement', label: 'User Management' },
      { path: 'system-settings', component: 'AdminSystemSettings', label: 'System Settings' },
      { path: 'reports', component: 'AdminReports', label: 'Reports' },
      { path: 'profile', component: 'AdminProfile', label: 'Profile' },
      { path: 'notifications', component: 'NotificationsPage', label: 'Notifications', hidden: true },
      { path: 'messages', component: 'MessagesPage', label: 'Messages', hidden: true }
    ],
    permissions: [
      'user_management',
      'system_settings',
      'view_reports',
      'manage_roles',
      'view_notifications',
      'send_messages'
    ]
  },
  RDD: {
    layout: 'RDDLayout',
    roleName: 'Research & Development Division',
    displayName: 'RDD',
    color: 'green',
    routes: [
      { path: '', component: 'RDDDashboard', label: 'Tracker' },
      { path: 'statistics', component: 'RDDStatistics', label: 'Statistics' },
      { path: 'review-proposal', component: 'RDDReviewProposal', label: 'Endorsement' },
      { path: 'progress-report', component: 'RDDProgressReport', label: 'Progress Reports' },
      { path: 'submit-report', component: 'RDDSubmitReport', label: 'Submit Report' },
      { path: 'resources', component: 'RDDResources', label: 'Resources' },
      { path: 'account', component: 'RDDAccount', label: 'Account' },
      { path: 'proposal/:id', component: 'RDDProposalDetail', label: 'Proposal Detail' },
      { path: 'notifications', component: 'NotificationsPage', label: 'Notifications', hidden: true },
      { path: 'messages', component: 'MessagesPage', label: 'Messages', hidden: true }
    ],
    permissions: [
      'review_proposals',
      'approve_proposals',
      'manage_projects',
      'view_analytics',
      'view_notifications',
      'send_messages'
    ]
  },
  CM: {
    layout: 'CMLayout',
    roleName: 'Center Manager',
    displayName: 'Center Manager',
    color: 'red',
    routes: [
      { path: '', component: 'CMDashboard', label: 'Dashboard' },
      { path: 'proposal/:id', component: 'CMProposalDetail', label: 'Proposal Detail' },
      { path: 'review-proposal', component: 'CMReviewProposal', label: 'Endorsement' },
      { path: 'progress-report', component: 'CMProgressReport', label: 'Progress Reports' },
      { path: 'submit-report', component: 'CMSubmitReport', label: 'Submit Report' },
      { path: 'resources', component: 'CMResources', label: 'Resources' },
      { path: 'account', component: 'CMAccount', label: 'Account' },
      { path: 'notifications', component: 'CMNotifications', label: 'Notifications', hidden: true },
      { path: 'messages', component: 'CMMessages', label: 'Messages', hidden: true }
    ],
    permissions: [
      'view_own_proposals',
      'view_department_proposals',
      'track_progress',
      'review_proposals',
      'manage_center',
      'view_reports',
      'manage_resources',
      'view_notifications',
      'send_messages'
    ]
  },
  Proponent: {
    layout: 'ProponentLayout',
    roleName: 'Proponent',
    displayName: 'Proponent',
    color: 'purple',
    routes: [
      { path: '', component: 'SubmitPage', label: 'Submit Proposal' },
      { path: 'submit', component: 'SubmitPage', label: 'Submit Proposal' },
      { path: 'tracker', component: 'Tracker', label: 'Tracker' },
      { path: 'tracker/:id', component: 'TrackerDetail', label: 'Tracker Detail' },
      { path: 'projects', component: 'Projects', label: 'Projects' },
      { path: 'resources', component: 'ResourcesPage', label: 'Resources' },
      { path: 'account', component: 'AccountPage', label: 'Account' },
      { path: 'notification', component: 'NotificationsPage', label: 'Notifications', hidden: true },
      { path: 'messages', component: 'MessagesPage', label: 'Messages', hidden: true }
    ],
    permissions: [
      'submit_proposals',
      'view_own_proposals',
      'track_progress',
      'view_resources',
      'view_notifications',
      'send_messages'
    ]
  },
  OP: {
    layout: 'RoleBasedLayout',
    roleName: 'Office of the President',
    displayName: 'Office of the President',
    color: 'indigo',
    routes: [
      { path: '', component: 'OPDashboard', label: 'Dashboard' },
      { path: 'notifications', component: 'NotificationsPage', label: 'Notifications', hidden: true },
      { path: 'messages', component: 'MessagesPage', label: 'Messages', hidden: true }
    ],
    permissions: [
      'executive_review',
      'strategic_planning',
      'policy_decisions',
      'view_executive_reports',
      'view_notifications',
      'send_messages'
    ]
  },
  OSUORU: {
    layout: 'RoleBasedLayout',
    roleName: 'Office of Student Affairs and University Relations Unit',
    displayName: 'OSUORU',
    color: 'teal',
    routes: [
      { path: '', component: 'OSUORUDashboard', label: 'Dashboard' },
      { path: 'notifications', component: 'NotificationsPage', label: 'Notifications', hidden: true },
      { path: 'messages', component: 'MessagesPage', label: 'Messages', hidden: true }
    ],
    permissions: [
      'manage_student_research',
      'handle_university_relations',
      'oversee_student_affairs',
      'view_student_analytics',
      'view_notifications',
      'send_messages'
    ]
  },
  Reviewer: {
    layout: 'RoleBasedLayout',
    roleName: 'Reviewer',
    displayName: 'Reviewer',
    color: 'orange',
    routes: [
      { path: '', component: 'ReviewerDashboard', label: 'Dashboard' },
      { path: 'notifications', component: 'NotificationsPage', label: 'Notifications', hidden: true },
      { path: 'messages', component: 'MessagesPage', label: 'Messages', hidden: true }
    ],
    permissions: [
      'review_assigned_proposals',
      'view_review_history',
      'access_review_guidelines',
      'submit_reviews',
      'view_notifications',
      'send_messages'
    ]
  }
};

// Helper functions
export const getRoleConfig = (role) => roleConfigs[role] || null;
export const getRolePermissions = (role) => roleConfigs[role]?.permissions || [];
export const getRoleRoutes = (role) => roleConfigs[role]?.routes || [];
export const hasPermission = (role, permission) => {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
};

export default roleConfigs;
