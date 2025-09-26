<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class MessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        
        $messages = Message::where('recipientID', $user->getKey())
            ->with('sender')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
            
        return response()->json(['data' => $messages->items()]);
    }

    public function sent(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        
        $messages = Message::where('senderID', $user->getKey())
            ->with('recipient')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
            
        return response()->json(['data' => $messages->items()]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = Message::where('recipientID', $user->getKey())
            ->where('read', false)
            ->count();
            
        return response()->json(['count' => $count]);
    }

    public function store(Request $request): JsonResponse
    {
        // Process message store request
        
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
            // Validate that the userID exists
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
            // Proponents can only message CM of the same department
            if (!$recipient->role || $recipient->role->userRole !== 'CM') {
                return response()->json(['error' => 'Proponents can only message Center Managers'], 403);
            }
            
            // Check if CM is in the same department
            if ($user->departmentID !== $recipient->departmentID) {
                return response()->json(['error' => 'You can only message Center Managers from your department'], 403);
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

    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $message = Message::where('recipientID', $user->getKey())
            ->orWhere('senderID', $user->getKey())
            ->with(['sender', 'recipient'])
            ->findOrFail($id);
            
        // Mark as read if user is recipient
        if ($message->recipientID === $user->getKey() && !$message->read) {
            $message->markAsRead();
        }
        
        return response()->json($message);
    }

    public function markAsRead(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $message = Message::where('recipientID', $user->getKey())
            ->where('id', $id)
            ->firstOrFail();
            
        $message->markAsRead();
        
        return response()->json(['message' => 'Message marked as read']);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        Message::where('recipientID', $user->getKey())
            ->where('read', false)
            ->update([
                'read' => true,
                'read_at' => now()
            ]);
            
        return response()->json(['message' => 'All messages marked as read']);
    }

    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Get all unique conversation partners
        $conversations = Message::where('senderID', $user->getKey())
            ->orWhere('recipientID', $user->getKey())
            ->with(['sender.role', 'sender.department', 'recipient.role', 'recipient.department'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy(function ($message) use ($user) {
                // Group by the other user in the conversation
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
            
        return response()->json(['data' => $conversations]);
    }

    public function conversation(Request $request, $otherUserId): JsonResponse
    {
        $user = $request->user();
        
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
            
        return response()->json(['data' => $messages]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $message = Message::where('recipientID', $user->getKey())
            ->orWhere('senderID', $user->getKey())
            ->findOrFail($id);
            
        $message->delete();
        
        return response()->json(['message' => 'Message deleted']);
    }

    public function getAvailableCM(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Only proponents can access this endpoint
        if (!$user->role || $user->role->userRole !== 'Proponent') {
            return response()->json(['error' => 'Access denied'], 403);
        }
        
        // Get CM from the same department
        $cm = User::with(['role', 'department'])
            ->whereHas('role', function ($query) {
                $query->where('userRole', 'CM');
            })
            ->where('departmentID', $user->departmentID)
            ->first();
            
        if (!$cm) {
            return response()->json(['error' => 'No Center Manager found in your department'], 404);
        }
        
        return response()->json([
            'cm' => $cm,
            'canMessage' => true,
            'hasExistingConversation' => false
        ]);
    }

    public function clearAll(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Delete all messages where user is sender or recipient
        Message::where('senderID', $user->getKey())
            ->orWhere('recipientID', $user->getKey())
            ->delete();
            
        return response()->json(['message' => 'All messages cleared successfully']);
    }
}
