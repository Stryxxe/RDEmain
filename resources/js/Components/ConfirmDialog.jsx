import React from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiHelpCircle } from "react-icons/fi";

const ConfirmDialog = ({
    isOpen,
    title,
    message,
    type = "warning", // warning, success, info, error
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    isDangerous = false, // Make confirm button red if dangerous action
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case "warning":
                return <FiAlertCircle className="w-7 h-7 text-yellow-500" />;
            case "error":
                return <FiAlertCircle className="w-7 h-7 text-red-500" />;
            case "success":
                return <FiCheckCircle className="w-7 h-7 text-green-500" />;
            case "info":
                return <FiInfo className="w-7 h-7 text-blue-500" />;
            default:
                return <FiHelpCircle className="w-7 h-7 text-gray-400" />;
        }
    };

    const getIconBgColor = () => {
        switch (type) {
            case "warning":
                return "bg-yellow-600 bg-opacity-20";
            case "error":
                return "bg-red-600 bg-opacity-20";
            case "success":
                return "bg-green-600 bg-opacity-20";
            case "info":
                return "bg-blue-600 bg-opacity-20";
            default:
                return "bg-gray-600 bg-opacity-20";
        }
    };

    const getConfirmButtonColor = () => {
        if (isDangerous) return "bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-red-600/20";
        
        switch (type) {
            case "warning":
                return "bg-yellow-600 hover:bg-yellow-700";
            case "error":
                return "bg-red-600 hover:bg-red-700";
            case "success":
                return "bg-green-600 hover:bg-green-700";
            case "info":
                return "bg-blue-600 hover:bg-blue-700";
            default:
                return "bg-primary-600 hover:bg-primary-700";
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-700">
                {/* Icon */}
                <div className={`flex items-center justify-center mb-6 w-14 h-14 ${getIconBgColor()} rounded-full mx-auto`}>
                    {getIcon()}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white text-center mb-2">
                    {title}
                </h2>

                {/* Message */}
                <p className="text-gray-400 text-center mb-8">
                    {message}
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 transition-colors duration-200"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-lg transition-colors duration-200 ${getConfirmButtonColor()}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
