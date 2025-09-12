import React from 'react';

const TextAreaField = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  hint = '', 
  rows = 4 
}) => {
  return (
    <div className="mb-6">
      <label className="block font-semibold text-gray-900 mb-2 text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm font-inherit resize-vertical min-h-[100px] transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent leading-relaxed"
      />
      
      {hint && (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextAreaField;
