<?php

namespace App\Http\Controllers;

use App\Models\Endorsement;
use App\Models\Proposal;
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
                'endorsementDate' => now(),
                'endorsementStatus' => $request->endorsementStatus
            ]);

            // If approved, dispatch the ProposalEndorsed event
            if ($request->endorsementStatus === 'approved') {
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
