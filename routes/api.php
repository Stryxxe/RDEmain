<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ProposalController;

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

// Proposal routes (temporarily without CSRF for testing)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('proposals', ProposalController::class);
    Route::get('/proposals/statistics', [ProposalController::class, 'statistics']);
});
