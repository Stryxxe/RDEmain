import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const hideSidebar = () => setIsSidebarVisible(false);
  const showSidebar = () => setIsSidebarVisible(true);
  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);

  return (
    <SidebarContext.Provider value={{
      isSidebarVisible,
      hideSidebar,
      showSidebar,
      toggleSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  );
};
