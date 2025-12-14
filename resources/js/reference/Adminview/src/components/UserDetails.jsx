import React from "react";
import {
  FiX,
  FiMail,
  FiPhone,
  FiHome,
  FiCalendar,
  FiUser,
  FiShield,
} from "react-icons/fi";
import { format } from "date-fns";

const UserDetails = ({ user, onClose }) => {
  const formatRole = (role) => {
    const roleMap = {
      admin: "Admin",
      proponent: "Proponent",
      central_manager: "Central Manager",
      rdd: "RDD",
      rde: "RDE",
      op: "OP",
      osuoro: "OSUORO",
    };
    return roleMap[role] || role;
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                User Details
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-center space-x-4">
                <img
                  className="w-20 h-20 rounded-full"
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {formatRole(user.role)}
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                        user.status
                      )}`}
                    >
                      {user.status.charAt(0).toUpperCase() +
                        user.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Email Address
                    </label>
                    <div className="flex items-center space-x-2">
                      <FiMail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Phone Number
                    </label>
                    <div className="flex items-center space-x-2">
                      <FiPhone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {user.phone}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Department
                    </label>
                    <div className="flex items-center space-x-2">
                      <FiHome className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {user.department}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      User ID
                    </label>
                    <div className="flex items-center space-x-2">
                      <FiUser className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900 font-mono">
                        {user.id}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Last Login
                    </label>
                    <div className="flex items-center space-x-2">
                      <FiCalendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {user.lastLogin
                          ? format(
                              new Date(user.lastLogin),
                              "MMM dd, yyyy HH:mm"
                            )
                          : "Never"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Member Since
                    </label>
                    <div className="flex items-center space-x-2">
                      <FiCalendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {format(new Date(user.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Information */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Role Information
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiShield className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Role: {formatRole(user.role)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {user.role === "admin" &&
                      "Full system access with ability to manage all users and settings."}
                    {user.role === "committee_member" &&
                      "Can review and evaluate research proposals and progress reports."}
                    {user.role === "proponent" &&
                      "Can submit research proposals and track their status."}
                    {user.role === "rdd_member" &&
                      "Research and Development Division member with proposal review capabilities."}
                    {user.role === "rde_member" &&
                      "Research Development and Extension member with specialized review access."}
                    {user.role === "reviewer" &&
                      "Can review and provide feedback on research proposals."}
                  </p>
                </div>
              </div>

              {/* Activity Summary */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Activity Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {user.lastLogin ? "Active" : "Inactive"}
                    </div>
                    <div className="text-sm text-blue-800">
                      {user.lastLogin
                        ? "Recently logged in"
                        : "No recent activity"}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {user.status === "active" ? "Online" : "Offline"}
                    </div>
                    <div className="text-sm text-green-800">Account Status</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="admin-button-primary w-full sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
