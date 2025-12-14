<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Proposal;
use App\Models\ReviewDecision;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    /**
     * Store a new review
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'proposalID' => 'required|exists:proposals,proposalID',
                'decision' => 'required|string|in:approve,approve_with_conditions,reject,request_revision',
                'remarks' => 'nullable|string',
                'matrixOfCompliance' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify the proposal exists
            $proposal = Proposal::find($request->proposalID);
            if (!$proposal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Proposal not found'
                ], 404);
            }

            // Map decision string to decisionID
            $decisionMap = [
                'approve' => 'Approved',
                'approve_with_conditions' => 'Revisions Required',
                'reject' => 'Rejected',
                'request_revision' => 'Revisions Required'
            ];

            $decisionName = $decisionMap[$request->decision] ?? 'Approved';
            $decision = ReviewDecision::where('decision', $decisionName)->first();

            if (!$decision) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid decision type'
                ], 422);
            }

            // Check if user already reviewed this proposal
            $existingReview = Review::where('proposalID', $request->proposalID)
                ->where('reviewerID', $user->userID)
                ->first();

            if ($existingReview) {
                // Update existing review
                $existingReview->update([
                    'remarks' => $request->remarks,
                    'matrixOfCompliance' => $request->matrixOfCompliance,
                    'reviewedAt' => now(),
                    'decisionID' => $decision->decisionID
                ]);

                // Clear proposal cache
                $this->clearProposalCache($request->proposalID);

                return response()->json([
                    'success' => true,
                    'message' => 'Review updated successfully',
                    'data' => $existingReview->load(['reviewer', 'decision'])
                ]);
            }

            // Create new review
            $review = Review::create([
                'proposalID' => $request->proposalID,
                'reviewerID' => $user->userID,
                'remarks' => $request->remarks,
                'matrixOfCompliance' => $request->matrixOfCompliance,
                'reviewedAt' => now(),
                'decisionID' => $decision->decisionID
            ]);

            // Clear proposal cache
            $this->clearProposalCache($request->proposalID);

            return response()->json([
                'success' => true,
                'message' => 'Review submitted successfully',
                'data' => $review->load(['reviewer', 'decision'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit review',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear proposal cache for all users
     * 
     * @param int $proposalId
     * @return void
     */
    private function clearProposalCache(int $proposalId): void
    {
        try {
            // Clear cache with wildcard pattern for this proposal
            $pattern = "proposal_{$proposalId}_user_*";
            
            try {
                $store = Cache::getStore();
                if ($store instanceof \Illuminate\Cache\RedisStore) {
                    // Redis supports pattern matching
                    $keys = Cache::getRedis()->keys($pattern);
                    if (!empty($keys)) {
                        Cache::getRedis()->del($keys);
                    }
                } else {
                    // For non-Redis stores, we can't use wildcard patterns
                    // Instead, we'll clear the cache entry for the current user if we have access to it
                    // Note: This is a limitation - we can't clear all user-specific caches for this proposal
                    // without knowing all user IDs. Consider using cache tags if your store supports them.
                    Log::info("Cache wildcard pattern not supported for non-Redis store. Skipping cache clear for pattern: {$pattern}");
                }
            } catch (\Exception $e) {
                Log::warning("Failed to clear proposal cache: " . $e->getMessage());
            }
        } catch (\Exception $e) {
            Log::warning("Failed to clear proposal cache: " . $e->getMessage());
        }
    }
}




