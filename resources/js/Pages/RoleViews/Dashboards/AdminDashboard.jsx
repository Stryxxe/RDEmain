import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { FiUsers, FiUserCheck, FiUserX, FiClock, FiFileText, FiSettings, FiChevronLeft, FiChevronRight, FiAlertCircle } from 'react-icons/fi';
import AdminLayout from '../../../Components/Layouts/AdminLayout';
import axios from 'axios';

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

const RecentActivity = ({ activities, loading, currentPage, totalPages, onPageChange }) => {
  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-700';
      case 'update':
        return 'bg-blue-100 text-blue-700';
      case 'delete':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="admin-card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading activities...</p>
          </div>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No activities recorded yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {activities.map((activity) => (
              <div key={activity.activityID} className="pb-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                    {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                  </span>
                  {activity.model_type && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      {activity.model_type}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-900">{activity.description}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{activity.userName}</span>
                  <span>{activity.formatted_date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-600">
                Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <FiChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <FiChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const UserRoleChart = ({ users }) => {
  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const roles = [
    { name: 'Proponent', count: roleCounts.proponent || 0, color: 'bg-green-500' },
    { name: 'Center Manager', count: roleCounts.central_manager || 0, color: 'bg-blue-500' },
    { name: 'RDD', count: roleCounts.rdd || 0, color: 'bg-yellow-500' }
  ];

  const total = roles.reduce((sum, role) => sum + role.count, 0);

  return (
    <div className="admin-card max-w-md">
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
  const { auth } = usePage().props;
  const currentUser = auth?.user;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  const axiosInstance = window.axios || axios;
  if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
  }

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/users', {
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || data || []);
        } else {
          console.error('Failed to fetch users');
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch activities with pagination
  const fetchActivities = async (page = 1) => {
    try {
      setActivitiesLoading(true);
      const response = await axiosInstance.get("/activities/recent", {
        params: {
          page: page,
          per_page: itemsPerPage
        }
      });
      setActivities(response.data.data);
      setCurrentPage(response.data.current_page);
      setTotalPages(response.data.last_page);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchActivities(currentPage);
    const interval = setInterval(() => fetchActivities(currentPage), 30000);
    return () => clearInterval(interval);
  }, [currentPage]);

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome to the Research Management System Admin Panel
          </p>
        </div>

        {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={totalUsers} change={null} icon={FiUsers} color="blue" />
        <StatCard title="Active Users" value={`${activeUsers} (${activePct}%)`} change={activePct} icon={FiUserCheck} color="green" />
        <StatCard title="Pending Users" value={`${pendingUsers} (${pendingPct}%)`} change={pendingPct} icon={FiClock} color="yellow" />
        <StatCard title="Inactive Users" value={`${inactiveUsers} (${inactivePct}%)`} change={inactivePct} icon={FiUserX} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UserRoleChart users={users} />
        <div className="lg:col-span-2">
          <RecentActivity 
            activities={activities} 
            loading={activitiesLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
