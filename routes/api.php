<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ProposalController;

// API routes for authentication
Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->middleware('auth:sanctum');

// Get authenticated user
Route::get('/user', function (Request $request) {
    $user = $request->user();
    $user->load(['role', 'department']);
    return $user;
})->middleware('auth:sanctum');

// Proposal routes (protected)
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('proposals', ProposalController::class);
    Route::get('/proposals/statistics', [ProposalController::class, 'statistics']);
});
