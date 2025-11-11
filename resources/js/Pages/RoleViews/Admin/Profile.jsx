import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useAuth } from '../../../contexts/AuthContext';
import { FiSave, FiEdit2, FiCamera, FiShield } from 'react-icons/fi';

const Profile = () => {
  const { user } = useAuth();
  const { props } = usePage();
  
  // Get user from Inertia props (more reliable than context on initial load)
  const currentUser = user || props?.auth?.user;

  // Validate authentication and role
  useEffect(() => {
    // Prevent redirect loop - check if we're already on login page
    if (window.location.pathname === '/login' || window.location.pathname === '/') {
      return;
    }

    // Wait a bit for user to be available (in case of initial page load)
    const checkAuth = setTimeout(() => {
      if (!currentUser) {
        router.visit('/login');
        return;
      }
      
      // Check if user is an Admin or Administrator
      const isAdmin = currentUser.role?.userRole === 'Admin' || 
                     currentUser.role?.userRole === 'Administrator';
      
      if (!isAdmin) {
        router.visit('/dashboard');
        return;
      }
    }, 100);

    return () => clearTimeout(checkAuth);
  }, [currentUser]);

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@university.edu',
    phone: '+1-555-0123',
    role: 'admin',
    department: 'IT Administration',
    bio: 'System administrator with full access to all research management system features.',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=3b82f6&color=fff'
  });

  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPassword((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (password.new !== password.confirm) {
      alert('New passwords do not match');
      return;
    }
    setPassword({ current: '', new: '', confirm: '' });
    alert('Password changed successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your account settings and preferences</p>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="admin-button-secondary">Cancel</button>
              <button onClick={handleSaveProfile} className="admin-button-primary flex items-center space-x-2">
                <FiSave className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="admin-button-primary flex items-center space-x-2">
              <FiEdit2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="admin-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" name="firstName" value={profile.firstName} onChange={handleProfileChange} disabled={!isEditing} className="admin-input disabled:bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" name="lastName" value={profile.lastName} onChange={handleProfileChange} disabled={!isEditing} className="admin-input disabled:bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" name="email" value={profile.email} onChange={handleProfileChange} disabled={!isEditing} className="admin-input disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" name="phone" value={profile.phone} onChange={handleProfileChange} disabled={!isEditing} className="admin-input disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input type="text" name="department" value={profile.department} onChange={handleProfileChange} disabled={!isEditing} className="admin-input disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea name="bio" value={profile.bio} onChange={handleProfileChange} disabled={!isEditing} rows={3} className="admin-input disabled:bg-gray-50" />
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiShield className="w-5 h-5 mr-2" />
              Security Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" name="current" value={password.current} onChange={handlePasswordChange} className="admin-input" placeholder="Enter current password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" name="new" value={password.new} onChange={handlePasswordChange} className="admin-input" placeholder="Enter new password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" name="confirm" value={password.confirm} onChange={handlePasswordChange} className="admin-input" placeholder="Confirm new password" />
              </div>
              <button onClick={handleChangePassword} className="admin-button-primary">Change Password</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="admin-card text-center">
            <div className="relative inline-block">
              <img className="w-24 h-24 rounded-full mx-auto" src={profile.avatar} alt="Profile" />
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700">
                  <FiCamera className="w-4 h-4" />
                </button>
              )}
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">{profile.firstName} {profile.lastName}</h3>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 mt-2">
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
            </span>
          </div>

          <div className="admin-card">
            <h4 className="text-md font-medium text-gray-900 mb-3">Account Information</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm text-gray-900">Jan 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Login</span>
                <span className="text-sm text-gray-900">Today, 2:30 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Two-Factor Auth</span>
                <span className="text-sm text-gray-900">Enabled</span>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h4 className="text-md font-medium text-gray-900 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">Download Data</button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">Export Settings</button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">Activity Log</button>
              <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">Delete Account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;



