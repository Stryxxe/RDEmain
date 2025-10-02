import React, { useState, useEffect } from 'react';
import { User, Mail, Building, Shield, Save, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ProfileForm = ({ 
  onSave, 
  onCancel, 
  showLogout = true,
  additionalFields = [],
  className = "" 
}) => {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    role: '',
    researchCenter: ''
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
        role: user.role?.userRole || '',
        researchCenter: user.department?.name || '',
        ...additionalFields.reduce((acc, field) => {
          acc[field.name] = user[field.name] || '';
          return acc;
        }, {})
      });
    }
  }, [user, additionalFields]);

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
    setSaving(true);
    setMessage('');

    try {
      if (onSave) {
        await onSave(formData);
        setMessage('Profile updated successfully!');
        setEditing(false);
      }
    } catch (error) {
      setMessage('Error updating profile. Please try again.');
      console.error('Profile update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setMessage('');
    if (onCancel) {
      onCancel();
    }
  };

  const handleLogout = () => {
    if (logout) {
      logout();
    }
  };

  const formFields = [
    { name: 'firstName', label: 'First Name', icon: User, editable: true },
    { name: 'lastName', label: 'Last Name', icon: User, editable: true },
    { name: 'email', label: 'Email', icon: Mail, editable: true },
    { name: 'department', label: 'Department', icon: Building, editable: false },
    { name: 'role', label: 'Role', icon: Shield, editable: false },
    { name: 'researchCenter', label: 'Research Center', icon: Building, editable: false },
    ...additionalFields
  ];

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
        <div className="flex space-x-3">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          {showLogout && (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('successfully') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formFields.map((field) => {
          const IconComponent = field.icon;
          return (
            <div key={field.name} className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <IconComponent className="w-4 h-4" />
                <span>{field.label}</span>
              </label>
              {editing && field.editable ? (
                <input
                  type={field.type || 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {formData[field.name] || 'Not specified'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileForm;
