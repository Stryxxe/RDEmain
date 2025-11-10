<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;

// Expose CSRF helpers before the SPA catch-all
Route::get('/csrf-token', function (Request $request) {
    return response()->json(['csrf_token' => csrf_token()]);
})->name('csrf-token');

Route::get('/sanctum/csrf-cookie', [CsrfCookieController::class, 'show'])
    ->name('sanctum.csrf-cookie');

// Serve React app for all routes
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
