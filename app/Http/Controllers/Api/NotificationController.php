<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        
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
                'timestamp' => $notification->created_at->toISOString(), // For backward compatibility
            ];
        });
            
        return response()->json($notifications);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = Notification::where('userID', $user->userID)
            ->where('read', false)
            ->count();
            
        return response()->json(['count' => $count]);
    }

    public function markAsRead(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $notification = Notification::where('userID', $user->userID)
            ->where('id', $id)
            ->firstOrFail();
            
        $notification->markAsRead();
        
        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        Notification::where('userID', $user->userID)
            ->where('read', false)
            ->update([
                'read' => true,
                'read_at' => now()
            ]);
            
        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $notification = Notification::where('userID', $user->userID)
            ->where('id', $id)
            ->firstOrFail();
            
        $notification->delete();
        
        return response()->json(['message' => 'Notification deleted']);
    }
}
