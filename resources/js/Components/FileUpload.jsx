import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import FileIcon from './FileIcon';

const FileUpload = ({ 
  label, 
  onChange, 
  required = false, 
  hint = '', 
  accept = '.pdf,.doc,.docx',
  selectedFile = null
}) => {
  const [file, setFile] = useState(selectedFile);
  const fileInputRef = useRef(null);

  // Sync with parent state
  useEffect(() => {
    setFile(selectedFile);
  }, [selectedFile]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
      const mimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      const isValidType = allowedTypes.includes(fileExtension) || 
                         mimeTypes.includes(selectedFile.type) ||
                         selectedFile.type === ''; // Some browsers don't set MIME type
      
      if (!isValidType) {
        alert(`Invalid file type. Please select a PDF, DOC, or DOCX file.`);
        e.target.value = ''; // Reset input
        return;
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > maxSize) {
        alert(`File size exceeds 5MB limit. Please select a smaller file.`);
        e.target.value = ''; // Reset input
        return;
      }
      
      // Validate file is not empty
      if (selectedFile.size === 0) {
        alert(`File is empty. Please select a valid file.`);
        e.target.value = ''; // Reset input
        return;
      }
      
      setFile(selectedFile);
      onChange(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-6">
      <label className="block font-semibold text-gray-900 mb-2 text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {file ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileIcon fileName={file.name} size="w-8 h-8" />
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleButtonClick}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Change
              </button>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleButtonClick}
            className="bg-red-600 text-white py-2.5 px-5 rounded-md cursor-pointer text-sm font-medium transition-colors hover:bg-red-700"
          >
            Choose File
          </button>
          <span className="text-gray-600 text-sm">
            {accept ? `Accepted formats: ${accept}` : 'All files accepted'}
          </span>
        </div>
      )}
      
      {hint && (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
