<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class RequestDeduplication
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Only apply to API requests
        if (!$request->is('api/*')) {
            return $next($request);
        }

        // Skip for non-GET requests (POST, PUT, DELETE should not be deduplicated)
        if (!$request->isMethod('GET')) {
            return $next($request);
        }

        // Skip for requests with query parameters that change frequently
        if ($request->has(['page', 'per_page', 'search', 'filter'])) {
            return $next($request);
        }

        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        // Create a unique cache key for this request
        $cacheKey = $this->generateCacheKey($request, $user);
        
        // Check if we have a cached response
        if (Cache::has($cacheKey)) {
            $cachedResponse = Cache::get($cacheKey);
            
            // Return cached response with proper headers
            $response = response()->json($cachedResponse['data'], $cachedResponse['status']);
            foreach ($cachedResponse['headers'] as $key => $value) {
                $response->header($key, is_array($value) ? implode(', ', $value) : $value);
            }
            return $response;
        }

        // Process the request
        $response = $next($request);

        // Cache successful responses for a short time
        if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
            $responseData = [
                'data' => json_decode($response->getContent(), true),
                'status' => $response->getStatusCode(),
                'headers' => $response->headers->all()
            ];

            // Cache for 30 seconds for most endpoints, 10 seconds for counts
            $ttl = $this->getCacheTTL($request);
            Cache::put($cacheKey, $responseData, $ttl);
        }

        return $response;
    }

    /**
     * Generate a unique cache key for the request
     */
    private function generateCacheKey(Request $request, $user): string
    {
        $path = $request->path();
        $method = $request->method();
        $userId = $user->userID;
        
        // Include relevant query parameters in the key
        $queryParams = $request->only(['per_page', 'page']);
        $queryString = http_build_query($queryParams);
        
        return "dedup_{$method}_{$path}_{$userId}_" . md5($queryString);
    }

    /**
     * Get cache TTL based on endpoint
     */
    private function getCacheTTL(Request $request): int
    {
        $path = $request->path();
        
        // Shorter cache for counts and real-time data
        if (str_contains($path, 'unread-count') || str_contains($path, 'count')) {
            return 10; // 10 seconds
        }
        
        // Medium cache for lists
        if (str_contains($path, 'messages') || str_contains($path, 'notifications')) {
            return 30; // 30 seconds
        }
        
        // Default cache time
        return 60; // 1 minute
    }
}
