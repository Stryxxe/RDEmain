import React, { useState, useEffect } from 'react';
import { User, Mail, Building, Shield, Save, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Account = () => {
  const { user, updateUser, loading, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    role: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        department: user.department?.name || '',
        role: user.role?.userRole || ''
      });
    }
  }, [user]);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (message && message.includes('successfully')) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      const result = await updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      });
      
      if (result.success) {
        setMessage('Profile updated successfully!');
        setEditing(false);
      } else {
        setMessage(result.message || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full -m-2 sm:-m-4 md:-m-6 lg:-m-8">
      {/* Header Section - Constrained Width with more top spacing */}
      <div className="max-w-6xl mx-auto mb-8 px-2 sm:px-4 md:px-6 lg:px-8 pt-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      {/* Message Section - Constrained Width */}
      {message && (
        <div className="max-w-6xl mx-auto mb-6 px-2 sm:px-4 md:px-6 lg:px-8">
          <div className={`p-4 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message}
          </div>
        </div>
      )}

      {/* Content Section - Centered with consistent width */}
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Profile Information</h2>
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                First Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              ) : (
                <p className="text-gray-900 py-2 text-base">{formData.firstName || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                Last Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              ) : (
                <p className="text-gray-900 py-2 text-base">{formData.lastName || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                Email Address
              </label>
              {editing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              ) : (
                <p className="text-gray-900 py-2 text-base">{formData.email || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                <Building className="inline w-4 h-4 mr-2" />
                Department
              </label>
              <p className="text-gray-900 py-2 text-base">{formData.department || 'Not specified'}</p>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                <Shield className="inline w-4 h-4 mr-2" />
                Role
              </label>
              <p className="text-gray-900 py-2 text-base">{formData.role || 'Not specified'}</p>
            </div>
          </div>

          {editing && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Security Settings */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security Settings</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-medium text-gray-900">Change Password</h3>
                <p className="text-base text-gray-500">Update your password to keep your account secure</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Change
              </button>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-medium text-gray-900">Two-Factor Authentication</h3>
                <p className="text-base text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Enable
              </button>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Actions</h2>
          
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-medium text-gray-900">Sign Out</h3>
              <p className="text-base text-gray-500">Sign out of your account on this device</p>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Account;