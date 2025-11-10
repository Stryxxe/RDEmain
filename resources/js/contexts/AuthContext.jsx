import React, { createContext, useContext } from 'react';
import { usePage, router, useForm } from '@inertiajs/react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children, user: initialUser }) => {
  let user = initialUser || null;
  
  try {
    const { props } = usePage();
    user = props?.auth?.user || user;
  } catch (e) {
    // usePage might not be available in all contexts, use initialUser
    user = initialUser || null;
  }

  const logout = () => {
    // Clear local storage first
    localStorage.removeItem('dismissedNotifications');
    
    // Create a form and submit it - this is the most reliable way to handle logout
    // Forms automatically include CSRF tokens and handle redirects properly
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/logout';
    
    // Add CSRF token as hidden input
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = '_token';
      csrfInput.value = csrfToken;
      form.appendChild(csrfInput);
    }
    
    // Add method spoofing for POST
    const methodInput = document.createElement('input');
    methodInput.type = 'hidden';
    methodInput.name = '_method';
    methodInput.value = 'POST';
    form.appendChild(methodInput);
    
    // Append to body and submit
    document.body.appendChild(form);
    form.submit();
  };

  const updateUser = async (userData) => {
    // For Inertia, user updates should be handled through Inertia forms
    // This is a placeholder - implement based on your update route
    return { success: false, message: 'Use Inertia form for user updates' };
  };

  const value = {
    user,
    logout,
    updateUser,
    loading: false // Inertia handles loading state
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
