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

  // Detect if message or title contains success/error/pending keywords for styling
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
  const isPending = combinedText.includes('pending') || 
                    combinedText.includes('pending approval') ||
                    combinedText.includes('account pending');

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

  // For pending/info notifications, use banner style in modal
  const useBannerStyle = isPending || (!isSuccess && !isError);

  // Calculate footer and button classes
  const footerBgClass = useBannerStyle 
    ? 'bg-white' 
    : isPending 
    ? 'bg-gray-100 border-t border-gray-200' 
    : 'bg-gray-50 border-t border-gray-200';
  
  const buttonClass = isSuccess 
    ? 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400 shadow-sm' 
    : isError
    ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400 shadow-sm'
    : isPending || useBannerStyle
    ? 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400 shadow-sm'
    : 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 shadow-sm';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-30 transition-opacity duration-200"
      style={{ 
        opacity: isVisible ? 1 : 0 
      }}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-lg shadow-2xl w-full mx-4 transition-all duration-200 overflow-hidden ${
          isPending ? 'max-w-xs' : 'max-w-sm'
        }`}
        style={{ 
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-10px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Header - Green Banner Style */}
        {isSuccess && (
          <div className="bg-green-50 border-b-2 border-b-green-300 rounded-t-lg px-4 py-3 flex items-start gap-3">
            <div className="bg-green-500 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-gray-900 mb-1">
                {title || 'Success'}
              </h2>
            </div>
          </div>
        )}

        {/* Error Header - Red Banner Style */}
        {isError && !isSuccess && (
          <div className="bg-red-50 border-b-2 border-b-red-300 rounded-t-lg px-4 py-3 flex items-start gap-3">
            <div className="bg-red-500 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-gray-900 mb-1">
                {title || 'Error'}
              </h2>
            </div>
          </div>
        )}

        {/* Banner-style for Info/Pending notifications */}
        {useBannerStyle && !isSuccess && !isError && (
          <div className="bg-blue-50 border-b-2 border-b-blue-300 rounded-t-lg px-4 py-3 flex items-start gap-3">
            <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">i</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-gray-900 mb-1">
                {title || 'Notification'}
              </h2>
              {!temporaryPassword && !hasAutoClose && baseMessage && (
                <>
                  {isPending && baseMessage.includes('Please contact') ? (
                    <div className="text-xs text-gray-700 leading-relaxed space-y-1.5">
                      <p>
                        {baseMessage.split(' Please contact')[0]}
                      </p>
                      <p>
                        Please contact{baseMessage.split('Please contact')[1]}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {baseMessage}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Message Content - Only show if not using banner style or has password */}
        {(!useBannerStyle || temporaryPassword) && (
          <div className={`px-4 bg-white ${!temporaryPassword && !hasAutoClose ? 'py-4' : 'py-3'}`}>
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
                        : isPending
                        ? 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400 shadow-sm'
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
        )}

        {/* Footer - OK Button (only when no password and no auto-close) */}
        {/* DO NOT show OK button if hasAutoClose is true */}
        {!temporaryPassword && hasAutoClose === false && (
          <div className={`px-4 py-2 flex justify-end ${footerBgClass}`}>
            <button
              onClick={handleClose}
              className={`px-4 py-1 text-xs font-bold uppercase tracking-wide transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md ${buttonClass}`}
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

