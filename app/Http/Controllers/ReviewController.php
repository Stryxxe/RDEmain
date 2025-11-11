<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Proposal;
use App\Models\ReviewDecision;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
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
}




