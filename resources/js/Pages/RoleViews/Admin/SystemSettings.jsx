import React, { useState } from 'react';
import { FiSave, FiRefreshCw, FiDatabase, FiShield, FiMail, FiBell } from 'react-icons/fi';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    systemName: 'Research Management System',
    systemVersion: '1.0.0',
    maintenanceMode: false,
    userRegistration: true,
    emailNotifications: true,
    maxFileSize: '10',
    sessionTimeout: '30',
    backupFrequency: 'daily',
    logRetention: '90'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        systemName: 'Research Management System',
        systemVersion: '1.0.0',
        maintenanceMode: false,
        userRegistration: true,
        emailNotifications: true,
        maxFileSize: '10',
        sessionTimeout: '30',
        backupFrequency: 'daily',
        logRetention: '90'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-1 text-sm text-gray-600">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleReset} className="admin-button-secondary flex items-center space-x-2">
            <FiRefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button onClick={handleSave} disabled={loading} className="admin-button-primary flex items-center space-x-2">
            <FiSave className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-card">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiDatabase className="w-5 h-5 mr-2" />
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Name</label>
              <input type="text" name="systemName" value={settings.systemName} onChange={handleChange} className="admin-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Version</label>
              <input type="text" name="systemVersion" value={settings.systemVersion} onChange={handleChange} className="admin-input" disabled />
            </div>
            <div className="flex items-center">
              <input type="checkbox" name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleChange} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <label className="ml-2 text-sm text-gray-700">Enable Maintenance Mode</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" name="userRegistration" checked={settings.userRegistration} onChange={handleChange} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <label className="ml-2 text-sm text-gray-700">Allow User Registration</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
              <input type="number" name="sessionTimeout" value={settings.sessionTimeout} onChange={handleChange} className="admin-input" min="5" max="480" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max File Upload Size (MB)</label>
              <input type="number" name="maxFileSize" value={settings.maxFileSize} onChange={handleChange} className="admin-input" min="1" max="100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Log Retention (days)</label>
              <select name="logRetention" value={settings.logRetention} onChange={handleChange} className="admin-input">
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiMail className="w-5 h-5 mr-2" />
            Notification Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input type="checkbox" name="emailNotifications" checked={settings.emailNotifications} onChange={handleChange} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <label className="ml-2 text-sm text-gray-700">Enable Email Notifications</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notification Frequency</label>
              <select className="admin-input">
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiDatabase className="w-5 h-5 mr-2" />
            Backup Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup Frequency</label>
              <select name="backupFrequency" value={settings.backupFrequency} onChange={handleChange} className="admin-input">
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <FiBell className="w-5 h-5 text-yellow-400" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">Last Backup</h4>
                  <p className="text-sm text-yellow-700 mt-1">Successfully completed recently</p>
                </div>
              </div>
            </div>
            <button className="admin-button-secondary w-full">Create Manual Backup</button>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-sm font-medium text-gray-900">Database</p>
            <p className="text-xs text-green-600">Online</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-sm font-medium text-gray-900">API Server</p>
            <p className="text-xs text-green-600">Online</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-sm font-medium text-gray-900">File Storage</p>
            <p className="text-xs text-green-600">Online</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
            </div>
            <p className="text-sm font-medium text-gray-900">Email Service</p>
            <p className="text-xs text-yellow-600">Warning</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;



