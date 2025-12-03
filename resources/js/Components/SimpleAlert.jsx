import React, { useEffect, useState, useCallback } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

const SimpleAlert = ({ message, onClose, title = null, autoClose = null }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  
  // Normalize autoClose to ensure it's a number or null
  // Check if autoClose is a valid number greater than 0
  const hasAutoClose = React.useMemo(() => {
    if (autoClose === null || autoClose === undefined || autoClose === false) return false;
    const numValue = Number(autoClose);
    const result = !isNaN(numValue) && numValue > 0;
    // Debug log (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log('SimpleAlert autoClose check:', { autoClose, numValue, result });
    }
    return result;
  }, [autoClose]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);
    
    // Auto-close if specified
    if (hasAutoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, handleClose, hasAutoClose]);

  useEffect(() => {
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  // Get site name from window location
  const siteName = title || `${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;

  // Extract password from message if it contains "Temporary password:"
  const passwordMatch = message.match(/Temporary password:\s*([^\s]+)/i);
  const temporaryPassword = passwordMatch ? passwordMatch[1] : null;
  // Remove both the base message and "User added successfully!" if password exists
  const baseMessage = temporaryPassword 
    ? message.replace(/User added successfully!?\s*/i, '').replace(/Temporary password:\s*[^\s]+/i, '').trim()
    : message;

  // Detect if message or title contains success/error keywords for styling
  const messageText = (message || '').toLowerCase();
  const titleText = (title || '').toLowerCase();
  const combinedText = `${messageText} ${titleText}`.trim();
  
  const isSuccess = combinedText.includes('successfully') || 
                    combinedText.includes('success') ||
                    combinedText.includes('added') ||
                    combinedText.includes('created') ||
                    combinedText.includes('updated') ||
                    combinedText.includes('endorsed');
  const isError = combinedText.includes('error') || 
                  combinedText.includes('failed') ||
                  combinedText.includes('invalid');

  const handleCopyPassword = async () => {
    if (temporaryPassword) {
      try {
        await navigator.clipboard.writeText(temporaryPassword);
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy password:', err);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-30 transition-opacity duration-200"
      style={{ 
        opacity: isVisible ? 1 : 0 
      }}
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-sm w-full mx-4 transition-all duration-200 overflow-hidden"
        style={{ 
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-10px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Green for success */}
        {isSuccess && (
          <div className="bg-green-600 px-5 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{title || 'User Added Successfully!'}</h2>
              </div>
            </div>
          </div>
        )}

        {/* Error Header - Red */}
        {isError && !isSuccess && (
          <div className="bg-red-600 px-5 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Error</h2>
              </div>
            </div>
          </div>
        )}

        {/* Default Header - Gray */}
        {!isSuccess && !isError && (
          <div className="bg-gray-600 px-5 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Notification</h2>
              </div>
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className={`px-5 bg-white ${!temporaryPassword && !hasAutoClose ? 'py-4' : 'py-3'}`}>
          {!temporaryPassword && !hasAutoClose && baseMessage && (
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              {baseMessage}
            </p>
          )}
          
          {/* Show minimal padding when auto-close and no message */}
          {!temporaryPassword && hasAutoClose && !baseMessage && (
            <div className="min-h-[20px]"></div>
          )}

          {/* Password Field and OK Button in same div */}
          {temporaryPassword && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Temporary Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={temporaryPassword}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={handleCopyPassword}
                      className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                      type="button"
                      title="Copy password"
                    >
                      {passwordCopied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {!hasAutoClose && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleClose}
                    className={`px-6 py-2 text-sm font-bold uppercase tracking-wide transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md ${
                      isSuccess 
                        ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-sm' 
                        : isError
                        ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm'
                        : 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 shadow-sm'
                    }`}
                  >
                    OK
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - OK Button (only when no password and no auto-close) */}
        {/* DO NOT show OK button if hasAutoClose is true */}
        {!temporaryPassword && hasAutoClose === false && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleClose}
              className={`px-6 py-2 text-sm font-bold uppercase tracking-wide transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md ${
                isSuccess 
                  ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-sm' 
                  : isError
                  ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm'
                  : 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 shadow-sm'
              }`}
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleAlert;

