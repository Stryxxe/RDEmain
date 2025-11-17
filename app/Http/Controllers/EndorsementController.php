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

            // Check if user has CM role
            if (!$user->role || $user->role->userRole !== 'CM') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only CM users can endorse proposals'
                ], 403);
            }

            // Get the proposal
            $proposal = Proposal::with('user')->find($request->proposalID);

            if (!$proposal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Proposal not found'
                ], 404);
            }

            // Check if the proposal belongs to a user in the same department
            if ($proposal->user->departmentID !== $user->departmentID) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only endorse proposals from your department'
                ], 403);
            }

            // Check if already endorsed
            $existingEndorsement = Endorsement::where('proposalID', $request->proposalID)
                ->where('endorserID', $user->userID)
                ->first();

            if ($existingEndorsement) {
                return response()->json([
                    'success' => false,
                    'message' => 'This proposal has already been endorsed by you'
                ], 409);
            }

            // Create the endorsement
            $endorsement = Endorsement::create([
                'proposalID' => $request->proposalID,
                'endorserID' => $user->userID,
                'endorsementComments' => $request->endorsementComments,
                'endorsementAt' => now(),
                'endorsementStatus' => $request->endorsementStatus
            ]);

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

                // Notify the proponent that their proposal has been endorsed
                Notification::create([
                    'userID' => $proposal->userID,
                    'type' => 'success',
                    'title' => 'Proposal Endorsed',
                    'message' => "Your proposal \"{$proposal->researchTitle}\" has been endorsed by {$user->fullName} and forwarded to RDD.",
                    'data' => [
                        'proposal_id' => $proposal->proposalID,
                        'proposal_title' => $proposal->researchTitle,
                        'endorser_name' => $user->fullName,
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
                            'event' => 'proposal.endorsed.rdd'
                        ]
                    ]);
                }

                // Dispatch the ProposalEndorsed event (which also creates notifications as a backup)
                event(new ProposalEndorsed($proposal, $user));
            }

            return response()->json([
                'success' => true,
                'message' => 'Endorsement created successfully',
                'data' => $endorsement->load(['proposal', 'endorser'])
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
                ->orderBy('endorsementDate', 'desc')
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
}
