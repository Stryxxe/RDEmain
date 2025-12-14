import React from 'react';
import { FileText, File, FileImage, FileSpreadsheet, FileVideo, FileAudio, Archive } from 'lucide-react';

const FileIcon = ({ fileName, size = 'w-6 h-6', className = '' }) => {
  const getFileIcon = (fileName) => {
    if (!fileName) return File;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return FileText;
      case 'doc':
      case 'docx':
        return FileText;
      case 'txt':
      case 'rtf':
        return FileText;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return FileImage;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return FileSpreadsheet;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return FileVideo;
      case 'mp3':
      case 'wav':
      case 'flac':
        return FileAudio;
      case 'zip':
      case 'rar':
      case '7z':
        return Archive;
      default:
        return File;
    }
  };

  const getFileColor = (fileName) => {
    if (!fileName) return 'text-gray-500';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'text-red-500';
      case 'doc':
      case 'docx':
        return 'text-blue-500';
      case 'txt':
      case 'rtf':
        return 'text-gray-500';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return 'text-green-500';
      case 'xls':
      case 'xlsx':
      case 'csv':
        return 'text-green-600';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return 'text-purple-500';
      case 'mp3':
      case 'wav':
      case 'flac':
        return 'text-orange-500';
      case 'zip':
      case 'rar':
      case '7z':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const IconComponent = getFileIcon(fileName);
  const colorClass = getFileColor(fileName);

  return (
    <IconComponent 
      className={`${size} ${colorClass} ${className}`} 
    />
  );
};

export default FileIcon;
