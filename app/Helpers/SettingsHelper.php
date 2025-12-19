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
        // 1) DB setting (admin-managed)
        try {
            if (class_exists(\App\Models\Setting::class)) {
                $dbValue = \App\Models\Setting::get('max_file_size', null);
                if (!is_null($dbValue)) {
                    return max(1, min(50, (int) $dbValue));
                }
                // Fallback alternate key (if used)
                $dbValueAlt = \App\Models\Setting::get('maxFileSize', null);
                if (!is_null($dbValueAlt)) {
                    return max(1, min(50, (int) $dbValueAlt));
                }
            }
        } catch (\Throwable $e) {
            // fall through to file/default
        }

        // 2) JSON settings file
        $path = storage_path('app/settings.json');
        
        if (File::exists($path)) {
            $settings = json_decode(File::get($path), true);
            if (isset($settings['fileStorage']['maxFileSize'])) {
                return max(1, min(50, (int) $settings['fileStorage']['maxFileSize']));
            }
            if (isset($settings['maxFileSize'])) {
                return max(1, min(50, (int) $settings['maxFileSize']));
            }
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
