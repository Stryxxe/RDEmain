<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use App\Models\User;

class CacheService
{
    /**
     * Clear all caches related to a user
     */
    public static function clearUserCaches(User $user): void
    {
        $patterns = [
            "msg_*_{$user->userID}_*",
            "notif_*_{$user->userID}_*",
            "dedup_*_{$user->userID}_*",
            "department_users_{$user->departmentID}",
            "available_cm_{$user->departmentID}"
        ];
        
        foreach ($patterns as $pattern) {
            try {
                if (Cache::getStore() instanceof \Illuminate\Cache\RedisStore) {
                    $keys = Cache::getRedis()->keys($pattern);
                    if (!empty($keys)) {
                        Cache::getRedis()->del($keys);
                    }
                } else {
                    // For non-Redis drivers, clear by specific keys
                    self::clearCacheByPattern($pattern);
                }
            } catch (\Exception $e) {
                // Log error but don't fail the operation
                \Log::warning("Failed to clear cache pattern {$pattern}: " . $e->getMessage());
            }
        }
    }

    /**
     * Clear cache by pattern for non-Redis drivers
     */
    private static function clearCacheByPattern(string $pattern): void
    {
        // For non-Redis drivers, we'll clear common cache keys
        // This is a simplified approach - in production, you might want to track cache keys
        $commonKeys = [
            'msg_index_',
            'msg_sent_',
            'msg_unread_count_',
            'msg_conversations_',
            'notif_index_',
            'notif_unread_count_',
            'department_users_',
            'available_cm_'
        ];
        
        foreach ($commonKeys as $key) {
            if (str_contains($pattern, $key)) {
                Cache::forget($key);
            }
        }
    }

    /**
     * Clear department-related caches
     */
    public static function clearDepartmentCaches(int $departmentId): void
    {
        $patterns = [
            "department_users_{$departmentId}",
            "available_cm_{$departmentId}"
        ];
        
        foreach ($patterns as $pattern) {
            try {
                if (Cache::getStore() instanceof \Illuminate\Cache\RedisStore) {
                    $keys = Cache::getRedis()->keys($pattern);
                    if (!empty($keys)) {
                        Cache::getRedis()->del($keys);
                    }
                } else {
                    self::clearCacheByPattern($pattern);
                }
            } catch (\Exception $e) {
                \Log::warning("Failed to clear department cache pattern {$pattern}: " . $e->getMessage());
            }
        }
    }

    /**
     * Clear all message-related caches
     */
    public static function clearMessageCaches(): void
    {
        $patterns = [
            "msg_*",
            "dedup_*_api/messages*"
        ];
        
        foreach ($patterns as $pattern) {
            try {
                if (Cache::getStore() instanceof \Illuminate\Cache\RedisStore) {
                    $keys = Cache::getRedis()->keys($pattern);
                    if (!empty($keys)) {
                        Cache::getRedis()->del($keys);
                    }
                } else {
                    self::clearCacheByPattern($pattern);
                }
            } catch (\Exception $e) {
                \Log::warning("Failed to clear message cache pattern {$pattern}: " . $e->getMessage());
            }
        }
    }

    /**
     * Clear all notification-related caches
     */
    public static function clearNotificationCaches(): void
    {
        $patterns = [
            "notif_*",
            "dedup_*_api/notifications*"
        ];
        
        foreach ($patterns as $pattern) {
            try {
                if (Cache::getStore() instanceof \Illuminate\Cache\RedisStore) {
                    $keys = Cache::getRedis()->keys($pattern);
                    if (!empty($keys)) {
                        Cache::getRedis()->del($keys);
                    }
                } else {
                    self::clearCacheByPattern($pattern);
                }
            } catch (\Exception $e) {
                \Log::warning("Failed to clear notification cache pattern {$pattern}: " . $e->getMessage());
            }
        }
    }

    /**
     * Get cache statistics
     */
    public static function getCacheStats(): array
    {
        try {
            if (Cache::getStore() instanceof \Illuminate\Cache\RedisStore) {
                $redis = Cache::getRedis();
                $info = $redis->info();
                
                return [
                    'driver' => 'Redis',
                    'used_memory' => $info['used_memory_human'] ?? 'Unknown',
                    'connected_clients' => $info['connected_clients'] ?? 'Unknown',
                    'total_commands_processed' => $info['total_commands_processed'] ?? 'Unknown',
                    'keyspace_hits' => $info['keyspace_hits'] ?? 'Unknown',
                    'keyspace_misses' => $info['keyspace_misses'] ?? 'Unknown',
                ];
            } else {
                return [
                    'driver' => get_class(Cache::getStore()),
                    'status' => 'Cache driver does not support statistics',
                    'note' => 'Consider using Redis for better performance monitoring'
                ];
            }
        } catch (\Exception $e) {
            return ['error' => 'Unable to retrieve cache statistics: ' . $e->getMessage()];
        }
    }

    /**
     * Warm up frequently accessed caches
     */
    public static function warmUpCaches(): void
    {
        // This could be called during deployment or maintenance
        // to pre-populate commonly accessed data
        
        try {
            // Get all departments and warm up their user lists
            $departments = \App\Models\Department::all();
            foreach ($departments as $department) {
                $users = \App\Models\User::where('departmentID', $department->departmentID)
                    ->pluck('userID')
                    ->toArray();
                
                Cache::put("department_users_{$department->departmentID}", $users, 300);
            }
            
            \Log::info('Cache warm-up completed successfully');
        } catch (\Exception $e) {
            \Log::error('Cache warm-up failed: ' . $e->getMessage());
        }
    }
}
