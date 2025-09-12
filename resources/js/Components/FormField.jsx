import React from 'react';
import { X } from 'lucide-react';

const FormField = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  hint = '', 
  type = 'text',
  options = []
}) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="mb-6">
      <label className="block font-semibold text-gray-900 mb-2 text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {type === 'select' ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white cursor-pointer pr-10"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '16px'
            }}
          >
            {options.map((option, index) => (
              <option 
                key={index} 
                value={option.value}
                className="py-2 text-sm"
              >
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        )}
        
        {type !== 'select' && value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {hint && (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
};

export default FormField;
