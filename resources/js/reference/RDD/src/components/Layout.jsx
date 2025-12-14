import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
        <main className="flex-1 bg-gray-50 p-5 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 