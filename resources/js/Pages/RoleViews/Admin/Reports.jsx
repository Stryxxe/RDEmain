import React, { useState } from 'react';
import { useAdmin } from '../../../contexts/AdminContext';
import { FiDownload, FiTrendingUp, FiFileText, FiBarChart, FiTarget } from 'react-icons/fi';

const Reports = () => {
  const { users } = useAdmin();
  const [selectedReport, setSelectedReport] = useState('user-summary');
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(false);

  const reports = [
    { id: 'user-summary', name: 'User Summary', icon: FiFileText },
    { id: 'user-activity', name: 'User Activity', icon: FiTrendingUp },
    { id: 'role-distribution', name: 'Role Distribution', icon: FiTarget },
    { id: 'system-usage', name: 'System Usage', icon: FiBarChart }
  ];

  const generateReport = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setLoading(false);
    alert('Report generated successfully!');
  };

  const downloadReport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    let reportData = `Report: ${selectedReport} - ${dateRange} days - ${timestamp}`;
    const element = document.createElement('a');
    const file = new Blob([reportData], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedReport}-${dateRange}days-${timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const stats = (() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'active').length;
    const pending = users.filter((u) => u.status === 'pending').length;
    const inactive = users.filter((u) => u.status === 'inactive').length;
    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    return { total, active, pending, inactive, roleStats };
  })();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-600">Generate and download system reports</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={downloadReport} className="admin-button-primary flex items-center space-x-2">
            <FiDownload className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="admin-card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Report Options</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <div className="space-y-2">
                {reports.map((report) => {
                  const Icon = report.icon;
                  return (
                    <button key={report.id} onClick={() => setSelectedReport(report.id)} className={`w-full flex items-center p-3 rounded-lg border transition-colors ${selectedReport === report.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="text-sm font-medium">{report.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="admin-input">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            <button onClick={generateReport} disabled={loading} className="admin-button-primary w-full flex items-center justify-center space-x-2">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FiFileText className="w-4 h-4" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="admin-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Report Preview</h3>
            {selectedReport === 'user-summary' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-blue-800">Total Users</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    <div className="text-sm text-green-800">Active Users</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-sm text-yellow-800">Pending Users</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                    <div className="text-sm text-red-800">Inactive Users</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Role Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.roleStats).map(([role, count]) => (
                      <div key={role} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 capitalize">{role.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${(count / stats.total) * 100}%` }} />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {selectedReport === 'user-activity' && (
              <div className="text-center py-8">
                <FiTrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">User activity data for the last {dateRange} days</p>
              </div>
            )}
            {selectedReport === 'role-distribution' && (
              <div className="text-center py-8">
                <FiTarget className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Role distribution chart</p>
              </div>
            )}
            {selectedReport === 'system-usage' && (
              <div className="text-center py-8">
                <FiBarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">System usage statistics</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Reports</h3>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Generated</th>
                <th>Size</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium">User Summary - 30 days</td>
                <td>Dec 15, 2024</td>
                <td>2.4 MB</td>
                <td>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Ready</span>
                </td>
                <td>
                  <button className="text-primary-600 hover:text-primary-800 text-sm">Download</button>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Role Distribution - 7 days</td>
                <td>Dec 14, 2024</td>
                <td>1.8 MB</td>
                <td>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Ready</span>
                </td>
                <td>
                  <button className="text-primary-600 hover:text-primary-800 text-sm">Download</button>
                </td>
              </tr>
              <tr>
                <td className="font-medium">System Usage - 90 days</td>
                <td>Dec 13, 2024</td>
                <td>5.2 MB</td>
                <td>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Processing</span>
                </td>
                <td>
                  <button className="text-gray-400 text-sm cursor-not-allowed">Download</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;


