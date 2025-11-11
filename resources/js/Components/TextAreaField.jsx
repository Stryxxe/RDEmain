import React from 'react';

const TextAreaField = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  hint = '', 
  rows = 4,
  maxWords = null
}) => {
  // Count words in the text
  const countWords = (text) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const wordCount = countWords(value);
  const isOverLimit = maxWords && wordCount > maxWords;

  const handleChange = (e) => {
    const newValue = e.target.value;
    
    // If maxWords is set, enforce the limit
    if (maxWords) {
      const words = newValue.trim().split(/\s+/).filter(word => word.length > 0);
      if (words.length > maxWords) {
        // Get the text up to the maxWords limit
        let limitedText = '';
        let wordCount = 0;
        const textParts = newValue.split(/\s+/);
        
        for (let i = 0; i < textParts.length; i++) {
          if (textParts[i].trim().length > 0) {
            if (wordCount >= maxWords) {
              break;
            }
            wordCount++;
          }
          limitedText += (i > 0 ? ' ' : '') + textParts[i];
        }
        
        onChange(limitedText);
        return;
      }
    }
    
    onChange(newValue);
  };

  return (
    <div className="mb-6">
      <label className="block font-semibold text-gray-900 mb-2 text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {maxWords && (
          <span className="text-xs font-normal text-gray-500 ml-2">
            ({wordCount}/{maxWords} words)
          </span>
        )}
      </label>
      
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-4 py-3 border rounded-md text-sm font-inherit resize-vertical min-h-[100px] transition-colors focus:outline-none focus:ring-2 focus:border-transparent leading-relaxed ${
          isOverLimit 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-red-500'
        }`}
      />
      
      {hint && (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          {hint}
        </p>
      )}
      
      {maxWords && isOverLimit && (
        <p className="text-xs text-red-500 mt-1">
          Maximum {maxWords} words allowed. Please reduce your text.
        </p>
      )}
    </div>
  );
};

export default TextAreaField;
