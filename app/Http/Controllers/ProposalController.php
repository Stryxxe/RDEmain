<?php

namespace App\Http\Controllers;

use App\Models\Proposal;
use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ProposalController extends Controller
{
    /**
     * Get all proposals for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $proposals = Proposal::where('userID', $user->userID)
            ->with(['status', 'files', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $proposals
        ]);
    }

    /**
     * Get a specific proposal by ID
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = Auth::user();
        
        $proposal = Proposal::where('proposalID', $id)
            ->where('userID', $user->userID)
            ->with(['status', 'files', 'user'])
            ->first();

        if (!$proposal) {
            return response()->json([
                'success' => false,
                'message' => 'Proposal not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $proposal
        ]);
    }

    /**
     * Create a new proposal
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'researchTitle' => 'required|string|max:255',
            'description' => 'required|string',
            'objectives' => 'required|string',
            'researchCenter' => 'required|string',
            'researchAgenda' => 'required|string', // Will be JSON string from frontend
            'dostSPs' => 'required|string', // Will be JSON string from frontend
            'sustainableDevelopmentGoals' => 'required|string', // Will be JSON string from frontend
            'proposedBudget' => 'required|numeric|min:0',
            'reportFile' => 'required|file|mimes:pdf,doc,docx|max:10240', // 10MB max
            'setiScorecard' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'gadCertificate' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'matrixOfCompliance' => 'nullable|file|mimes:pdf,doc,docx|max:10240'
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
            
            // Parse JSON strings from frontend
            $researchAgenda = json_decode($request->researchAgenda, true);
            $dostSPs = json_decode($request->dostSPs, true);
            $sustainableDevelopmentGoals = json_decode($request->sustainableDevelopmentGoals, true);
            
            // Create the proposal
            $proposal = Proposal::create([
                'researchTitle' => $request->researchTitle,
                'description' => $request->description,
                'objectives' => $request->objectives,
                'researchCenter' => $request->researchCenter,
                'researchAgenda' => $researchAgenda,
                'dostSPs' => $dostSPs,
                'sustainableDevelopmentGoals' => $sustainableDevelopmentGoals,
                'proposedBudget' => $request->proposedBudget,
                'userID' => $user->userID,
                'statusID' => 1, // Assuming 1 is "Under Review" status
                'matrixOfCompliance' => [
                    'researchAgenda' => $researchAgenda,
                    'dostSPs' => $dostSPs,
                    'sustainableDevelopmentGoals' => $sustainableDevelopmentGoals,
                    'proposedBudget' => $request->proposedBudget,
                    'researchCenter' => $request->researchCenter,
                    'description' => $request->description,
                    'objectives' => $request->objectives
                ]
            ]);

            // Handle file uploads
            $files = [];
            
            // Main report file
            if ($request->hasFile('reportFile')) {
                $file = $request->file('reportFile');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('proposals/' . $proposal->proposalID, $filename, 'public');
                
                $files[] = File::create([
                    'proposalID' => $proposal->proposalID,
                    'fileName' => $filename,
                    'filePath' => $path,
                    'fileType' => 'report',
                    'fileSize' => $file->getSize()
                ]);
            }

            // Supporting documents
            $supportingDocs = [
                'setiScorecard' => 'seti_scorecard',
                'gadCertificate' => 'gad_certificate',
                'matrixOfCompliance' => 'matrix_compliance'
            ];

            foreach ($supportingDocs as $field => $type) {
                if ($request->hasFile($field)) {
                    $file = $request->file($field);
                    $filename = time() . '_' . $file->getClientOriginalName();
                    $path = $file->storeAs('proposals/' . $proposal->proposalID, $filename, 'public');
                    
                    $files[] = File::create([
                        'proposalID' => $proposal->proposalID,
                        'fileName' => $filename,
                        'filePath' => $path,
                        'fileType' => $type,
                        'fileSize' => $file->getSize()
                    ]);
                }
            }

            $proposal->load(['status', 'files']);

            return response()->json([
                'success' => true,
                'message' => 'Proposal submitted successfully',
                'data' => $proposal
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create proposal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a proposal
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = Auth::user();
        
        $proposal = Proposal::where('proposalID', $id)
            ->where('userID', $user->userID)
            ->first();

        if (!$proposal) {
            return response()->json([
                'success' => false,
                'message' => 'Proposal not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'researchTitle' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'objectives' => 'sometimes|string',
            'researchCenter' => 'sometimes|string',
            'researchAgenda' => 'sometimes|array',
            'dostSPs' => 'sometimes|array',
            'sustainableDevelopmentGoals' => 'sometimes|array',
            'proposedBudget' => 'sometimes|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updateData = $request->only([
                'researchTitle', 'description', 'objectives', 'researchCenter'
            ]);

            if ($request->hasAny(['researchAgenda', 'dostSPs', 'sustainableDevelopmentGoals', 'proposedBudget'])) {
                $matrixData = $proposal->matrixOfCompliance ?: [];
                
                if ($request->has('researchAgenda')) $matrixData['researchAgenda'] = $request->researchAgenda;
                if ($request->has('dostSPs')) $matrixData['dostSPs'] = $request->dostSPs;
                if ($request->has('sustainableDevelopmentGoals')) $matrixData['sustainableDevelopmentGoals'] = $request->sustainableDevelopmentGoals;
                if ($request->has('proposedBudget')) $matrixData['proposedBudget'] = $request->proposedBudget;
                if ($request->has('researchCenter')) $matrixData['researchCenter'] = $request->researchCenter;
                if ($request->has('description')) $matrixData['description'] = $request->description;
                if ($request->has('objectives')) $matrixData['objectives'] = $request->objectives;
                
                $updateData['matrixOfCompliance'] = json_encode($matrixData);
            }

            $proposal->update($updateData);
            $proposal->load(['status', 'files']);

            return response()->json([
                'success' => true,
                'message' => 'Proposal updated successfully',
                'data' => $proposal
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update proposal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a proposal
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = Auth::user();
        
        $proposal = Proposal::where('proposalID', $id)
            ->where('userID', $user->userID)
            ->first();

        if (!$proposal) {
            return response()->json([
                'success' => false,
                'message' => 'Proposal not found'
            ], 404);
        }

        try {
            // Delete associated files from storage
            foreach ($proposal->files as $file) {
                Storage::disk('public')->delete($file->filePath);
                $file->delete();
            }

            // Delete proposal directory
            Storage::disk('public')->deleteDirectory('proposals/' . $proposal->proposalID);

            $proposal->delete();

            return response()->json([
                'success' => true,
                'message' => 'Proposal deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete proposal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get proposal statistics for dashboard
     */
    public function statistics(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $stats = [
            'total' => Proposal::where('userID', $user->userID)->count(),
            'under_review' => Proposal::where('userID', $user->userID)->where('statusID', 1)->count(),
            'approved' => Proposal::where('userID', $user->userID)->where('statusID', 2)->count(),
            'rejected' => Proposal::where('userID', $user->userID)->where('statusID', 3)->count(),
            'ongoing' => Proposal::where('userID', $user->userID)->where('statusID', 4)->count(),
            'completed' => Proposal::where('userID', $user->userID)->where('statusID', 5)->count()
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
