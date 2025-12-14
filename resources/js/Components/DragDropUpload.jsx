import React, { useState, useRef, useEffect } from 'react';
import { Upload, Plus, X, ExternalLink, AlertTriangle } from 'lucide-react';
import FileIcon from './FileIcon';

const DragDropUpload = ({
  onFileSelect,
  acceptedTypes = 'PDF, DOC, DOCX',
  maxSize = '5MB',
  selectedFile = null,
  existingFile = null,
  onRemoveExisting,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState(selectedFile);
  const [currentExisting, setCurrentExisting] = useState(existingFile);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Sync with parent state
  useEffect(() => {
    setFile(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    setCurrentExisting(existingFile);
  }, [existingFile]);

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
      setError(`File is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Max allowed: ${maxSize}. Choose a smaller file.`);
      return false;
    }
    setError('');
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const selectedFile = files[0];
      if (validateFile(selectedFile)) {
        setCurrentExisting(null);
        setFile(selectedFile);
        onFileSelect(selectedFile);
      }
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (validateFile(selectedFile)) {
        setCurrentExisting(null);
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

  const handleRemoveExisting = (e) => {
    e.stopPropagation();
    setCurrentExisting(null);
    onRemoveExisting?.();
  };

  const closeError = () => setError('');

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
          file || currentExisting
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
            <div className="relative mb-2">
              <FileIcon fileName={file.name} size="w-10 h-10" />
              <button
                onClick={handleRemoveFile}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-green-600 text-sm font-medium mb-1">
              File Selected
            </p>
            <p className="text-gray-600 text-xs font-medium mb-1 truncate max-w-full px-2">
              {file.name}
            </p>
            <p className="text-gray-500 text-xs">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Click to change
            </p>
          </div>
        ) : currentExisting ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <FileIcon fileName={currentExisting.fileName || 'existing-file'} size="w-10 h-10" />
              <button
                onClick={handleRemoveExisting}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-green-600 text-sm font-medium mb-1">Current File</p>
            <p className="text-gray-600 text-xs font-medium mb-1 truncate max-w-full px-2">
              {currentExisting.fileName || 'Existing file'}
            </p>
            {currentExisting.fileSize && (
              <p className="text-gray-500 text-xs">{(currentExisting.fileSize / 1024 / 1024).toFixed(2)} MB</p>
            )}
            <div className="flex items-center gap-2 text-xs text-red-600 mt-1">
              <ExternalLink className="w-4 h-4" />
              <a
                href={currentExisting.filePath ? `/storage/${currentExisting.filePath}` : '#'}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
                onClick={(e) => {
                  if (!currentExisting.filePath) e.preventDefault();
                }}
              >
                Open current file
              </a>
            </div>
            <p className="text-gray-400 text-xs mt-1">Remove to upload a different file</p>
          </div>
        ) : (
          <div>
            <div className="relative inline-block mb-2 text-gray-400">
              <Upload className="w-8 h-8" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center">
                <Plus className="w-2.5 h-2.5" />
              </div>
            </div>
            
            <p className="text-red-600 text-sm font-medium mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-gray-500 text-xs">
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

      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={closeError}>
          <div
            className="w-full max-w-md rounded-lg bg-white shadow-xl border border-red-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-red-100 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700">File too large</p>
                <p className="text-xs text-gray-500">Max allowed: {maxSize}. Allowed types: {acceptedTypes}.</p>
              </div>
            </div>
            <div className="px-5 py-4 text-sm text-gray-800 space-y-2">
              <p>{error}</p>
              <p className="text-xs text-gray-600">Try compressing the file or choose another under {maxSize}.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
              <button
                type="button"
                onClick={closeError}
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropUpload;
