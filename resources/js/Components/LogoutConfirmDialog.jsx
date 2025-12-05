import React from 'react';
import { FiLogOut } from 'react-icons/fi';

const LogoutConfirmDialog = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
                <div className="flex items-center justify-center mb-4">
                    <div className="bg-red-100 p-3 rounded-full">
                        <FiLogOut className="w-6 h-6 text-red-600" />
                    </div>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
                    Logout Confirmation
                </h2>
                
                <p className="text-gray-600 text-center mb-6">
                    Are you sure you want to logout?
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutConfirmDialog;
