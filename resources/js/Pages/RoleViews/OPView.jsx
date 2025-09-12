import React from 'react';
import RoleBasedLayout from '../../Components/Layouts/RoleBasedLayout';

const OPView = () => {
  return (
    <RoleBasedLayout roleName="Office of the President">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Office of the President Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Executive Review</h3>
            <p className="text-blue-600">Review high-level research proposals</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Strategic Planning</h3>
            <p className="text-green-600">Oversee research strategic initiatives</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Policy Decisions</h3>
            <p className="text-purple-600">Make policy-level research decisions</p>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Executive Summary</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">No pending executive reviews</p>
          </div>
        </div>
      </div>
    </RoleBasedLayout>
  );
};

export default OPView;
