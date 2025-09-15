<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ProposalController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\MessageController;

// CSRF routes that need web middleware for proper token generation
Route::middleware('web')->group(function () {
    Route::get('/csrf-token', function () {
        return response()->json(['csrf_token' => csrf_token()]);
    });
    
    Route::get('/sanctum/csrf-cookie', function (Request $request) {
        return response()->json(['message' => 'CSRF cookie set']);
    });
});

Route::get('/debug/csrf', function (Request $request) {
    return response()->json([
        'csrf_token' => csrf_token(),
        'headers' => $request->headers->all(),
        'cookies' => $request->cookies->all(),
        'session_available' => $request->hasSession(),
        'session_token' => $request->hasSession() ? $request->session()->token() : null
    ]);
});

// Test CSRF endpoint
Route::post('/test-csrf', function (Request $request) {
    return response()->json([
        'message' => 'CSRF test successful',
        'csrf_token' => csrf_token(),
        'request_data' => $request->all()
    ]);
})->middleware('web');
Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->middleware('auth:sanctum');

// Get authenticated user
Route::get('/user', function (Request $request) {
    $user = $request->user();
    $user->load(['role', 'department']);
    return $user;
})->middleware('auth:sanctum');

// Update user profile
Route::put('/user', function (Request $request) {
    $request->validate([
        'firstName' => 'required|string|max:255',
        'lastName' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users,email,' . $request->user()->userID . ',userID',
    ]);

    $user = $request->user();
    $user->update([
        'firstName' => $request->firstName,
        'lastName' => $request->lastName,
        'email' => $request->email,
    ]);

    $user->load(['role', 'department']);
    return $user;
})->middleware('auth:sanctum');

// Proposal routes (temporarily without CSRF for testing)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('proposals', ProposalController::class);
    Route::get('/proposals/statistics', [ProposalController::class, 'statistics']);
    
    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    
    // Message routes
    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/sent', [MessageController::class, 'sent']);
    Route::get('/messages/unread-count', [MessageController::class, 'unreadCount']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::get('/messages/{id}', [MessageController::class, 'show']);
    Route::put('/messages/{id}/read', [MessageController::class, 'markAsRead']);
    Route::put('/messages/mark-all-read', [MessageController::class, 'markAllAsRead']);
    Route::delete('/messages/{id}', [MessageController::class, 'destroy']);
});

// Debug route to check proposal data (no auth required for testing)
Route::get('/debug/proposals', function () {
    $proposals = App\Models\Proposal::with('user')->get();
    $users = App\Models\User::all(['userID', 'firstName', 'lastName']);
    
    return response()->json([
        'all_users' => $users,
        'all_proposals' => $proposals->map(function($p) {
            return [
                'proposalID' => $p->proposalID,
                'userID' => $p->userID,
                'researchTitle' => $p->researchTitle,
                'user' => $p->user ? [
                    'userID' => $p->user->userID,
                    'firstName' => $p->user->firstName,
                    'lastName' => $p->user->lastName,
                    'fullName' => $p->user->fullName
                ] : null
            ];
        })
    ]);
});