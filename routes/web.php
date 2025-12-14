<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Mail\TestMail;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TimelineStageController;
use Inertia\Inertia;

// Expose CSRF helpers (Inertia handles CSRF automatically, but this can be useful for manual API calls)
Route::get('/csrf-token', function (Request $request) {
    return response()->json(['csrf_token' => csrf_token()]);
})->name('csrf-token');

Route::get('/send', function () {
      Mail::
      to(["boybawang141@gmail.com"])
      ->send(new TestMail());
    return "email sent";
}); 

// Include auth routes
require __DIR__ . '/auth.php';

// Dashboard route
Route::get('/', [DashboardController::class, 'index'])
    ->middleware('auth:web')
    ->name('dashboard');

// Pure Inertia routing - each route renders its own page component
// Explicitly use 'web' guard to ensure session authentication works
Route::middleware(['auth:web', \App\Http\Middleware\EnsureUserIsActive::class])->group(function () {

    // ============================================================================
    // RDD Routes - Research & Development Division
    // ============================================================================
    Route::prefix('rdd')->name('rdd.')->group(function () {
        Route::get('/', fn() => Inertia::render('RoleViews/RDD/RDDDashboard'))->name('dashboard');
        Route::get('/statistics', fn() => Inertia::render('RoleViews/RDD/RDDStatistics'))->name('statistics');
        Route::get('/review-proposal', fn() => Inertia::render('RoleViews/RDD/RDDEndorsement'))->name('endorsement');
        Route::get('/review-proposal/{id}', fn($id) => Inertia::render('RoleViews/RDD/RDDEndorsementDetail', ['id' => $id]))->name('endorsement.detail');
        Route::get('/for-revision', fn() => Inertia::render('RoleViews/RDD/RDDForRevision'))->name('for-revision');
        Route::get('/archive', fn() => Inertia::render('RoleViews/RDD/RDDArchive'))->name('archive');
        Route::get('/submit-report', fn() => Inertia::render('RoleViews/RDD/RDDSubmitReport'))->name('submit-report');
        Route::get('/resources', fn() => Inertia::render('RoleViews/RDD/RDDResources'))->name('resources');
        Route::get('/account', fn() => Inertia::render('RoleViews/RDD/RDDAccount'))->name('account');
        Route::get('/proposal/{id}', fn($id) => Inertia::render('RoleViews/RDD/RDDProposalDetail', ['id' => $id]))->name('proposal.detail');
        Route::get('/notifications', fn() => Inertia::render('Notification'))->name('notifications');
        Route::get('/messages', fn() => Inertia::render('RoleViews/RDD/RDDMessages'))->name('messages');
    });

    // ============================================================================
    // Proponent Routes
    // ============================================================================
    Route::prefix('proponent')->name('proponent.')->group(function () {
        Route::get('/', fn() => Inertia::render('SubmitPage'))->name('dashboard');
        Route::get('/tracker', fn() => Inertia::render('Tracker'))->name('tracker');
        Route::get('/tracker/{id}', fn($id) => Inertia::render('TrackerDetail', ['id' => $id]))->name('tracker.detail');
        Route::get('/progress-report', fn() => Inertia::render('RoleViews/Proponent/ProponentProgressReport'))->name('progress-report');
        Route::get('/progress-report/{id}', fn($id) => Inertia::render('RoleViews/Proponent/ProponentProgressReportDetail', ['id' => $id]))->name('progress-report.detail');
        Route::get('/revision', fn() => Inertia::render('ForRevision'))->name('revision');
        Route::get('/revision/{id}', fn($id) => Inertia::render('RevisionDetail', ['id' => $id]))->name('revision.detail');
        Route::get('/submit-report', fn() => Inertia::render('RoleViews/Proponent/ProponentSubmitReport'))->name('submit-report');
        Route::get('/resources', fn() => Inertia::render('Resources'))->name('resources');
        Route::get('/account', fn() => Inertia::render('Account'))->name('account');
        Route::get('/notifications', fn() => Inertia::render('Notification'))->name('notifications');
        Route::get('/messages', fn() => Inertia::render('Messages'))->name('messages');
    });

    // ============================================================================
    // CM Routes - Center Manager
    // ============================================================================
    Route::prefix('cm')->name('cm.')->group(function () {
        Route::get('/', fn() => Inertia::render('RoleViews/CM/CMDashboard'))->name('dashboard');
        Route::get('/proposal/{id}', fn($id) => Inertia::render('RoleViews/CM/CMProposalDetail', ['id' => $id]))->name('proposal.detail');
        Route::get('/review-proposal', fn() => Inertia::render('RoleViews/CM/CMReviewProposal'))->name('review-proposal');
        Route::get('/for-revision', fn() => Inertia::render('RoleViews/CM/CMForRevision'))->name('for-revision');
        Route::get('/progress-report', fn() => Inertia::render('RoleViews/CM/CMProgressReport'))->name('progress-report');
        Route::get('/submit-report', fn() => Inertia::render('RoleViews/CM/CMSubmitReport'))->name('submit-report');
        Route::get('/resources', fn() => Inertia::render('RoleViews/CM/CMResources'))->name('resources');
        Route::get('/account', fn() => Inertia::render('RoleViews/CM/CMAccount'))->name('account');
        Route::get('/notifications', fn() => Inertia::render('RoleViews/CM/CMNotifications'))->name('notifications');
        Route::get('/messages', fn() => Inertia::render('RoleViews/CM/CMMessages'))->name('messages');
    });

    // ============================================================================
    // Admin Routes
    // ============================================================================
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/', fn() => Inertia::render('RoleViews/Dashboards/AdminDashboard'))->name('dashboard');
        Route::get('/user-management', fn() => Inertia::render('RoleViews/Admin/UserManagement'))->name('user-management');
        Route::get('/system-settings', fn() => Inertia::render('RoleViews/Admin/SystemSettings'))->name('system-settings');
        Route::post('/timeline-stages', [TimelineStageController::class, 'store'])->name('timeline-stages.store');
        Route::put('/timeline-stages/{id}', [TimelineStageController::class, 'update'])->name('timeline-stages.update');
        Route::delete('/timeline-stages/{id}', [TimelineStageController::class, 'destroy'])->name('timeline-stages.destroy');
        Route::get('/profile', fn() => Inertia::render('RoleViews/Admin/Profile'))->name('profile');
        Route::get('/notifications', fn() => Inertia::render('Notification'))->name('notifications');
        Route::get('/messages', fn() => Inertia::render('Messages'))->name('messages');
    });

    // ============================================================================
    // OP Routes - Office of the President
    // ============================================================================
    Route::prefix('op')->name('op.')->group(function () {
        Route::get('/', fn() => Inertia::render('Dashboard'))->name('dashboard');
        Route::get('/notifications', fn() => Inertia::render('Notification'))->name('notifications');
        Route::get('/messages', fn() => Inertia::render('Messages'))->name('messages');
    });

    // ============================================================================
    // OSUUR Routes - Office of Student Affairs and University Relations Unit
    // ============================================================================
    Route::prefix('osuur')->name('osuur.')->group(function () {
        Route::get('/', fn() => Inertia::render('Dashboard'))->name('dashboard');
        Route::get('/notifications', fn() => Inertia::render('Notification'))->name('notifications');
        Route::get('/messages', fn() => Inertia::render('Messages'))->name('messages');
    });

    // ============================================================================
    // Reviewer Routes
    // ============================================================================
    Route::prefix('reviewer')->name('reviewer.')->group(function () {
        Route::get('/', fn() => Inertia::render('Dashboard'))->name('dashboard');
        Route::get('/notifications', fn() => Inertia::render('Notification'))->name('notifications');
        Route::get('/messages', fn() => Inertia::render('Messages'))->name('messages');
    });
});
