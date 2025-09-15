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
        
        $messages = Message::where('recipientID', $user->userID)
            ->with('sender')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
            
        return response()->json($messages);
    }

    public function sent(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 15);
        
        $messages = Message::where('senderID', $user->userID)
            ->with('recipient')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
            
        return response()->json($messages);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = Message::where('recipientID', $user->userID)
            ->where('read', false)
            ->count();
            
        return response()->json(['count' => $count]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'recipientID' => 'required|exists:users,userID',
            'subject' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => ['sometimes', Rule::in(['general', 'proposal_update', 'system'])]
        ]);

        $user = $request->user();
        
        $message = Message::create([
            'senderID' => $user->userID,
            'recipientID' => $request->recipientID,
            'subject' => $request->subject,
            'content' => $request->content,
            'type' => $request->get('type', 'general')
        ]);

        return response()->json($message->load('recipient'), 201);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $message = Message::where('recipientID', $user->userID)
            ->orWhere('senderID', $user->userID)
            ->with(['sender', 'recipient'])
            ->findOrFail($id);
            
        // Mark as read if user is recipient
        if ($message->recipientID === $user->userID && !$message->read) {
            $message->markAsRead();
        }
        
        return response()->json($message);
    }

    public function markAsRead(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $message = Message::where('recipientID', $user->userID)
            ->where('id', $id)
            ->firstOrFail();
            
        $message->markAsRead();
        
        return response()->json(['message' => 'Message marked as read']);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        Message::where('recipientID', $user->userID)
            ->where('read', false)
            ->update([
                'read' => true,
                'read_at' => now()
            ]);
            
        return response()->json(['message' => 'All messages marked as read']);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $message = Message::where('recipientID', $user->userID)
            ->orWhere('senderID', $user->userID)
            ->findOrFail($id);
            
        $message->delete();
        
        return response()->json(['message' => 'Message deleted']);
    }
}
