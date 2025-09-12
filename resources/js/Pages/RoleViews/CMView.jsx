import React from 'react';
import RoleBasedLayout from '../../Components/Layouts/RoleBasedLayout';

const CMView = () => {
  return (
    <RoleBasedLayout roleName="College of Medicine">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">College of Medicine Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Medical Research</h3>
            <p className="text-blue-600">Review medical research proposals</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Faculty Proposals</h3>
            <p className="text-green-600">Manage faculty research proposals</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Clinical Studies</h3>
            <p className="text-purple-600">Oversee clinical research studies</p>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Medical Research Status</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">No active medical research projects</p>
          </div>
        </div>
      </div>
    </RoleBasedLayout>
  );
};

export default CMView;
