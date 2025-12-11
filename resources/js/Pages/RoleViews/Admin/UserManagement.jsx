import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiCheckCircle } from "react-icons/fi";
import { format } from "date-fns";
import UserForm from "../../../Components/Admin/UserFormFixed";
import UserDetails from "../../../Components/Admin/UserDetails";
import AdminLayout from "../../../Components/Layouts/AdminLayout";

const UserManagement = () => {
    const { auth } = usePage().props;
    const currentUser = auth?.user;
    
    // State management for users
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, perPage: 10 });
    const [filters, setFilters] = useState({ search: '', role: '', department: '', status: '' });
    const [totalPages, setTotalPages] = useState(1);

    // Fetch users from API
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: pagination.page,
                perPage: pagination.perPage,
                search: filters.search,
                role: filters.role,
                department: filters.department,
                status: filters.status,
            });
            
            const response = await fetch(`/api/admin/users?${queryParams}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
                setTotalPages(Math.ceil((data.total || data.users?.length || 0) / pagination.perPage));
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

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, pagination.perPage, filters]);

    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);

    const handleSearch = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleRoleFilter = (role) => {
        setFilters(prev => ({ ...prev, role }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleStatusFilter = (status) => {
        setFilters(prev => ({ ...prev, status }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, page }));
    };
    
    const resetFilters = () => {
        setFilters({ search: '', role: '', department: '', status: '' });
        setPagination({ page: 1, perPage: 10 });
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setShowUserForm(true);
    };

    const handleViewUser = (user) => {
        setViewingUser(user);
        setShowUserDetails(true);
    };



    const handleActivateUser = async (userId) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}/activate`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                await window.customAlert('', 'User activated successfully!', 3000);
                await fetchUsers();
            } else {
                const errorData = await response.json();
                const errorMessage = errorData?.message || "Error activating user. Please try again.";
                await window.customAlert(errorMessage, 'Error');
            }
        } catch (error) {
            console.error('Error activating user:', error);
            await window.customAlert("Error activating user. Please try again.", 'Error');
        }
    };

    const handleDeleteUser = async (userId) => {
        const confirmed = await window.customConfirm(
            "Are you sure you want to delete this user? This action cannot be undone.",
            "Confirm Deletion"
        );
        
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                await window.customAlert('', '1 user(s) deleted successfully!', 3000);
                // Refresh users list and recalculate pagination
                await fetchUsers();
            } else {
                const errorData = await response.json();
                const errorMessage = errorData?.message || "Error deleting user. Please try again.";
                
                // If deletion is blocked due to related data, offer to deactivate instead
                if (response.status === 422 && errorMessage.includes('Cannot delete user')) {
                    const confirmDeactivate = await window.customConfirm(
                        'This user has related data and cannot be deleted.\nWould you like to deactivate this user instead?',
                        'Deactivate Instead?'
                    );
                    if (confirmDeactivate) {
                        const deactivateRes = await fetch(`/api/admin/users/${userId}`, {
                            method: 'PUT',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                            },
                            credentials: 'include',
                            body: JSON.stringify({ status: 'inactive' })
                        });
                        if (deactivateRes.ok) {
                            await window.customAlert('', 'User deactivated successfully.');
                            await fetchUsers();
                        } else {
                            const deErr = await deactivateRes.json().catch(() => ({}));
                            await window.customAlert(deErr?.message || 'Failed to deactivate user.', 'Error');
                        }
                    } else {
                        await window.customAlert(errorMessage, 'Error');
                    }
                } else {
                    await window.customAlert(errorMessage, 'Error');
                }
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            await window.customAlert("Error deleting user. Please try again.", 'Error');
        }
    };

    const handleSelectUser = (userId) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };



    // Client-side filtering as fallback if API ignores filters
    const filteredUsers = users.filter((u) => {
        const search = (filters.search || '').toLowerCase().trim();
        const role = (filters.role || '').toLowerCase();
        const status = (filters.status || '').toLowerCase();
        const department = (filters.department || '').toLowerCase();

        const matchesSearch = !search
            || `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(search)
            || (u.email || '').toLowerCase().includes(search)
            || (u.department || '').toLowerCase().includes(search);

        const normalize = (v) => (v || '').toLowerCase();
        const userRole = normalize(u.role) || normalize(u.roleName) || normalize(u.role?.userRole);
        const userStatus = normalize(u.status);
        const userDept = normalize(u.department) || normalize(u.departmentName) || normalize(u.department?.name);

        const matchesRole = !role || role === 'all' ? true : userRole === role;
        const matchesStatus = !status || status === 'all' ? true : userStatus === status;
        const matchesDept = !department || department === 'all' ? true : userDept === department;

        return matchesSearch && matchesRole && matchesStatus && matchesDept;
    });

    // Paginate filtered results
    const start = (pagination.page - 1) * pagination.perPage;
    const end = start + pagination.perPage;
    const paginatedUsers = filteredUsers.slice(start, end);

    const handleSelectAll = () => {
        if (selectedUsers.length === paginatedUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(paginatedUsers.map((user) => user.id || user.userID));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUsers.length === 0) {
            await window.customAlert("Please select users to delete", 'Warning');
            return;
        }
        
        const confirmed = await window.customConfirm(
            `Are you sure you want to delete ${selectedUsers.length} selected user(s)? This action cannot be undone.`,
            "Confirm Deletion"
        );
        
        if (!confirmed) return;

        try {
            const deletePromises = selectedUsers.map(async (userId) => {
                const response = await fetch(`/api/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    credentials: 'include'
                });
                return response.ok;
            });
            
            const results = await Promise.all(deletePromises);
            
            // If some deletes failed, attempt deactivation for those
            const failedIds = [];
            for (let i = 0; i < results.length; i++) {
                if (!results[i]) failedIds.push(selectedUsers[i]);
            }
            
            if (failedIds.length > 0) {
                const confirmDeactivate = await window.customConfirm(
                    `${failedIds.length} user(s) could not be deleted due to related data.\nDeactivate them instead?`,
                    'Deactivate Instead?'
                );
                if (confirmDeactivate) {
                    const deactivatePromises = failedIds.map(userId => fetch(`/api/admin/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                        },
                        credentials: 'include',
                        body: JSON.stringify({ status: 'inactive' })
                    }));
                    await Promise.all(deactivatePromises);
                    await window.customAlert('', `${failedIds.length} user(s) deactivated.`);
                }
            }
            
            // Refresh users list and recalculate pagination
            await fetchUsers();
            const successCount = selectedUsers.length - failedIds.length;
            setSelectedUsers([]);
            if (successCount > 0) {
                await window.customAlert('', `${successCount} user(s) deleted successfully!`, 3000);
            }
        } catch (error) {
            console.error('Error deleting users:', error);
            await window.customAlert("Error deleting some users. They may have existing proposals, reviews, or decisions.", 'Error');
        }
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            admin: "bg-red-100 text-red-800",
            proponent: "bg-green-100 text-green-800",
            central_manager: "bg-blue-100 text-blue-800",
            rdd: "bg-yellow-100 text-yellow-800",
            rde: "bg-purple-100 text-purple-800",
            op: "bg-orange-100 text-orange-800",
            osuoro: "bg-indigo-100 text-indigo-800",
        };
        return colors[role] || "bg-gray-100 text-gray-800";
    };

    const getStatusBadgeColor = (status) => {
        const colors = {
            active: "bg-green-100 text-green-800",
            inactive: "bg-red-100 text-red-800",
            pending: "bg-yellow-100 text-yellow-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const formatRole = (role) => {
        const roleMap = {
            admin: "Admin",
            proponent: "Proponent",
            central_manager: "Center Manager",
            rdd: "RDD",
            rde: "RDE",
            op: "OP",
            osuoro: "OSUORO",
        };
        return roleMap[role] || role;
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            User Management
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage all users across the research management system
                        </p>
                    </div>
                <div className="flex space-x-2">
                    {selectedUsers.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="admin-button-danger flex items-center space-x-2"
                        >
                            <FiTrash2 className="w-4 h-4" />
                            <span>
                                Delete Selected ({selectedUsers.length})
                            </span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowUserForm(true)}
                        className="admin-button-primary flex items-center space-x-2"
                    >
                        <FiPlus className="w-4 h-4" />
                        <span>Add User</span>
                    </button>
                </div>
                </div>

            <div className="admin-card">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={filters.search}
                                onChange={handleSearch}
                                className="admin-input pl-10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <select
                            value={filters.role}
                            onChange={(e) => handleRoleFilter(e.target.value)}
                            className="admin-input"
                        >
                            <option value="all">All Roles</option>
                            <option value="proponent">Proponent</option>
                            <option value="central_manager">
                                Center Manager
                            </option>
                            <option value="rdd">RDD</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleStatusFilter(e.target.value)}
                            className="admin-input"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={resetFilters}
                            className="admin-button-secondary w-full"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th className="w-12">
                                    <input
                                        type="checkbox"
                                        checked={
                                            selectedUsers.length ===
                                                paginatedUsers.length &&
                                            paginatedUsers.length > 0
                                        }
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </th>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Department</th>
                                <th>Research Center</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(
                                                user.id
                                            )}
                                            onChange={() =>
                                                handleSelectUser(user.id)
                                            }
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                    </td>
                                    <td>
                                        <div className="flex items-center">
                                            <img
                                                className="w-10 h-10 rounded-full"
                                                src={user.avatar}
                                                alt={`${user.firstName} ${user.lastName}`}
                                            />
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.firstName}{" "}
                                                    {user.lastName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                                                user.role
                                            )}`}
                                        >
                                            {formatRole(user.role)}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                                                user.status
                                            )}`}
                                        >
                                            {user.status
                                                .charAt(0)
                                                .toUpperCase() +
                                                user.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="text-sm text-gray-900">
                                        {user.department}
                                    </td>
                                    <td className="text-sm text-gray-900">
                                        {user.researchCenter || "—"}
                                    </td>
                                    <td>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() =>
                                                    handleViewUser(user)
                                                }
                                                className="p-1 text-gray-400 hover:text-blue-600"
                                                title="View"
                                            >
                                                <FiEye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleEditUser(user)
                                                }
                                                className="p-1 text-gray-400 hover:text-green-600"
                                                title="Edit"
                                            >
                                                <FiEdit2 className="w-4 h-4" />
                                            </button>
                                            {user.status === 'pending' && (
                                                <button
                                                    onClick={() =>
                                                        handleActivateUser(user.id)
                                                    }
                                                    className="p-1 text-gray-400 hover:text-green-600"
                                                    title="Activate"
                                                >
                                                    <FiCheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() =>
                                                    handleDeleteUser(user.id)
                                                }
                                                className="p-1 text-gray-400 hover:text-red-600"
                                                title="Delete"
                                            >
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
                            {filteredUsers.length === 0
                                ? "No results"
                                : `Showing ${start + 1} to ${Math.min(end, filteredUsers.length)} of ${filteredUsers.length} results`}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() =>
                                    handlePageChange(pagination.page - 1)
                                }
                                disabled={pagination.page === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1
                            ).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-3 py-1 text-sm border rounded-md ${
                                        page === pagination.page
                                            ? "bg-primary-600 text-white border-primary-600"
                                            : "border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() =>
                                    handlePageChange(pagination.page + 1)
                                }
                                disabled={pagination.page === totalPages}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showUserForm && (
                <UserForm
                    user={editingUser}
                    onClose={async () => {
                        setShowUserForm(false);
                        setEditingUser(null);
                        // Refetch users so newly added/edited user appears without full page refresh
                        await fetchUsers();
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
        </AdminLayout>
    );
};

export default UserManagement;
