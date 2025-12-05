import React from 'react';

const CheckboxGroup = ({ 
  label, 
  options, 
  selectedValues = [],
  selectedOptions = [],
  onChange, 
  required = false, 
  hint = '', 
  columns = 1 
}) => {
  // Support both selectedValues and selectedOptions prop names
  // Ensure we use the prop that was actually passed
  const selected = (selectedOptions && selectedOptions.length >= 0) ? selectedOptions : selectedValues;
  
  console.log('CheckboxGroup render:', { label, selected, selectedOptions, selectedValues });
  
  const getGridClass = () => {
    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default: return 'grid-cols-1';
    }
  };

  const handleChange = (option, checked) => {
    console.log('CheckboxGroup handleChange:', { option, checked, selected });
    if (checked) {
      // Add option
      const newSelection = [...selected, option];
      console.log('Adding option, new selection:', newSelection);
      onChange(newSelection);
    } else {
      // Remove option
      const newSelection = selected.filter(item => item !== option);
      console.log('Removing option, new selection:', newSelection);
      onChange(newSelection);
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
              checked={selected.includes(option)}
              onChange={(e) => handleChange(option, e.target.checked)}
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
