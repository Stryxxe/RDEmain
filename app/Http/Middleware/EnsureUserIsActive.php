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
            $statusLower = is_string($status) ? strtolower($status) : '';
            
            if ($statusLower === 'inactive') {
                auth()->logout();
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Account is inactive. Please contact administrator.'
                    ], 403);
                }
                return redirect()->route('login')->withErrors(['email' => 'Account is inactive. Please contact administrator.']);
            }
            
            if ($statusLower === 'pending') {
                auth()->logout();
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Your account is pending approval. Please wait for administrator approval.'
                    ], 403);
                }
                return redirect()->route('login')->withErrors(['email' => 'Your account is pending approval. Please wait for administrator approval.']);
            }
        }
        return $next($request);
    }
}
