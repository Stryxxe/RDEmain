import React, { useState, useRef, useEffect } from 'react';
import { Upload, Plus, X } from 'lucide-react';
import FileIcon from './FileIcon';

const DragDropUpload = ({ 
  onFileSelect, 
  acceptedTypes = 'PDF, DOC, DOCX', 
  maxSize = '5MB',
  selectedFile = null
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState(selectedFile);
  const fileInputRef = useRef(null);

  // Sync with parent state
  useEffect(() => {
    setFile(selectedFile);
  }, [selectedFile]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const parseMaxSize = (maxSizeStr) => {
    const match = maxSizeStr.match(/(\d+)(MB|KB|GB)/i);
    if (!match) return 5 * 1024 * 1024; // Default 5MB
    const size = parseInt(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === 'MB') return size * 1024 * 1024;
    if (unit === 'KB') return size * 1024;
    if (unit === 'GB') return size * 1024 * 1024 * 1024;
    return 5 * 1024 * 1024;
  };

  const validateFile = (file) => {
    const maxSizeBytes = parseMaxSize(maxSize);
    if (file.size > maxSizeBytes) {
      alert(`File size exceeds the maximum allowed size of ${maxSize}. Please select a smaller file.`);
      return false;
    }
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const selectedFile = files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        onFileSelect(selectedFile);
      }
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        onFileSelect(selectedFile);
      } else {
        // Reset input
        if (e.target) {
          e.target.value = '';
        }
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200 ${
          file
            ? 'border-green-300 bg-green-50'
            : isDragOver
            ? 'border-red-600 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-red-600 hover:bg-gray-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {file ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <FileIcon fileName={file.name} size="w-16 h-16" />
              <button
                onClick={handleRemoveFile}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-green-600 text-base font-medium mb-1">
              File Selected
            </p>
            <p className="text-gray-600 text-sm font-medium mb-1">
              {file.name}
            </p>
            <p className="text-gray-500 text-xs">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Click to change file
            </p>
          </div>
        ) : (
          <div>
            <div className="relative inline-block mb-4 text-gray-400">
              <Upload className="w-12 h-12" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center">
                <Plus className="w-3 h-3" />
              </div>
            </div>
            
            <p className="text-red-600 text-base font-medium mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-gray-500 text-sm">
              {acceptedTypes} (Max size: {maxSize})
            </p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          className="hidden"
          accept=".pdf,.doc,.docx"
        />
      </div>
    </div>
  );
};

export default DragDropUpload;
