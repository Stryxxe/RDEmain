<?php

namespace App\Http\Controllers;

use App\Models\Endorsement;
use App\Models\Proposal;
use App\Models\Notification;
use App\Models\User;
use App\Events\ProposalEndorsed;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class EndorsementController extends Controller
{
    /**
     * Create a new endorsement
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'proposalID' => 'required|exists:proposals,proposalID',
            'endorsementComments' => 'nullable|string',
            'endorsementStatus' => 'required|string|in:approved,rejected'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            
            // Explicitly load role and department relationships
            if (!$user->relationLoaded('role')) {
                $user->load('role');
            }
            if (!$user->relationLoaded('department')) {
                $user->load('department');
            }

            // Check if user has CM or RDD role (or other authorized roles)
            $authorizedRoles = ['CM', 'RDD', 'RDE'];
            if (!$user->role || !in_array($user->role->userRole, $authorizedRoles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only authorized users (CM, RDD, RDE) can endorse proposals'
                ], 403);
            }

            // Get the proposal
            $proposal = Proposal::with(['user', 'endorsements.endorser.role'])->find($request->proposalID);

            if (!$proposal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Proposal not found'
                ], 404);
            }

            // Research center check only applies to CM users
            // RDD and RDE can endorse proposals from any research center
            if ($user->role->userRole === 'CM') {
                // CM must have a research center assigned
                if (!$user->researchCenterID) {
                    return response()->json([
                        'success' => false,
                        'message' => 'CM users must be assigned to a research center to endorse proposals'
                    ], 403);
                }
                
                // Proposal author must have a research center assigned
                if (!$proposal->user->researchCenterID) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot endorse: Proposal author is not assigned to a research center'
                    ], 403);
                }
                
                // CM can only endorse proposals from their research center
                if ($proposal->user->researchCenterID !== $user->researchCenterID) {
                    return response()->json([
                        'success' => false,
                        'message' => 'CM users can only endorse proposals from their research center'
                    ], 403);
                }
            }

            // For RDD users, check if proposal has been endorsed by CM
            if ($user->role->userRole === 'RDD') {
                $hasCMEndorsement = $proposal->endorsements->contains(function ($endorsement) {
                    return $endorsement->endorser && 
                           $endorsement->endorser->role && 
                           $endorsement->endorser->role->userRole === 'CM' &&
                           $endorsement->endorsementStatus === 'approved';
                });

                if (!$hasCMEndorsement) {
                    return response()->json([
                        'success' => false,
                        'message' => 'This proposal must be endorsed by CM before RDD can endorse it'
                    ], 403);
                }
            }

            // For RDE users (future), check if proposal has been endorsed by RDD
            if ($user->role->userRole === 'RDE') {
                $hasRDDEndorsement = $proposal->endorsements->contains(function ($endorsement) {
                    return $endorsement->endorser && 
                           $endorsement->endorser->role && 
                           $endorsement->endorser->role->userRole === 'RDD' &&
                           $endorsement->endorsementStatus === 'approved';
                });

                if (!$hasRDDEndorsement) {
                    return response()->json([
                        'success' => false,
                        'message' => 'This proposal must be endorsed by RDD before RDE can endorse it'
                    ], 403);
                }
            }

            // Check if already endorsed
            // For CM users: Allow second endorsement if it's from Endorsement view (final endorsement to RDD)
            // The first endorsement is from For Revision page, the second is from Endorsement view
            $existingEndorsement = Endorsement::where('proposalID', $request->proposalID)
                ->where('endorserID', $user->userID)
                ->first();

            if ($existingEndorsement) {
                // For CM users, allow a second endorsement if:
                // 1. They've already endorsed once (from For Revision - Accept button)
                // 2. The proposal can be statusID 4 (For Revision) or statusID 1 (Under Review)
                // 3. This is the final endorsement to forward to RDD
                if ($user->role && $user->role->userRole === 'CM' && ($proposal->statusID == 1 || $proposal->statusID == 4)) {
                    // Count how many times this CM has endorsed this proposal
                    $endorsementCount = Endorsement::where('proposalID', $request->proposalID)
                        ->where('endorserID', $user->userID)
                        ->where('endorsementStatus', 'approved')
                        ->count();
                    
                    // If CM has already endorsed twice, don't allow another endorsement
                    if ($endorsementCount >= 2) {
                        return response()->json([
                            'success' => false,
                            'message' => 'This proposal has already been forwarded to RDD'
                        ], 409);
                    }
                    // If CM has endorsed once, allow the second endorsement (final endorsement to RDD)
                    // This will be handled below, continue with creating the endorsement
                } else {
                    // For other cases, prevent duplicate endorsement
                    return response()->json([
                        'success' => false,
                        'message' => 'This proposal has already been endorsed by you'
                    ], 409);
                }
            }

            // Create the endorsement
            $endorsement = Endorsement::create([
                'proposalID' => $request->proposalID,
                'endorserID' => $user->userID,
                'endorsementComments' => $request->endorsementComments,
                'endorsedAt' => now(),
                'endorsementStatus' => $request->endorsementStatus
            ]);

            // If CM user approves a proposal
            // Count endorsements AFTER creating the new one (so count includes the one just created)
            if ($user->role && $user->role->userRole === 'CM' && $request->endorsementStatus === 'approved') {
                // Count how many times this CM has endorsed this proposal (includes the one just created)
                $endorsementCount = Endorsement::where('proposalID', $request->proposalID)
                    ->where('endorserID', $user->userID)
                    ->where('endorsementStatus', 'approved')
                    ->count();
                
                // On the SECOND endorsement (final endorsement to RDD), ensure status is 1 (Under Review)
                // This ensures the proposal appears in RDD's view
                // The filtering logic will automatically exclude it from CM views (endorsed twice)
                $isFinalEndorsement = false;
                if ($endorsementCount >= 2) {
                    $isFinalEndorsement = true;
                    
                    // Find "Under Review" status
                    $underReviewStatus = \App\Models\Status::whereRaw('LOWER(statusName) = ?', ['under review'])->first();
                    if ($underReviewStatus) {
                        $proposal->update(['statusID' => $underReviewStatus->statusID]);
                    } else {
                        // Fallback to statusID 1 if status name not found
                        $proposal->update(['statusID' => 1]);
                    }
                    
                    // Clear all proposal caches for this proposal to ensure fresh data
                    // This ensures the proposal disappears from all CM views immediately
                    $this->clearProposalCache($request->proposalID);
                    
                    Log::info('CM final endorsement - proposal forwarded to RDD', [
                        'proposal_id' => $request->proposalID,
                        'cm_user_id' => $user->userID,
                        'endorsement_count' => $endorsementCount,
                        'new_status_id' => $underReviewStatus ? $underReviewStatus->statusID : 1
                    ]);
                }
            }

            // If RDD user approves, archive the proposal
            if ($user->role && $user->role->userRole === 'RDD' && $request->endorsementStatus === 'approved') {
                $proposal->update(['archivedByRDD' => now()]);
            }

            // If approved, notify RDD users and dispatch the ProposalEndorsed event
            if ($request->endorsementStatus === 'approved') {
                // Ensure proposal user and department relationships are loaded
                if (!$proposal->relationLoaded('user')) {
                    $proposal->load('user');
                }
                if (!$proposal->user->relationLoaded('department')) {
                    $proposal->user->load('department');
                }

                // Get department name
                $departmentName = $proposal->user->department ? $proposal->user->department->name : 'Unknown Department';

                // Ensure user role is loaded
                if (!$user->relationLoaded('role')) {
                    $user->load('role');
                }
                $endorserRole = $user->role ? $user->role->userRole : 'Unknown';

                // Notify the endorser about their successful endorsement action
                Notification::create([
                    'userID' => $user->userID,
                    'type' => 'success',
                    'title' => 'Endorsement Successful',
                    'message' => "You have successfully endorsed proposal \"{$proposal->researchTitle}\" (ID: {$proposal->proposalID}) by {$proposal->user->fullName}.",
                    'data' => [
                        'proposal_id' => $proposal->proposalID,
                        'proposal_title' => $proposal->researchTitle,
                        'proponent_name' => $proposal->user->fullName,
                        'endorsement_comments' => $request->endorsementComments,
                        'event' => 'proposal.endorsed.cm'
                    ]
                ]);

                // Notify the proponent that their proposal has been endorsed
                // Message varies based on endorser role
                $proponentMessage = match($endorserRole) {
                    'CM' => "Your proposal \"{$proposal->researchTitle}\" has been endorsed by {$user->fullName} and forwarded to RDD.",
                    'RDD' => "Your proposal \"{$proposal->researchTitle}\" has been endorsed by {$user->fullName} and archived.",
                    'RDE' => "Your proposal \"{$proposal->researchTitle}\" has been endorsed by {$user->fullName}.",
                    default => "Your proposal \"{$proposal->researchTitle}\" has been endorsed by {$user->fullName}.",
                };

                Notification::create([
                    'userID' => $proposal->userID,
                    'type' => 'success',
                    'title' => 'Proposal Endorsed',
                    'message' => $proponentMessage,
                    'data' => [
                        'proposal_id' => $proposal->proposalID,
                        'proposal_title' => $proposal->researchTitle,
                        'endorser_name' => $user->fullName,
                        'endorsement_comments' => $request->endorsementComments,
                        'event' => 'proposal.endorsed.proponent'
                    ]
                ]);

                // Find all RDD users and notify them
                $rddUsers = User::whereHas('role', function ($query) {
                    $query->where('userRole', 'RDD');
                })->get();

                foreach ($rddUsers as $rddUser) {
                    Notification::create([
                        'userID' => $rddUser->userID,
                        'type' => 'info',
                        'title' => 'New Proposal Endorsed',
                        'message' => "A proposal \"{$proposal->researchTitle}\" has been endorsed by {$user->fullName} ({$departmentName}) and is ready for RDD review.",
                        'data' => [
                            'proposal_id' => $proposal->proposalID,
                            'proposal_title' => $proposal->researchTitle,
                            'endorser_name' => $user->fullName,
                            'proponent_name' => $proposal->user->fullName,
                            'department' => $departmentName,
                            'endorsement_comments' => $request->endorsementComments,
                            'event' => 'proposal.endorsed.rdd'
                        ]
                    ]);
                }

                // Dispatch the ProposalEndorsed event (which also creates notifications as a backup)
                event(new ProposalEndorsed($proposal, $user));
            }

            // Clear proposal cache since endorsement data has changed
            $this->clearProposalCache($request->proposalID);

            // Determine if this was a final endorsement (CM endorsed twice)
            $isFinalEndorsement = false;
            if ($user->role && $user->role->userRole === 'CM' && $request->endorsementStatus === 'approved') {
                $endorsementCount = Endorsement::where('proposalID', $request->proposalID)
                    ->where('endorserID', $user->userID)
                    ->where('endorsementStatus', 'approved')
                    ->count();
                $isFinalEndorsement = $endorsementCount >= 2;
            }

            return response()->json([
                'success' => true,
                'message' => $isFinalEndorsement 
                    ? 'Proposal successfully forwarded to RDD. It will no longer appear in your views.'
                    : 'Endorsement created successfully',
                'data' => $endorsement->load(['proposal', 'endorser']),
                'is_final_endorsement' => $isFinalEndorsement,
                'proposal_id' => $request->proposalID
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create endorsement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get endorsements for a specific proposal
     */
    public function getByProposal($proposalId): JsonResponse
    {
        try {
            $endorsements = Endorsement::with(['endorser.role', 'proposal'])
                ->where('proposalID', $proposalId)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $endorsements
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch endorsements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all endorsements by the authenticated user
     */
    public function index(): JsonResponse
    {
        try {
            $user = Auth::user();

            $endorsements = Endorsement::with(['proposal.user', 'endorser'])
                ->where('endorserID', $user->userID)
                ->orderBy('endorsedAt', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $endorsements
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch endorsements',
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
