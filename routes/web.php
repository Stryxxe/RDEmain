<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\DashboardController;
use Inertia\Inertia;

// Expose CSRF helpers (Inertia handles CSRF automatically, but this can be useful for manual API calls)
Route::get('/csrf-token', function (Request $request) {
    return response()->json(['csrf_token' => csrf_token()]);
})->name('csrf-token');

// Include auth routes
require __DIR__.'/auth.php';

// Dashboard route
Route::get('/', [DashboardController::class, 'index'])
    ->middleware('auth:web')
    ->name('dashboard');

// Role-based routes - these will be handled by Inertia
// The actual page components will handle the routing internally
// Explicitly use 'web' guard to ensure session authentication works
Route::middleware('auth:web')->group(function () {
    // Admin routes
    Route::get('/admin/{any?}', function () {
        return Inertia::render('RoleViews/AdminView');
    })->where('any', '.*')->name('admin.*');
    
    // RDD routes
    Route::get('/rdd/{any?}', function () {
        return Inertia::render('RoleViews/RDDView');
    })->where('any', '.*')->name('rdd.*');
    
    // CM routes
    Route::get('/cm/{any?}', function () {
        return Inertia::render('RoleViews/CMView');
    })->where('any', '.*')->name('cm.*');
    
    // Proponent routes
    Route::get('/proponent/{any?}', function () {
        return Inertia::render('RoleViews/ProponentView');
    })->where('any', '.*')->name('proponent.*');
    
    // OP routes
    Route::get('/op/{any?}', function () {
        return Inertia::render('RoleViews/OPView');
    })->where('any', '.*')->name('op.*');
    
    // OSUUR routes
    Route::get('/osuur/{any?}', function () {
        return Inertia::render('RoleViews/OSUURView');
    })->where('any', '.*')->name('osuur.*');
    
    // Reviewer routes
    Route::get('/reviewer/{any?}', function () {
        return Inertia::render('RoleViews/ReviewerView');
    })->where('any', '.*')->name('reviewer.*');
});
