<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Services\ActivityService;
use App\Services\BackupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class SettingController extends Controller
{
    /**
     * Get all settings
     */
    public function index()
    {
        try {
            $settings = Setting::all()->mapWithKeys(function ($setting) {
                return [$setting->key => $this->castValue($setting->value, $setting->type)];
            });

            return response()->json([
                'success' => true,
                'data' => $settings,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch settings: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific setting
     */
    public function show($key)
    {
        try {
            $value = Setting::get($key);

            if ($value === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Setting not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $value,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch setting: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update settings
     */
    public function update(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'settings' => 'required|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $settings = $request->input('settings');
            $updatedSettings = [];

            foreach ($settings as $key => $value) {
                // Get old value before updating
                $oldValue = Setting::get($key);
                
                // Determine type
                $type = 'string';
                $newValue = $value;
                if (is_int($value)) {
                    $type = 'integer';
                } elseif (is_bool($value)) {
                    $type = 'boolean';
                    $newValue = $value ? '1' : '0';
                } elseif (is_array($value)) {
                    $type = 'json';
                    $newValue = json_encode($value);
                }

                // Only track if value actually changed
                if ($oldValue != $newValue) {
                    $updatedSettings[$key] = [
                        'old' => $oldValue,
                        'new' => $newValue
                    ];
                }

                Setting::set($key, $newValue, $type);
            }

            // Log the settings change only if something changed
            if (!empty($updatedSettings)) {
                ActivityService::logSettingsChange($updatedSettings);
            }

            return response()->json([
                'success' => true,
                'message' => 'Settings updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cast value based on type
     */
    private function castValue($value, string $type)
    {
        return match($type) {
            'integer' => (int) $value,
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($value, true),
            default => $value,
        };
    }

    /**
     * Trigger manual backup
     */
    public function triggerBackup(Request $request, BackupService $backupService)
    {
        try {
            // Validate admin authorization
            if (!$this->isAdminUser()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: Only admins can trigger backups',
                ], 403);
            }

            // Get backup path from settings
            $backupPath = Setting::get('backupStorageLocation');

            if (empty($backupPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup storage location not configured. Please set it in System Settings.',
                ], 400);
            }

            // Determine if duplicates should be scanned
            $scanForDuplicates = $request->input('scan_for_duplicates', true);

            // Execute backup
            $result = $backupService->createBackup($backupPath, $scanForDuplicates);

            // Log the backup activity
            if ($result['success']) {
                Log::info('Manual backup triggered successfully', $result['data']);
                
                ActivityService::log(
                    'backup_triggered',
                    'Manual backup initiated',
                    'System',
                    null,
                    null,
                    $result['data'] ?? null
                );
            }

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Backup trigger error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to trigger backup: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Scan backup folder for existing backups
     */
    public function scanBackupFolder(Request $request, BackupService $backupService)
    {
        try {
            // Validate admin authorization
            if (!$this->isAdminUser()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: Only admins can scan backups',
                ], 403);
            }

            // Get backup path from settings or request
            $backupPath = $request->input('backup_path') ?? Setting::get('backupStorageLocation');

            if (empty($backupPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup path not provided or configured',
                ], 400);
            }

            if (!is_dir($backupPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup folder does not exist: ' . $backupPath,
                ], 404);
            }

            // Scan for existing backups
            $existingBackups = $backupService->scanExistingBackups($backupPath);

            return response()->json([
                'success' => true,
                'message' => 'Backup folder scanned successfully',
                'data' => [
                    'backup_path' => $backupPath,
                    'existing_backups_count' => count($existingBackups),
                    'backups' => $existingBackups,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Backup scan error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to scan backup folder: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get backup status and statistics
     */
    public function getBackupStatus(Request $request)
    {
        try {
            // Validate admin authorization
            if (!$this->isAdminUser()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 403);
            }

            $backupPath = Setting::get('backupStorageLocation');
            $backupFrequency = Setting::get('backupFrequency');

            $status = [
                'backup_location_configured' => !empty($backupPath),
                'backup_path' => $backupPath,
                'backup_frequency' => $backupFrequency,
                'last_backup' => Setting::get('lastBackupTime'),
                'is_writable' => !empty($backupPath) ? is_writable(dirname($backupPath)) : false,
            ];

            // Get folder statistics if path exists
            if (!empty($backupPath) && is_dir($backupPath)) {
                $status['folder_size'] = $this->getFolderSize($backupPath);
                $status['folder_size_formatted'] = $this->formatBytes($status['folder_size']);
            }

            return response()->json([
                'success' => true,
                'data' => $status,
            ]);
        } catch (\Exception $e) {
            Log::error('Backup status error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to get backup status',
            ], 500);
        }
    }

    /**
     * Get folder size recursively
     */
    private function getFolderSize($path): int
    {
        $size = 0;
        if (is_file($path)) {
            return filesize($path);
        }
        
        $files = scandir($path);
        foreach ($files as $file) {
            if ($file !== '.' && $file !== '..') {
                $filepath = $path . DIRECTORY_SEPARATOR . $file;
                $size += $this->getFolderSize($filepath);
            }
        }
        return $size;
    }

    /**
     * Format bytes to human readable
     */
    private function formatBytes($bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        return round($bytes, 2) . ' ' . $units[$pow];
    }

    /**
     * Check if current authenticated user is admin.
     */
    private function isAdminUser(): bool
    {
        $user = auth()->user();
        if (!$user) {
            return false;
        }

        // Role name stored in related role record (userRolesID => user_roles.userRole)
        if ($user->relationLoaded('role')) {
            return strtolower($user->role->userRole ?? '') === 'admin';
        }

        // Lazy load role
        $role = $user->role()->first();
        return strtolower($role->userRole ?? '') === 'admin';
    }
}

