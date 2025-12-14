<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class SimpleOptimizedMessageController extends Controller
{
    /**
     * Get department user IDs for CM users (cached)
     */
    private function getDepartmentUserIds($user): array
    {
        if (!$user->role || $user->role->userRole !== 'CM') {
            return [];
        }

        $cacheKey = "department_users_{$user->departmentID}";
        
        return Cache::remember($cacheKey, 300, function () use ($user) { // 5 minutes cache
            return User::where('departmentID', $user->departmentID)
                ->pluck('userID')
                ->toArray();
        });
    }

    /**
     * Optimized query builder for CM department filtering
     */
    private function buildOptimizedQuery($user, $baseQuery = null)
    {
        if (!$baseQuery) {
            $baseQuery = Message::query();
        }

        if (!$user->role || $user->role->userRole !== 'CM') {
            return $baseQuery;
        }

        $departmentUserIds = $this->getDepartmentUserIds($user);
        
        if (empty($departmentUserIds)) {
            // No users in department, return empty result
            return $baseQuery->whereRaw('1 = 0');
        }

        return $baseQuery->where(function ($query) use ($departmentUserIds) {
            $query->whereIn('senderID', $departmentUserIds)
                  ->orWhereIn('recipientID', $departmentUserIds);
        });
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        
        $query = Message::where('recipientID', $user->getKey());
        $query = $this->buildOptimizedQuery($user, $query);
        
        $messages = $query->with('sender')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
            
        return response()->json([
            'data' => $messages->items(),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ]
        ])->header('Cache-Control', 'no-cache, no-store, must-revalidate')
          ->header('Pragma', 'no-cache')
          ->header('Expires', '0');
    }

    public function sent(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        
        $query = Message::where('senderID', $user->getKey());
        $query = $this->buildOptimizedQuery($user, $query);
        
        $messages = $query->with('recipient')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
            
        return response()->json([
            'data' => $messages->items(),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ]
        ])->header('Cache-Control', 'no-cache, no-store, must-revalidate')
          ->header('Pragma', 'no-cache')
          ->header('Expires', '0');
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $query = Message::where('recipientID', $user->getKey())
            ->where('read', false);
        $query = $this->buildOptimizedQuery($user, $query);
        
        $count = $query->count();
            
        return response()->json(['count' => $count])
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Ensure user has role loaded
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }
        
        $query = Message::where(function ($q) use ($user) {
            $q->where('senderID', $user->getKey())
              ->orWhere('recipientID', $user->getKey());
        });
        
        \Log::info('Conversations query for user', [
            'user_id' => $user->getKey(),
            'user_role' => $user->role?->userRole ?? 'no_role',
            'department_id' => $user->departmentID ?? 'no_department'
        ]);
        
        $query = $this->buildOptimizedQuery($user, $query);
        
        $conversations = $query->with(['sender.role', 'sender.department', 'recipient.role', 'recipient.department'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy(function ($message) use ($user) {
                if ($message->senderID === $user->getKey()) {
                    return $message->recipientID;
                } else {
                    return $message->senderID;
                }
            })
            ->map(function ($messages) use ($user) {
                $latestMessage = $messages->first();
                $otherUser = $latestMessage->senderID === $user->getKey() 
                    ? $latestMessage->recipient 
                    : $latestMessage->sender;
                
                $unreadCount = $messages->where('recipientID', $user->getKey())
                    ->where('read', false)
                    ->count();
                
                return [
                    'otherUser' => $otherUser,
                    'latestMessage' => $latestMessage,
                    'unreadCount' => $unreadCount,
                    'totalMessages' => $messages->count()
                ];
            })
            ->values();
        
        \Log::info('Conversations result', [
            'user_id' => $user->getKey(),
            'conversation_count' => $conversations->count(),
            'conversations' => $conversations->map(fn($c) => [
                'other_user_id' => $c['otherUser']->userID ?? 'unknown',
                'other_user_name' => $c['otherUser']->firstName ?? 'unknown',
                'unread_count' => $c['unreadCount'],
            ])
        ]);
            
        return response()->json(['data' => $conversations])
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    public function conversation(Request $request, $otherUserId): JsonResponse
    {
        $user = $request->user();
        
        // Ensure user has role loaded
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }
        
        // Verify the other user exists
        $otherUser = User::with('role')->find($otherUserId);
        if (!$otherUser) {
            return response()->json(['error' => 'User not found'], 404);
        }
        
        // Authorization: For CM and Proponent users, verify they can access this user
        // But allow viewing existing conversation history regardless
        // Only enforce department restrictions when starting NEW conversations (in store method)
        if ($user->role) {
            $userRole = $user->role->userRole;
            
            // For now, allow all authenticated users to view existing conversations
            // Authorization is enforced at message creation time via the store() method
        }
        
        $messages = Message::where(function ($query) use ($user, $otherUserId) {
            $query->where('senderID', $user->getKey())
                  ->where('recipientID', $otherUserId);
        })->orWhere(function ($query) use ($user, $otherUserId) {
            $query->where('senderID', $otherUserId)
                  ->where('recipientID', $user->getKey());
        })
        ->with(['sender', 'recipient'])
        ->orderBy('created_at', 'asc')
        ->get();
        
        // Mark messages as read if user is recipient
        $messages->where('recipientID', $user->getKey())
            ->where('read', false)
            ->each(function ($message) {
                $message->markAsRead();
            });
            
        return response()->json(['data' => $messages])
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'recipientID' => 'required|string',
                'subject' => 'required|string|max:255',
                'content' => 'required|string',
                'type' => ['sometimes', Rule::in(['general', 'proposal_update', 'system', 'review', 'revision', 'meeting', 'status', 'security', 'reply'])]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        }

        $user = $request->user();
        
        // Find recipient by email if it's an email, otherwise assume it's userID
        $recipientId = $request->recipientID;
        if (filter_var($recipientId, FILTER_VALIDATE_EMAIL)) {
            $recipient = User::where('email', $recipientId)->first();
            if (!$recipient) {
                return response()->json(['error' => 'Recipient not found'], 404);
            }
            $recipientId = $recipient->userID;
        } else {
            if (!User::where('userID', $recipientId)->exists()) {
                return response()->json(['error' => 'Recipient not found'], 404);
            }
        }
        
        // Get recipient user with role and department
        $recipient = User::with(['role', 'department'])->find($recipientId);
        if (!$recipient) {
            return response()->json(['error' => 'Recipient not found'], 404);
        }
        
        // Check if sender is a proponent
        if ($user->role && $user->role->userRole === 'Proponent') {
            if (!$recipient->role || $recipient->role->userRole !== 'CM') {
                return response()->json(['error' => 'Proponents can only message Center Managers'], 403);
            }
            
            if ($user->researchCenterID !== $recipient->researchCenterID) {
                return response()->json(['error' => 'You can only message Center Managers from your research center'], 403);
            }
        }
        
        $message = Message::create([
            'senderID' => $user->getKey(),
            'recipientID' => $recipientId,
            'subject' => $request->input('subject'),
            'content' => $request->input('content'),
            'type' => $request->input('type', 'general')
        ]);

        return response()->json($message->load('recipient'), 201);
    }

    public function markAsRead(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        
        $query = Message::where('recipientID', $user->getKey())
            ->where('id', $id);
        $query = $this->buildOptimizedQuery($user, $query);
        
        $message = $query->firstOrFail();
        $message->markAsRead();
        
        return response()->json(['message' => 'Message marked as read']);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $query = Message::where('recipientID', $user->getKey())
            ->where('read', false);
        $query = $this->buildOptimizedQuery($user, $query);
        
        $query->update([
            'read' => true,
            'read_at' => now()
        ]);
            
        return response()->json(['message' => 'All messages marked as read']);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        
        $query = Message::where('recipientID', $user->getKey())
            ->orWhere('senderID', $user->getKey());
        $query = $this->buildOptimizedQuery($user, $query);
        
        $message = $query->findOrFail($id);
        $message->delete();
        
        return response()->json(['message' => 'Message deleted']);
    }

    public function clearAll(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $query = Message::where('senderID', $user->getKey())
            ->orWhere('recipientID', $user->getKey());
        $query = $this->buildOptimizedQuery($user, $query);
        
        $query->delete();
            
        return response()->json(['message' => 'All messages cleared successfully']);
    }

    public function deleteConversation(Request $request, $otherUserId): JsonResponse
    {
        $user = $request->user();
        
        // Delete all messages between current user and other user
        Message::where(function ($query) use ($user, $otherUserId) {
            $query->where('senderID', $user->getKey())
                  ->where('recipientID', $otherUserId);
        })->orWhere(function ($query) use ($user, $otherUserId) {
            $query->where('senderID', $otherUserId)
                  ->where('recipientID', $user->getKey());
        })->delete();
        
        return response()->json(['message' => 'Conversation deleted successfully']);
    }

    public function getAvailableCM(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->role || $user->role->userRole !== 'Proponent') {
            return response()->json(['error' => 'Access denied'], 403);
        }
        
        $cacheKey = "available_cm_{$user->departmentID}";
        
        $result = Cache::remember($cacheKey, 600, function () use ($user) { // 10 minutes cache
            $cm = User::with(['role', 'department'])
                ->whereHas('role', function ($query) {
                    $query->where('userRole', 'CM');
                })
                ->where('departmentID', $user->departmentID)
                ->first();
                
            if (!$cm) {
                return ['error' => 'No Center Manager found in your department'];
            }
            
            return [
                'cm' => $cm,
                'canMessage' => true,
                'hasExistingConversation' => false
            ];
        });
        
        if (isset($result['error'])) {
            return response()->json($result, 404);
        }
        
        return response()->json($result);
    }

    /**
     * Get available proponents for CM users
     */
    public function getAvailableProponents(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->role || $user->role->userRole !== 'CM') {
            return response()->json(['error' => 'Access denied'], 403);
        }
        
        $cacheKey = "available_proponents_{$user->departmentID}";
        
        $result = Cache::remember($cacheKey, 600, function () use ($user) { // 10 minutes cache
            $proponents = User::with(['role', 'department'])
                ->whereHas('role', function ($query) {
                    $query->where('userRole', 'Proponent');
                })
                ->where('departmentID', $user->departmentID)
                ->get();
                
            if ($proponents->isEmpty()) {
                return ['error' => 'No proponents found in your department'];
            }
            
            return [
                'proponents' => $proponents,
                'canMessage' => true
            ];
        });
        
        if (isset($result['error'])) {
            return response()->json($result, 404);
        }
        
        return response()->json($result);
    }
}
