import React from 'react';
import { useAdmin } from '../../../contexts/AdminContext';
import { FiUsers, FiUserCheck, FiUserX, FiClock, FiFileText, FiSettings } from 'react-icons/fi';

const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  return (
    <div className="admin-card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]} text-white`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {typeof change === 'number' && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const RecentActivity = ({ activities }) => (
  <div className="admin-card">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className={`w-2 h-2 rounded-full mt-2 ${
              activity.type === 'user' ? 'bg-blue-500' : activity.type === 'system' ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">{activity.description}</p>
            <p className="text-xs text-gray-500">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const UserRoleChart = ({ users }) => {
  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const roles = [
    { name: 'Admin', count: roleCounts.admin || 0, color: 'bg-red-500' },
    { name: 'Proponent', count: roleCounts.proponent || 0, color: 'bg-green-500' },
    { name: 'Central Manager', count: roleCounts.central_manager || 0, color: 'bg-blue-500' },
    { name: 'RDD', count: roleCounts.rdd || 0, color: 'bg-yellow-500' },
    { name: 'RDE', count: roleCounts.rde || 0, color: 'bg-purple-500' },
    { name: 'OP', count: roleCounts.op || 0, color: 'bg-orange-500' },
    { name: 'OSUORO', count: roleCounts.osuoro || 0, color: 'bg-indigo-500' }
  ];

  const total = roles.reduce((sum, role) => sum + role.count, 0);

  return (
    <div className="admin-card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Users by Role</h3>
      <div className="space-y-3">
        {roles.map((role) => (
          <div key={role.name} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${role.color}`} />
              <span className="text-sm text-gray-700">{role.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">{role.count}</span>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${role.color}`} style={{ width: `${total > 0 ? (role.count / total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { users, loading } = useAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const pendingUsers = users.filter((u) => u.status === 'pending').length;
  const inactiveUsers = users.filter((u) => u.status === 'inactive').length;

  const pct = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);
  const activePct = pct(activeUsers, totalUsers);
  const pendingPct = pct(pendingUsers, totalUsers);
  const inactivePct = pct(inactiveUsers, totalUsers);

  const recentActivities = [
    { type: 'user', description: 'New user registered as Proponent', time: '2 minutes ago' },
    { type: 'system', description: 'System backup completed successfully', time: '1 hour ago' },
    { type: 'user', description: 'User updated profile', time: '3 hours ago' },
    { type: 'system', description: 'Database maintenance completed', time: '6 hours ago' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome to the Research Management System Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={totalUsers} change={null} icon={FiUsers} color="blue" />
        <StatCard title="Active Users" value={`${activeUsers} (${activePct}%)`} change={activePct} icon={FiUserCheck} color="green" />
        <StatCard title="Pending Users" value={`${pendingUsers} (${pendingPct}%)`} change={pendingPct} icon={FiClock} color="yellow" />
        <StatCard title="Inactive Users" value={`${inactiveUsers} (${inactivePct}%)`} change={inactivePct} icon={FiUserX} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserRoleChart users={users} />
        <RecentActivity activities={recentActivities} />
      </div>

      <div className="admin-card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
            <div className="text-center">
              <FiUsers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Add New User</p>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
            <div className="text-center">
              <FiFileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Generate Report</p>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
            <div className="text-center">
              <FiSettings className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">System Settings</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
