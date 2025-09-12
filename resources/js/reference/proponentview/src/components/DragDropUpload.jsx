import React, { useState, useRef } from 'react';
import { Upload, Plus } from 'lucide-react';

const DragDropUpload = ({ 
  onFileSelect, 
  acceptedTypes = 'PDF, DOC, DOCX', 
  maxSize = '10MB' 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
      setSelectedFile(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
      setSelectedFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-red-600 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-red-600 hover:bg-gray-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
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
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          className="hidden"
          accept=".pdf,.doc,.docx"
        />
      </div>
      
      {selectedFile && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
          Selected file: {selectedFile.name}
        </div>
      )}
    </div>
  );
};

export default DragDropUpload;
