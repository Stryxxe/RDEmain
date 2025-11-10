import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { FiX, FiUser, FiMail, FiPhone, FiHome } from 'react-icons/fi';

const UserForm = ({ user, onClose }) => {
  const { addUser, updateUser } = useAdmin();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'proponent',
    status: 'active',
    department: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'proponent',
        status: user.status || 'active',
        department: user.department || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (user) {
        await updateUser(user.id, formData);
        alert('User updated successfully!');
      } else {
        const result = await addUser(formData);
        if (result?.temporaryPassword) {
          alert(`User added successfully! Temporary password: ${result.temporaryPassword}`);
        } else {
          alert('User added successfully!');
        }
      }
      onClose();
    } catch (error) {
      alert('Error saving user. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
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
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={`admin-input pl-10 ${errors.firstName ? 'border-red-500' : ''}`} placeholder="Enter first name" />
                    </div>
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={`admin-input pl-10 ${errors.lastName ? 'border-red-500' : ''}`} placeholder="Enter last name" />
                    </div>
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={`admin-input pl-10 ${errors.email ? 'border-red-500' : ''}`} placeholder="Enter email address" />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`admin-input pl-10 ${errors.phone ? 'border-red-500' : ''}`} placeholder="Enter phone number" />
                  </div>
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <div className="relative">
                    <FiHome className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" name="department" value={formData.department} onChange={handleChange} className={`admin-input pl-10 ${errors.department ? 'border-red-500' : ''}`} placeholder="Enter department" />
                  </div>
                  {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="admin-input">
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
                    <select name="status" value={formData.status} onChange={handleChange} className="admin-input">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
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

export default UserForm;



