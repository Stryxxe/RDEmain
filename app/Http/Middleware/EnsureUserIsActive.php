<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && method_exists($user, 'getAttribute')) {
            $status = $user->getAttribute('status');
            if (is_string($status) && strtolower($status) === 'inactive') {
                auth()->logout();
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Account is inactive. Please contact administrator.'
                    ], 403);
                }
                return redirect()->route('login')->withErrors(['email' => 'Account is inactive. Please contact administrator.']);
            }
        }
        return $next($request);
    }
}
