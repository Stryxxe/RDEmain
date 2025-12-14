<?php

namespace App\Helpers;

use Illuminate\Support\Facades\File;

class SettingsHelper
{
    /**
     * Get the maximum file upload size in MB from settings
     * 
     * @return int Maximum file size in MB (default: 50MB)
     */
    public static function getMaxFileSizeMB(): int
    {
        $path = storage_path('app/settings.json');
        
        if (!File::exists($path)) {
            return 50; // Default 50MB
        }
        
        $settings = json_decode(File::get($path), true);
        
        if (isset($settings['fileStorage']['maxFileSize'])) {
            return (int) $settings['fileStorage']['maxFileSize'];
        }
        
        // Fallback to old format
        if (isset($settings['maxFileSize'])) {
            return (int) $settings['maxFileSize'];
        }
        
        return 50; // Default 50MB
    }
    
    /**
     * Get the maximum file upload size in KB for Laravel validation
     * 
     * @return int Maximum file size in KB
     */
    public static function getMaxFileSizeKB(): int
    {
        return self::getMaxFileSizeMB() * 1024;
    }
    
    /**
     * Get allowed file types from settings
     * 
     * @return array Array of allowed file extensions
     */
    public static function getAllowedFileTypes(): array
    {
        $path = storage_path('app/settings.json');
        
        if (!File::exists($path)) {
            return ['pdf', 'doc', 'docx', 'xlsx', 'csv', 'png', 'jpg'];
        }
        
        $settings = json_decode(File::get($path), true);
        
        if (isset($settings['fileStorage']['allowedTypes'])) {
            return $settings['fileStorage']['allowedTypes'];
        }
        
        return ['pdf', 'doc', 'docx', 'xlsx', 'csv', 'png', 'jpg'];
    }
}
