import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

const SimpleConfirm = ({ message, onConfirm, onCancel, title = null }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleConfirm = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onConfirm();
    }, 200);
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onCancel();
    }, 200);
  }, [onCancel]);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  // Determine alert type from title or message - use red for deletions/warnings
  // Exclude activation confirmations from warning style
  const isActivation = title?.toLowerCase().includes('activation');
  const isWarning = !isActivation && (
                    title?.toLowerCase().includes('warning') || 
                    title?.toLowerCase().includes('delete') ||
                    title?.toLowerCase().includes('deletion') ||
                    message?.toLowerCase().includes('delete') ||
                    message?.toLowerCase().includes('cannot be undone')
                  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div 
        className={`relative bg-white rounded-lg shadow-2xl max-w-md w-full transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-3 rounded-t-lg ${
          isWarning 
            ? 'bg-red-600' 
            : 'bg-gray-600'
        }`}>
          <div className="flex items-center gap-2">
            {isWarning ? (
              <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-white flex-shrink-0" />
            )}
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              {title || 'Confirm Action'}
            </h3>
          </div>
        </div>

        {/* Message Content */}
        <div className="px-5 py-4 bg-white">
          <p className="text-sm text-gray-700 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer - Buttons */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-6 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-2 text-sm font-bold uppercase tracking-wide transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md ${
              isWarning
                ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm'
                : 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 shadow-sm'
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleConfirm;

