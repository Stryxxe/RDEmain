<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class OptimizedNotificationController extends Controller
{
    /**
     * Get cache key for request deduplication
     */
    private function getCacheKey($user, $endpoint, $params = [])
    {
        $key = "notif_{$endpoint}_{$user->userID}_" . md5(serialize($params));
        return $key;
    }

    /**
     * Request deduplication wrapper
     */
    private function deduplicateRequest($cacheKey, $callback, $ttl = 30)
    {
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        $result = $callback();
        Cache::put($cacheKey, $result, $ttl);
        
        return $result;
    }

    public function index(Request $request): JsonResponse
    {
        // Debug: Check if user is authenticated
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
                'debug' => [
                    'session_id' => $request->session()->getId(),
                    'has_session' => $request->hasSession(),
                    'auth_check' => auth()->check(),
                    'auth_user' => auth()->user() ? 'exists' : 'null',
                ]
            ], 401);
        }
        
        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        $page = $request->get('page', 1);
        
        $cacheKey = $this->getCacheKey($user, 'index', ['per_page' => $perPage, 'page' => $page]);
        
        $result = $this->deduplicateRequest($cacheKey, function () use ($user, $perPage) {
            $notifications = Notification::where('userID', $user->userID)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);
                
            // Transform the data to ensure proper timestamp formatting
            $notifications->getCollection()->transform(function ($notification) {
                return [
                    'id' => $notification->id,
                    'userID' => $notification->userID,
                    'type' => $notification->type,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'data' => $notification->data,
                    'read' => $notification->read,
                    'read_at' => $notification->read_at ? $notification->read_at->toISOString() : null,
                    'created_at' => $notification->created_at->toISOString(),
                    'updated_at' => $notification->updated_at->toISOString(),
                    'timestamp' => $notification->created_at->toISOString(),
                ];
            });
            
            return $notifications;
        });
            
        return response()->json([
            'success' => true,
            'data' => $result->items(),
            'pagination' => [
                'current_page' => $result->currentPage(),
                'last_page' => $result->lastPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
                'from' => $result->firstItem(),
                'to' => $result->lastItem(),
            ]
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        if (!$request->user()) {
            return response()->json(['count' => 0], 401);
        }
        
        $user = $request->user();
        
        $cacheKey = $this->getCacheKey($user, 'unread_count');
        
        $count = $this->deduplicateRequest($cacheKey, function () use ($user) {
            return Notification::where('userID', $user->userID)
                ->where('read', false)
                ->count();
        }, 10); // Shorter cache for unread count
            
        return response()->json(['count' => $count]);
    }

    public function markAsRead(Request $request, $id): JsonResponse
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        
        $user = $request->user();
        $notification = Notification::where('userID', $user->userID)
            ->where('id', $id)
            ->firstOrFail();
            
        $notification->markAsRead();

        // Clear user caches after marking as read
        $this->clearUserCaches($user);
        
        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        
        $user = $request->user();
        Notification::where('userID', $user->userID)
            ->where('read', false)
            ->update([
                'read' => true,
                'read_at' => now()
            ]);

        // Clear user caches after marking all as read
        $this->clearUserCaches($user);
            
        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        
        $user = $request->user();
        $notification = Notification::where('userID', $user->userID)
            ->where('id', $id)
            ->firstOrFail();
            
        $notification->delete();

        // Clear user caches after deletion
        $this->clearUserCaches($user);
        
        return response()->json(['message' => 'Notification deleted']);
    }

    /**
     * Clear all caches for a user
     */
    private function clearUserCaches($user): void
    {
        $patterns = [
            "notif_*_{$user->userID}_*"
        ];
        
        foreach ($patterns as $pattern) {
            $keys = Cache::getRedis()->keys($pattern);
            if (!empty($keys)) {
                Cache::getRedis()->del($keys);
            }
        }
    }
}
