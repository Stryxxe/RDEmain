import React from 'react';

const CheckboxGroup = ({ 
  label, 
  options, 
  selectedValues, 
  onChange, 
  required = false, 
  hint = '', 
  columns = 1 
}) => {
  const getGridClass = () => {
    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default: return 'grid-cols-1';
    }
  };

  return (
    <div className="mb-6">
      <label className="block font-semibold text-gray-900 mb-2 text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className={`grid gap-3 ${getGridClass()}`}>
        {options.map((option, index) => (
          <label 
            key={index} 
            className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={(e) => onChange(option, e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="leading-relaxed">{option}</span>
          </label>
        ))}
      </div>
      
      {hint && (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
};

export default CheckboxGroup;
