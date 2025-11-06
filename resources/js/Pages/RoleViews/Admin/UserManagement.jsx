import React, { useState } from 'react';
import { useAdmin } from '../../../contexts/AdminContext';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { format } from 'date-fns';
import UserForm from '../../../components/Admin/UserFormFixed';
import UserDetails from '../../../components/Admin/UserDetails';

const UserManagement = () => {
  const { paginatedUsers, totalPages, pagination, filters, setFilters, setPagination, deleteUser, resetFilters, filteredUsers } = useAdmin();

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleSearch = (e) => {
    setFilters({ search: e.target.value });
    setPagination({ page: 1 });
  };

  const handleRoleFilter = (role) => {
    setFilters({ role });
    setPagination({ page: 1 });
  };

  const handleStatusFilter = (status) => {
    setFilters({ status });
    setPagination({ page: 1 });
  };

  const handlePageChange = (page) => {
    setPagination({ page });
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleViewUser = (user) => {
    setViewingUser(user);
    setShowUserDetails(true);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        deleteUser(userId);
        alert('User deleted successfully!');
      } catch (error) {
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map((user) => user.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) {
      alert('Please select users to delete');
      return;
    }
    if (
      window.confirm(`Are you sure you want to delete ${selectedUsers.length} selected user(s)? This action cannot be undone.`)
    ) {
      try {
        selectedUsers.forEach((userId) => deleteUser(userId));
        setSelectedUsers([]);
        alert(`${selectedUsers.length} user(s) deleted successfully!`);
      } catch (error) {
        alert('Error deleting users. Please try again.');
      }
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      proponent: 'bg-green-100 text-green-800',
      central_manager: 'bg-blue-100 text-blue-800',
      rdd: 'bg-yellow-100 text-yellow-800',
      rde: 'bg-purple-100 text-purple-800',
      op: 'bg-orange-100 text-orange-800',
      osuoro: 'bg-indigo-100 text-indigo-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatRole = (role) => {
    const roleMap = {
      admin: 'Admin',
      proponent: 'Proponent',
      central_manager: 'Central Manager',
      rdd: 'RDD',
      rde: 'RDE',
      op: 'OP',
      osuoro: 'OSUORO'
    };
    return roleMap[role] || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage all users across the research management system</p>
        </div>
        <div className="flex space-x-2">
          {selectedUsers.length > 0 && (
            <button onClick={handleBulkDelete} className="admin-button-danger flex items-center space-x-2">
              <FiTrash2 className="w-4 h-4" />
              <span>Delete Selected ({selectedUsers.length})</span>
            </button>
          )}
          <button onClick={() => setShowUserForm(true)} className="admin-button-primary flex items-center space-x-2">
            <FiPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search users..." value={filters.search} onChange={handleSearch} className="admin-input pl-10" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={filters.role} onChange={(e) => handleRoleFilter(e.target.value)} className="admin-input">
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="proponent">Proponent</option>
              <option value="central_manager">Central Manager</option>
              <option value="rdd">RDD</option>
              <option value="rde">RDE</option>
              <option value="op">OP</option>
              <option value="osuoro">OSUORO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={filters.status} onChange={(e) => handleStatusFilter(e.target.value)} className="admin-input">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex items-end">
            <button onClick={resetFilters} className="admin-button-secondary w-full">Clear Filters</button>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="w-12">
                  <input type="checkbox" checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0} onChange={handleSelectAll} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                </th>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Department</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td>
                    <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => handleSelectUser(user.id)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  </td>
                  <td>
                    <div className="flex items-center">
                      <img className="w-10 h-10 rounded-full" src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>{formatRole(user.role)}</span>
                  </td>
                  <td>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="text-sm text-gray-900">{user.department}</td>
                  <td className="text-sm text-gray-500">{user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, yyyy') : 'Never'}</td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleViewUser(user)} className="p-1 text-gray-400 hover:text-blue-600" title="View">
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditUser(user)} className="p-1 text-gray-400 hover:text-green-600" title="Edit">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(user.id)} className="p-1 text-gray-400 hover:text-red-600" title="Delete">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              {filteredUsers.length === 0 ? (
                'No results'
              ) : (
                `Showing ${(pagination.page - 1) * pagination.limit + 1} to ${Math.min(pagination.page * pagination.limit, filteredUsers.length)} of ${filteredUsers.length} results`
              )}
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => handlePageChange(page)} className={`px-3 py-1 text-sm border rounded-md ${page === pagination.page ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50'}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === totalPages} className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {showUserForm && (
        <UserForm
          user={editingUser}
          onClose={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
        />
      )}

      {showUserDetails && viewingUser && (
        <UserDetails
          user={viewingUser}
          onClose={() => {
            setShowUserDetails(false);
            setViewingUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;


