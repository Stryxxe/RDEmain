import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { FiUsers, FiFileText, FiSettings, FiBell, FiMenu, FiLogOut, FiX, FiHome, FiUser } from 'react-icons/fi';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import usepLogo from '../../../assets/logo.png';

const AdminLayout = ({ children }) => {
  const { auth, url } = usePage().props;
  const user = auth?.user;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const notificationRef = useRef(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: FiHome },
    { name: 'User Management', href: '/admin/user-management', icon: FiUsers },
    { name: 'Reports', href: '/admin/reports', icon: FiFileText },
    { name: 'System Settings', href: '/admin/system-settings', icon: FiSettings },
    { name: 'Profile', href: '/admin/profile', icon: FiUser },
  ];

  const isActive = (path) => {
    if (!url) return false;
    return url === path || (url.startsWith(path + '/') && path !== '/admin');
  };
  const currentPage = navigation.find(item => isActive(item.href))?.name || 'Dashboard';

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      router.post('/logout');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="fixed inset-x-0 top-0 z-30">
        <header className="bg-gradient-to-r from-red-900 to-red-900 text-white px-8 py-4 flex justify-between items-center shadow-md">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-red-800 rounded-lg transition-colors"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <img src={usepLogo} alt="USeP Logo" className="h-12 w-12" />
            <div>
              <h1 className="text-xl font-bold">Research Management System</h1>
              <p className="text-sm text-red-100">University of Southeastern Philippines</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Show only user's name */}
            <div className="hidden md:flex items-center px-4 py-2 rounded-lg">
              <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 bg-red-800 hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </header>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-20 left-0 bottom-0 w-64 bg-red-900 text-white z-20 overflow-y-auto transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="py-4">
          <div className="space-y-1 px-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    active
                      ? 'bg-red-800 text-white'
                      : 'text-white hover:bg-red-800'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pt-20 md:pl-64 py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
