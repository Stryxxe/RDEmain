<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ProposalController;
use App\Http\Controllers\EndorsementController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\OptimizedNotificationController;
use App\Http\Controllers\Api\OptimizedMessageController;
use App\Http\Controllers\Api\SimpleOptimizedMessageController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Middleware\RequestDeduplication;

// CSRF routes that need web middleware for proper token generation
Route::middleware('web')->group(function () {
    Route::get('/csrf-token', function () {
        return response()->json(['csrf_token' => csrf_token()]);
    });
    
    Route::get('/sanctum/csrf-cookie', function (Request $request) {
        // This will set the XSRF-TOKEN cookie that Sanctum expects
        // The EnsureFrontendRequestsAreStateful middleware will handle this
        return response()->json(['message' => 'CSRF cookie set']);
    });
});


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

// Proposal routes with proper CSRF handling for SPA
Route::middleware(['auth:sanctum', 'web'])->group(function () {
    Route::get('/proposals/statistics', [ProposalController::class, 'statistics']);
    Route::get('/proposals/rdd-analytics', [ProposalController::class, 'rddAnalytics']);
    Route::apiResource('proposals', ProposalController::class);
    
    // Endorsement routes
    Route::post('/endorsements', [EndorsementController::class, 'store']);
    Route::get('/endorsements', [EndorsementController::class, 'index']);
    Route::get('/endorsements/proposal/{proposalId}', [EndorsementController::class, 'getByProposal']);
    
    // Optimized Notification routes with caching and deduplication
    Route::middleware([RequestDeduplication::class])->group(function () {
        Route::get('/notifications', [OptimizedNotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [OptimizedNotificationController::class, 'unreadCount']);
    });
    Route::put('/notifications/{id}/read', [OptimizedNotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [OptimizedNotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [OptimizedNotificationController::class, 'destroy']);
    
    // Simple Optimized Message routes (compatible with all cache drivers)
    Route::get('/messages', [SimpleOptimizedMessageController::class, 'index']);
    Route::get('/messages/sent', [SimpleOptimizedMessageController::class, 'sent']);
    Route::get('/messages/unread-count', [SimpleOptimizedMessageController::class, 'unreadCount']);
    Route::get('/messages/conversations', [SimpleOptimizedMessageController::class, 'conversations']);
    Route::get('/messages/conversation/{otherUserId}', [SimpleOptimizedMessageController::class, 'conversation']);
    Route::get('/messages/available-cm', [SimpleOptimizedMessageController::class, 'getAvailableCM']);
    Route::post('/messages', [SimpleOptimizedMessageController::class, 'store']);
    Route::get('/messages/{id}', [MessageController::class, 'show']); // Keep original for show method
    Route::put('/messages/{id}/read', [SimpleOptimizedMessageController::class, 'markAsRead']);
    Route::put('/messages/mark-all-read', [SimpleOptimizedMessageController::class, 'markAllAsRead']);
    Route::delete('/messages/{id}', [SimpleOptimizedMessageController::class, 'destroy']);
    Route::delete('/messages/clear-all', [SimpleOptimizedMessageController::class, 'clearAll']);

});

// Admin - Users management (token auth only)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::put('/admin/users/{user:userID}', [AdminUserController::class, 'update']);
});
