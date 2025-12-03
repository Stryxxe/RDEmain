import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiMail, FiHome } from 'react-icons/fi';
import axios from 'axios';

// Use window.axios which has session-based auth configured, or configure this instance
const axiosInstance = window.axios || axios;
if (!window.axios) {
  axiosInstance.defaults.withCredentials = true;
  axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const UserFormFixed = ({ user, onClose }) => {
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [researchCenters, setResearchCenters] = useState([]);
  const [loadingResearchCenters, setLoadingResearchCenters] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'proponent',
    status: 'active',
    department: '',
    researchCenter: ''
  });
  const [errors, setErrors] = useState({});

  // Fetch departments and research centers on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const response = await axiosInstance.get('/admin/departments', {
          headers: { 'Accept': 'application/json' },
          withCredentials: true
        });
        
        if (response.data.success) {
          setDepartments(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        // If API fails, use empty array - form will still work with text input fallback
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    };

    const fetchResearchCenters = async () => {
      try {
        setLoadingResearchCenters(true);
        const response = await axiosInstance.get('/admin/research-centers', {
          headers: { 'Accept': 'application/json' },
          withCredentials: true
        });
        if (response.data.success) {
          setResearchCenters(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching research centers:', error);
        setResearchCenters([]);
      } finally {
        setLoadingResearchCenters(false);
      }
    };

    fetchDepartments();
    fetchResearchCenters();
  }, []);

  useEffect(() => {
    if (user) {
      // When editing, try to match the department name with the departments list
      let departmentValue = user.department || '';
      let researchCenterValue = user.researchCenter || '';
      
      // If departments are loaded and user has a department, try to match it
      if (departments.length > 0 && departmentValue) {
        const matchedDept = departments.find(
          dept => (dept.name || dept.departmentName) === departmentValue
        );
        if (matchedDept) {
          departmentValue = matchedDept.name || matchedDept.departmentName;
        }
      }
      
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'proponent',
        status: user.status || 'active',
        department: departmentValue,
        researchCenter: researchCenterValue
      });
    }
  }, [user, departments]);

  const validateForm = () => {
    const newErrors = {};
    
    // First name and last name are required
    if (!formData.firstName || !formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName || !formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    // Email validation
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Role is required
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    
    // Department is required
    if (!formData.department || !formData.department.trim()) {
      newErrors.department = 'Department is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      if (user) {
        // Update existing user via API
        await axiosInstance.put(`/admin/users/${user.id || user.userID}`, formData, {
          headers: { 'Accept': 'application/json' },
          withCredentials: true,
        });
        await window.customAlert('', 'User Updated Successfully!');
      } else {
        // Create new user via API
        const response = await axiosInstance.post('/admin/users', formData, {
          headers: { 'Accept': 'application/json' },
          withCredentials: true,
        });
        const result = response?.data;
        if (result?.temporaryPassword) {
          await window.customAlert(`User added successfully! Temporary password: ${result.temporaryPassword}`);
        } else {
          await window.customAlert('User added successfully!');
        }
      }
      onClose();
    } catch (error) {
      console.error('User save failed:', error?.response?.data || error?.message || error);
      
      // Handle validation errors from backend
      if (error?.response?.data?.errors) {
        const backendErrors = {};
        Object.keys(error.response.data.errors).forEach(field => {
          backendErrors[field] = error.response.data.errors[field][0];
        });
        setErrors(backendErrors);
        await window.customAlert('Please fix the errors in the form');
      } else if (error?.response?.data?.message) {
        await window.customAlert(error.response.data.message);
      } else {
        await window.customAlert('Error saving user. Please try again.');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-link logic
    if (name === 'department') {
      // When department changes, find research centers linked to this department
      const selectedDept = departments.find(d => 
        (d.name || d.departmentName) === value || 
        String(d.departmentID || d.id) === String(value)
      );
      
      if (selectedDept && researchCenters.length > 0) {
        // Find centers belonging to this department
        const linkedCenter = researchCenters.find(rc => 
          String(rc.departmentID) === String(selectedDept.departmentID || selectedDept.id)
        );
        
        if (linkedCenter) {
          // Auto-select the linked research center
          setFormData((prev) => ({ 
            ...prev, 
            [name]: value,
            researchCenter: linkedCenter.name || linkedCenter.centerName 
          }));
          return;
        }
      }
    } else if (name === 'researchCenter') {
      // When research center changes, auto-select its department
      const selectedCenter = researchCenters.find(rc => 
        (rc.name || rc.centerName) === value ||
        String(rc.centerID || rc.id) === String(value)
      );
      
      if (selectedCenter && selectedCenter.departmentID && departments.length > 0) {
        const linkedDept = departments.find(d => 
          String(d.departmentID || d.id) === String(selectedCenter.departmentID)
        );
        
        if (linkedDept) {
          // Auto-select the linked department
          setFormData((prev) => ({ 
            ...prev, 
            [name]: value,
            department: linkedDept.name || linkedDept.departmentName 
          }));
          return;
        }
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{user ? 'Edit User' : 'Add New User'}</h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <div className="relative">
                      <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" aria-hidden="true" />
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={`admin-input pl-10 placeholder-gray-400 ${errors.firstName ? 'border-red-500' : ''}`} placeholder="Enter first name" />
                    </div>
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <div className="relative">
                      <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" aria-hidden="true" />
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={`admin-input pl-10 placeholder-gray-400 ${errors.lastName ? 'border-red-500' : ''}`} placeholder="Enter last name" />
                    </div>
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <div className="relative">
                    <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" aria-hidden="true" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={`admin-input pl-10 placeholder-gray-400 ${errors.email ? 'border-red-500' : ''}`} placeholder="Enter email address" />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
                {/* Removed phone field per request */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <div className="relative">
                    <FiHome className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10" aria-hidden="true" />
                    {loadingDepartments ? (
                      <div className={`admin-input pl-10 ${errors.department ? 'border-red-500' : ''} bg-gray-50`}>
                        <span className="text-gray-500 text-sm">Loading departments...</span>
                      </div>
                    ) : departments.length > 0 ? (
                      <select 
                        name="department" 
                        value={formData.department} 
                        onChange={handleChange} 
                        className={`admin-input pl-10 ${errors.department ? 'border-red-500' : ''}`}
                      >
                        <option value="">Select a department</option>
                        {departments.map((dept) => (
                          <option key={dept.departmentID} value={dept.name || dept.departmentName}>
                            {dept.name || dept.departmentName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        name="department" 
                        value={formData.department} 
                        onChange={handleChange} 
                        className={`admin-input pl-10 placeholder-gray-400 ${errors.department ? 'border-red-500' : ''}`} 
                        placeholder="Enter department" 
                      />
                    )}
                  </div>
                  {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Research Center</label>
                  <div className="relative">
                    <FiHome className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10" aria-hidden="true" />
                    {loadingResearchCenters ? (
                      <div className={`admin-input pl-10 bg-gray-50`}>
                        <span className="text-gray-500 text-sm">Loading research centers...</span>
                      </div>
                    ) : researchCenters.length > 0 ? (
                      <select 
                        name="researchCenter" 
                        value={formData.researchCenter} 
                        onChange={handleChange} 
                        className={`admin-input pl-10`}
                      >
                        <option value="">Select a research center</option>
                        {researchCenters.map((rc) => (
                          <option key={rc.id || rc.centerID} value={rc.name || rc.centerName}>
                            {rc.name || rc.centerName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        name="researchCenter" 
                        value={formData.researchCenter} 
                        onChange={handleChange} 
                        className={`admin-input pl-10 placeholder-gray-400`} 
                        placeholder="Enter research center" 
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select name="role" value={formData.role} onChange={handleChange} className={`admin-input ${errors.role ? 'border-red-500' : ''}`}>
                      <option value="">Select a role</option>
                      <option value="admin">Admin</option>
                      <option value="proponent">Proponent</option>
                      <option value="central_manager">Central Manager</option>
                      <option value="rdd">RDD</option>
                      <option value="rde">RDE</option>
                      <option value="op">OP</option>
                      <option value="osuoro">OSUORO</option>
                    </select>
                    {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="admin-input">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button type="submit" className="admin-button-primary w-full sm:w-auto sm:ml-3">{user ? 'Update User' : 'Create User'}</button>
              <button type="button" onClick={onClose} className="admin-button-secondary w-full sm:w-auto mt-3 sm:mt-0">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserFormFixed;

