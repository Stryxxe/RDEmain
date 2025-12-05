import React from "react";
import { FiTrash2 } from "react-icons/fi";

const ConfirmDeleteDialog = ({ isOpen, title, message, onConfirm, onCancel, isDangerous = true }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <FiTrash2 className="w-6 h-6 text-red-600" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                    {title || "Delete Confirmation"}
                </h2>

                {/* Message */}
                <p className="text-gray-600 text-center text-sm mb-6">
                    {message || "Are you sure you want to delete this item?"}
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors duration-200 border border-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md ${
                            isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
                        }`}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteDialog;
