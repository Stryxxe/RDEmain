<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withSchedule(function (Schedule $schedule): void {
        // Run backup command every minute; command self-enforces frequency
        $schedule->command('backup:run')->everyMinute()->withoutOverlapping();
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->use([
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
        ]);

        // Add session middleware to API routes for proper SPA authentication
        // This allows API routes to use session-based authentication like web routes
        // Order is critical: StartSession must come before other middleware
        $middleware->api(prepend: [
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Session\Middleware\StartSession::class,
        ]);

        $middleware->alias([
            'request.deduplication' => \App\Http\Middleware\RequestDeduplication::class,
            'verify.csrf' => \App\Http\Middleware\VerifyCsrfToken::class,
            'active.user' => \App\Http\Middleware\EnsureUserIsActive::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
