import React from 'react';

const FileUpload = ({ 
  label, 
  onChange, 
  required = false, 
  hint = '', 
  accept = '.pdf,.doc,.docx' 
}) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onChange(file);
    }
  };

  return (
    <div className="mb-6">
      <label className="block font-semibold text-gray-900 mb-2 text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="flex items-center gap-4">
        <input
          type="file"
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
          id={`file-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
        <label
          htmlFor={`file-${label.toLowerCase().replace(/\s+/g, '-')}`}
          className="bg-red-600 text-white py-2.5 px-5 rounded-md cursor-pointer text-sm font-medium transition-colors hover:bg-red-700"
        >
          Choose File
        </label>
        <span className="text-gray-600 text-sm">
          {accept ? `Accepted formats: ${accept}` : 'All files accepted'}
        </span>
      </div>
      
      {hint && (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
