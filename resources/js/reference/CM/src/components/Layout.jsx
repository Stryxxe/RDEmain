import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useSidebar } from '../context/SidebarContext';

const Layout = ({ children }) => {
  const { isSidebarVisible } = useSidebar();

  return (
    <div className="min-h-screen">
      {/* Fixed top header */}
      <div className="fixed inset-x-0 top-0 z-30">
        <Header />
      </div>

      {/* Sidebar under the header - conditionally rendered */}
      {isSidebarVisible && (
        <div className="fixed left-0 top-20 bottom-0 w-64 z-20">
          <Sidebar />
        </div>
      )}

      {/* Main content area with conditional padding for header and sidebar */}
      <div className={`pt-20 min-h-screen ${isSidebarVisible ? 'pl-64' : 'pl-0'}`}>
        <main className="bg-gray-50 p-5 min-h-screen overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;