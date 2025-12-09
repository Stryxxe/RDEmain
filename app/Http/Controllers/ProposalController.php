<?php

namespace App\Http\Controllers;

use App\Models\Proposal;
use App\Models\File;
use App\Models\Notification;
use App\Models\User;
use App\Models\Endorsement;
use App\Events\ProposalSubmitted;
use App\Helpers\SettingsHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProposalController extends Controller
{
    /**
     * Get all proposals for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $user->loadMissing('role');

            // Build base query with common eager loads
            $query = Proposal::with([
                'status:statusID,statusName,statusDescription',
                'files:fileID,proposalID,fileName,filePath,fileType',
                'user:userID,firstName,lastName,email,researchCenterID,departmentID,userRolesID',
                'user.department:departmentID,name',
                'user.role:userRoleID,userRole',
                // Don't use column selection for many-to-many relationships - it can cause issues
                'proponents',
                'endorsements:endorsementID,proposalID,endorserID,endorsementStatus,endorsedAt',
                'endorsements.endorser:userID,firstName,lastName,userRolesID',
                'endorsements.endorser.role:userRoleID,userRole'
            ]);

            // Apply role-specific filtering
            $role = $user->role?->userRole;
            if ($role === 'RDD') {
                // Exclude archived proposals - see all non-archived proposals
                $query->whereNull('archivedByRDD');
                
                // Filter by research center if provided
                if ($request->has('centerID') && $request->centerID) {
                    $query->whereHas('user', function($q) use ($request) {
                        $q->where('researchCenterID', $request->centerID);
                    });
                }
                
                // Filter by department if provided
                if ($request->has('departmentID') && $request->departmentID) {
                    $query->whereHas('user', function($q) use ($request) {
                        $q->where('departmentID', $request->departmentID);
                    });
                }
            } elseif ($role === 'CM') {
                // Show proposals whose submitting user is in same research center
                // but exclude proposals that this CM has already endorsed
                if ($user->researchCenterID) {
                    $query->whereHas('user', fn($q) => $q->where('researchCenterID', $user->researchCenterID))
                        ->whereDoesntHave('endorsements', function ($q) use ($user) {
                            $q->where('endorserID', $user->userID);
                        });
                } else {
                    // If CM has no research center assigned, return empty set
                    $query->whereRaw('1=0');
                }
            } elseif ($role === 'Proponent') {
                // Show proposals where this user is one of the proponents
                $query->whereHas('proponents', function ($q) use ($user) {
                    $q->where('users.userID', $user->userID);
                });
            } else {
                // Fallback: show proposals submitted by the user
                $query->where('userID', $user->userID);
            }

            // Default sorting: Latest to Oldest (by proposalID descending, then by uploadedAt descending)
            $proposals = $query->orderByDesc('proposalID')
                ->orderByDesc('uploadedAt')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $proposals
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching proposals: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch proposals',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get a specific proposal by ID
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $user->loadMissing('role');

        // Cache key includes user ID to handle different permissions
        $cacheKey = "proposal_{$id}_user_{$user->userID}";
        
        // Cache for 2 minutes - balance between performance and data freshness
        $proposal = Cache::remember($cacheKey, 120, function () use ($id, $user) {
            // For RDD users, show all proposals; for CM users, show proposals from their department; for others, show only their own
            $query = Proposal::where('proposalID', $id)->with([
                'status:statusID,statusName,statusDescription',
                'files:fileID,proposalID,fileName,filePath,fileType,fileSize',
                'user:userID,firstName,lastName,email,researchCenterID,departmentID,userRolesID',
                'user.department:departmentID,name',
                'user.role:userRoleID,userRole',
                'reviews:reviewID,proposalID,reviewerID,remarks,reviewedAt,decisionID',
                'reviews.reviewer:userID,firstName,lastName,email,userRolesID',
                'reviews.decision:decisionID,decisionName',
                'endorsements:endorsementID,proposalID,endorserID,endorsementComments,endorsedAt,endorsementStatus',
                'endorsements.endorser:userID,firstName,lastName,email,userRolesID',
                'endorsements.endorser.role:userRoleID,userRole',
                // Load all proponents (co-authors) with their role and pivot data for display
                // Note: Cannot use column-specific select for proponents as it excludes pivot columns
                'proponents',
                'proponents.role:userRoleID,userRole'
            ]);

            // Apply authorization filters based on user role
            $userRole = $user->role?->userRole;
            if ($userRole === 'RDD') {
                // RDD users can see all proposals including archived ones - no filter needed
            } elseif ($userRole === 'CM') {
                // CM users can only see proposals from their research center
                // and exclude proposals they've already endorsed (consistent with index method)
                if ($user->researchCenterID) {
                    $query->whereHas('user', fn($q) => $q->where('researchCenterID', $user->researchCenterID))
                        ->whereDoesntHave('endorsements', function ($q) use ($user) {
                            $q->where('endorserID', $user->userID);
                        });
                } else {
                    // If CM has no research center assigned, return empty set
                    $query->whereRaw('1=0');
                }
            } else {
                $query->whereHas('proponents', fn($q) => $q->where('users.userID', $user->userID));
            }

            $result = $query->firstOrFail();
            
            // Load project roles for proponents
            $result->proponents->each(function ($proponent) {
                if ($proponent->pivot->projectRoleID) {
                    $projectRole = \App\Models\ProjectRole::find($proponent->pivot->projectRoleID);
                    $proponent->projectRole = $projectRole;
                }
            });
            
            return $result;
        });

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
        $user = Auth::user();
        $user->loadMissing(['role', 'department']);

        // Only proponents can submit proposals
        if ($user->role?->userRole !== 'Proponent') {
            return response()->json([
                'success' => false,
                'message' => 'Only proponents can submit proposals'
            ], 403);
        }

        // Get user's department as research center (fallback if not provided)
        $defaultResearchCenter = $user->department?->name ?? 'Not specified';

        // Merge request data with default research center if not provided
        if (empty($request->input('researchCenter'))) {
            $request->merge(['researchCenter' => $defaultResearchCenter]);
        }

        // Get dynamic max file size from settings
        $maxFileSizeKB = SettingsHelper::getMaxFileSizeKB();
        
        try {
            $validated = $request->validate([
                'researchTitle' => 'required|string|max:255',
                'description' => 'required|string',
                'objectives' => 'required|string',
                'researchCenter' => 'required|string',
                'researchAgenda' => 'required|string', // Will be JSON string from frontend
                'dostSPs' => 'required|string', // Will be JSON string from frontend
                'sustainableDevelopmentGoals' => 'required|string', // Will be JSON string from frontend
                'proposedBudget' => 'required|numeric|min:0',
                'reportFile' => "required|file|mimes:pdf,doc,docx|max:{$maxFileSizeKB}",
                'setiScorecard' => "nullable|file|mimes:pdf,doc,docx|max:{$maxFileSizeKB}",
                'gadCertificate' => "nullable|file|mimes:pdf,doc,docx|max:{$maxFileSizeKB}",
                'matrixOfCompliance' => "nullable|file|mimes:pdf,doc,docx|max:{$maxFileSizeKB}",
                'supportingDocuments' => 'nullable|array|max:10',
                'supportingDocuments.*' => "file|mimes:pdf,doc,docx|max:{$maxFileSizeKB}",
            ]);
        } catch (ValidationException $e) {
            // Log validation errors for debugging
            if ($request->hasFile('matrixOfCompliance')) {
                $matrixFile = $request->file('matrixOfCompliance');
                Log::warning('Matrix of Compliance validation failed', [
                    'file_size' => $matrixFile->getSize(),
                    'file_mime' => $matrixFile->getMimeType(),
                    'file_extension' => $matrixFile->getClientOriginalExtension(),
                    'is_valid' => $matrixFile->isValid(),
                    'error_code' => $matrixFile->getError(),
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }

        try {
            $budgetBreakdown = $this->prepareBudgetBreakdown(
                $request->input('budgetBreakdown'),
                (float) $request->proposedBudget
            );

            // Parse JSON strings from frontend
            $researchAgenda = json_decode($request->researchAgenda, true);
            $dostSPs = json_decode($request->dostSPs, true);
            $sustainableDevelopmentGoals = json_decode($request->sustainableDevelopmentGoals, true);

            // Use researchCenter from request (already set in validation if not provided)
            $researchCenter = $request->input('researchCenter', $defaultResearchCenter);

            // Generate custom proposal ID
            $customProposalId = Proposal::generateCustomProposalId($user->userID, $researchCenter);

            // Create the proposal
            $proposal = Proposal::create([
                'custom_proposal_id' => $customProposalId,
                'researchTitle' => $request->researchTitle,
                'description' => $request->description,
                'objectives' => $request->objectives,
                'researchCenter' => $researchCenter,
                'researchAgenda' => $researchAgenda,
                'dostSPs' => $dostSPs,
                'sustainableDevelopmentGoals' => $sustainableDevelopmentGoals,
                'proposedBudget' => $request->proposedBudget,
                'budgetBreakdown' => $budgetBreakdown,
                'userID' => $user->userID,
                'statusID' => 1, // Assuming 1 is "Under Review" status
                'matrixOfCompliance' => [
                    'researchAgenda' => $researchAgenda,
                    'dostSPs' => $dostSPs,
                    'sustainableDevelopmentGoals' => $sustainableDevelopmentGoals,
                    'proposedBudget' => $request->proposedBudget,
                    'budgetBreakdown' => $budgetBreakdown,
                    'researchCenter' => $researchCenter,
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
                    try {
                        $file = $request->file($field);

                        // Validate file is valid and not empty
                        if (!$file->isValid()) {
                            Log::warning("Invalid file uploaded for field: {$field}", [
                                'proposalID' => $proposal->proposalID,
                                'error' => $file->getError()
                            ]);
                            continue; // Skip invalid files
                        }

                        $filename = time() . '_' . $file->getClientOriginalName();
                        $path = $file->storeAs('proposals/' . $proposal->proposalID, $filename, 'public');

                        $files[] = File::create([
                            'proposalID' => $proposal->proposalID,
                            'fileName' => $filename,
                            'filePath' => $path,
                            'fileType' => $type,
                            'fileSize' => $file->getSize()
                        ]);
                    } catch (\Exception $e) {
                        Log::error("Error uploading file for field: {$field}", [
                            'proposalID' => $proposal->proposalID,
                            'error' => $e->getMessage()
                        ]);
                        // Continue with other files even if one fails
                    }
                }
            }

            if ($request->hasFile('supportingDocuments')) {
                foreach ($request->file('supportingDocuments') as $file) {
                    if (!$file || !$file->isValid()) {
                        Log::warning("Invalid supporting document skipped", [
                            'proposalID' => $proposal->proposalID,
                            'error' => $file?->getError(),
                        ]);
                        continue;
                    }

                    try {
                        $filename = time() . '_' . $file->getClientOriginalName();
                        $path = $file->storeAs('proposals/' . $proposal->proposalID, $filename, 'public');

                        $files[] = File::create([
                            'proposalID' => $proposal->proposalID,
                            'fileName' => $filename,
                            'filePath' => $path,
                            'fileType' => 'supporting_document',
                            'fileSize' => $file->getSize()
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Error uploading supporting document', [
                            'proposalID' => $proposal->proposalID,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }

            // Save additional proponents if provided
            $proponentsData = $request->input('proponents');
            
            // Parse proponents data if it's a JSON string
            if (is_string($proponentsData)) {
                $proponentsData = json_decode($proponentsData, true);
            }
            
            $syncData = [];
            
            // Include the submitter with selected project role if provided
            $submitterProjectRoleID = $request->input('submitterProjectRoleID');
            $syncData[$user->userID] = ['projectRoleID' => $submitterProjectRoleID ?: null];
            
            if (!empty($proponentsData) && is_array($proponentsData)) {
                foreach ($proponentsData as $proponent) {
                    $userId = $proponent['userID'] ?? null;
                    $projectRoleID = $proponent['projectRoleID'] ?? null;
                    
                    if ($userId && $userId != $user->userID) {
                        $syncData[$userId] = ['projectRoleID' => $projectRoleID];
                    }
                }
            }
            
            $proposal->proponents()->sync($syncData);

            $proposal->load(['status', 'files']);

            // Dispatch the ProposalSubmitted event
            event(new ProposalSubmitted($proposal, $user));

            // Create notification for the proponent
            Notification::create([
                'userID' => $user->userID,
                'type' => 'success',
                'title' => 'Proposal Submitted Successfully',
                'message' => "Your proposal \"{$proposal->researchTitle}\" has been submitted for review.",
                'data' => [
                    'proposal_id' => $proposal->proposalID,
                    'proposal_title' => $proposal->researchTitle,
                    'event' => 'proposal.submitted'
                ]
            ]);

            // Find ALL CMs of the same research center and notify them
            $cmUsers = User::whereHas('role', function ($query) {
                $query->where('userRole', 'CM');
            })
                ->where('researchCenterID', $user->researchCenterID)
                ->get();

            // Notify all CMs in the department
            foreach ($cmUsers as $cmUser) {
                Notification::create([
                    'userID' => $cmUser->userID,
                    'type' => 'proposal_submitted',
                    'title' => 'New Proposal Submitted',
                    'message' => "A new proposal \"{$proposal->researchTitle}\" has been submitted by {$user->fullName} for review.",
                    'data' => [
                        'proposal_id' => $proposal->proposalID,
                        'proposal_title' => $proposal->researchTitle,
                        'proponent_name' => $user->fullName,
                        'event' => 'proposal.submitted.cm'
                    ]
                ]);
            }

            // Log notification creation for debugging
            if ($cmUsers->count() > 0) {
                Log::info('Notifications created for CMs', [
                    'proposalID' => $proposal->proposalID,
                    'researchCenterID' => $user->researchCenterID,
                    'cm_count' => $cmUsers->count(),
                    'cm_userIDs' => $cmUsers->pluck('userID')->toArray()
                ]);
            } else {
                Log::warning('No CM users found for research center', [
                    'proposalID' => $proposal->proposalID,
                    'researchCenterID' => $user->researchCenterID
                ]);
            }

            // Log successful proposal creation for debugging
            Log::info('Proposal created successfully', [
                'proposalID' => $proposal->proposalID,
                'userID' => $proposal->userID,
                'researchTitle' => $proposal->researchTitle,
                'statusID' => $proposal->statusID
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Proposal submitted successfully',
                'data' => $proposal
            ], 201);
        } catch (\Exception $e) {
            // Log the full error for debugging
            Log::error('Failed to create proposal', [
                'userID' => $user->userID ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

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
    public function update(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $user->loadMissing('role');

        // Find the proposal
        $proposal = Proposal::where('proposalID', $id)->with('user')->firstOrFail();

        // Authorization: Allow proposal owner, CM (for their research center), and RDD (for all)
        $canEdit = match ($user->role?->userRole) {
            'RDD' => true, // RDD can edit all proposals
            'CM' => $proposal->user?->researchCenterID === $user->researchCenterID, // CM can edit proposals from their research center
            default => $proposal->userID === $user->userID, // Others can only edit their own
        };

        if (!$canEdit) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to edit this proposal'
            ], 403);
        }

        // Get dynamic max file size from settings
        $maxFileSizeKB = SettingsHelper::getMaxFileSizeKB();
        
        $validated = $request->validate([
            'researchTitle' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'objectives' => 'sometimes|string',
            'researchCenter' => 'sometimes|string',
            'researchAgenda' => 'sometimes|array',
            'dostSPs' => 'sometimes|array',
            'sustainableDevelopmentGoals' => 'sometimes|array',
            'proposedBudget' => 'sometimes|numeric|min:0',
            'budgetBreakdown' => 'sometimes|array',
            'statusID' => 'sometimes|integer',
            'revisionComments' => 'sometimes|string|nullable',
            'updatedForm' => "nullable|file|mimes:pdf,doc,docx|max:{$maxFileSizeKB}"
        ]);

        try {
            $updateData = [];
            
            // Only include fields that were sent
            if ($request->has('researchTitle')) $updateData['researchTitle'] = $request->researchTitle;
            if ($request->has('description')) $updateData['description'] = $request->description;
            if ($request->has('objectives')) $updateData['objectives'] = $request->objectives;
            if ($request->has('researchCenter')) $updateData['researchCenter'] = $request->researchCenter;
            if ($request->has('researchAgenda')) $updateData['researchAgenda'] = $request->researchAgenda;
            if ($request->has('dostSPs')) $updateData['dostSPs'] = $request->dostSPs;
            if ($request->has('sustainableDevelopmentGoals')) $updateData['sustainableDevelopmentGoals'] = $request->sustainableDevelopmentGoals;
            if ($request->has('proposedBudget')) $updateData['proposedBudget'] = $request->proposedBudget;
            if ($request->has('statusID')) $updateData['statusID'] = $request->statusID;

            // Handle file upload if provided
            if ($request->hasFile('updatedForm')) {
                $file = $request->file('updatedForm');
                $fileName = 'updated_form_' . time() . '.' . $file->getClientOriginalExtension();
                $filePath = $file->storeAs('proposals/' . $proposal->proposalID, $fileName, 'public');

                // Create file record
                File::create([
                    'proposalID' => $proposal->proposalID,
                    'fileName' => $fileName,
                    'filePath' => $filePath,
                    'fileType' => 'updated_form',
                    'fileSize' => $file->getSize(),
                ]);
            }

            $proposedBudget = isset($updateData['proposedBudget'])
                ? (float) $updateData['proposedBudget']
                : (float) $proposal->proposedBudget;

            if ($request->has('budgetBreakdown')) {
                $updateData['budgetBreakdown'] = $this->prepareBudgetBreakdown(
                    $request->input('budgetBreakdown'),
                    $proposedBudget
                );
            } elseif ($request->has('proposedBudget')) {
                $updateData['budgetBreakdown'] = $this->generateDefaultBudgetBreakdown($proposedBudget);
            }

            // Track status change before updating
            $wasRevisionStatusChange = $request->has('statusID')
                && (int) $request->statusID === 4
                && (int) $proposal->statusID !== 4;

            // Track when resubmitting after revision
            $isResubmitAfterRevision = $request->has('statusID') && $request->statusID == 1 && (int) $proposal->statusID === 4;

            $proposal->update($updateData);
            $proposal->load([
                'status',
                'files',
                'user.department',
                'user.role',
                'proponents',
                'proponents.role'
            ]);

            // Load project roles for proponents
            $proposal->proponents->each(function ($proponent) {
                if ($proponent->pivot->projectRoleID) {
                    $projectRole = \App\Models\ProjectRole::find($proponent->pivot->projectRoleID);
                    $proponent->projectRole = $projectRole;
                }
            });

            // Notify proponent when CM sets proposal to revision and include comments
            if ($wasRevisionStatusChange) {
                $revisionComments = $request->input('revisionComments');
                $message = $revisionComments
                    ? "For revision: {$revisionComments}"
                    : 'Your proposal requires revision. Please check the details and resubmit.';

                Notification::create([
                    'userID' => $proposal->userID,
                    'type' => 'revision',
                    'title' => 'Proposal Sent for Revision',
                    'message' => $message,
                    'data' => [
                        'proposal_id' => $proposal->proposalID,
                        'proposal_title' => $proposal->researchTitle,
                        'revision_comments' => $revisionComments,
                        'event' => 'proposal.revision_required'
                    ]
                ]);
            }

            // Notify CM when proposal is resubmitted after revision
            if ($isResubmitAfterRevision) {
                $cmUsers = User::whereHas('role', function ($query) {
                    $query->where('userRole', 'CM');
                })
                    ->where('researchCenterID', $proposal->user->researchCenterID)
                    ->get();

                foreach ($cmUsers as $cmUser) {
                    Notification::create([
                        'userID' => $cmUser->userID,
                        'type' => 'proposal',
                        'title' => 'Revised Proposal Resubmitted',
                        'message' => "{$proposal->user->fullName} resubmitted \"{$proposal->researchTitle}\" after revision. Please review the updated proposal.",
                        'data' => [
                            'proposal_id' => $proposal->proposalID,
                            'proposal_title' => $proposal->researchTitle,
                            'proponent_name' => $proposal->user->fullName,
                            'event' => 'proposal.resubmitted_after_revision',
                            'is_resubmission' => true
                        ]
                    ]);
                }
            }

            // Clear cache for this proposal for all users
            $this->clearProposalCache($id);

            return response()->json([
                'success' => true,
                'message' => 'Proposal updated successfully',
                'data' => $proposal
            ]);
        } catch (\Exception $e) {
            Log::error('Proposal update failed', [
                'proposal_id' => $id,
                'user_id' => $user->userID,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

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
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();

        $proposal = Proposal::where('proposalID', $id)
            ->where('userID', $user->userID)
            ->firstOrFail();

        try {
            // Delete associated files from storage
            foreach ($proposal->files as $file) {
                Storage::disk('public')->delete($file->filePath);
                $file->delete();
            }

            // Delete proposal directory
            Storage::disk('public')->deleteDirectory('proposals/' . $proposal->proposalID);

            $proposal->delete();

            // Clear cache for this proposal
            $this->clearProposalCache($id);

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
        $user->loadMissing('role');

        // For RDD users, count only archived (endorsed) proposals; for CM users, show proposals from their department; for others, show only their own
        $query = Proposal::query();

        // Apply authorization filters based on user role
        $userRole = $user->role?->userRole;
        if ($userRole === 'RDD') {
            $query->whereNotNull('archivedByRDD'); // RDD users see statistics for archived (endorsed) proposals only
        } elseif ($userRole === 'CM') {
            $query->whereHas('user', fn($q) => $q->where('researchCenterID', $user->researchCenterID));
        } else {
            $query->where('userID', $user->userID);
        }

        $stats = [
            'total' => $query->count(),
            'under_review' => (clone $query)->where('statusID', 1)->count(),
            'approved' => (clone $query)->where('statusID', 2)->count(),
            'rejected' => (clone $query)->where('statusID', 3)->count(),
            'ongoing' => (clone $query)->where('statusID', 4)->count(),
            'completed' => (clone $query)->where('statusID', 5)->count()
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get RDD analytics data for statistics dashboard
     */
    public function rddAnalytics(Request $request): JsonResponse
    {
        $user = Auth::user();
        $user->loadMissing('role');

        // For RDD users, show all proposals; for others, show only their own
        $query = Proposal::with(['status', 'user.department']);

        if ($user->role?->userRole !== 'RDD') {
            $query->where('userID', $user->userID);
        }

        $proposals = $query->get();

        // RDE Agenda data
        $rdeAgendaData = $this->getRdeAgendaData($proposals);

        // DOST 6Ps data
        $dost6PsData = $this->getDost6PsData($proposals);

        // SDG data
        $sdgData = $this->getSdgData($proposals);

        // Overview stats
        $totalProposals = $proposals->count();
        $totalOngoing = $proposals->where('statusID', 4)->count();
        $totalCompleted = $proposals->where('statusID', 5)->count();
        $completionRate = $totalProposals > 0 ? round(($totalCompleted / $totalProposals) * 100) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'overview' => [
                    'totalProposals' => $totalProposals,
                    'totalOngoing' => $totalOngoing,
                    'totalCompleted' => $totalCompleted,
                    'completionRate' => $completionRate
                ],
                'rdeAgenda' => $rdeAgendaData,
                'dost6Ps' => $dost6PsData,
                'sdg' => $sdgData
            ]
        ]);
    }

    /**
     * Get proposals that have been endorsed by CM (Center Manager)
     * Only returns proposals with approved endorsements from CM users
     */
    public function getCmEndorsedProposals(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $user->loadMissing('role');

            // Only RDD users can access this endpoint
            if ($user->role?->userRole !== 'RDD') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only RDD users can access this endpoint.'
                ], 403);
            }

            // Get proposals that have been endorsed by CM users with status 'approved'
            // First, get all CM user IDs
            $cmUserIds = User::whereHas('role', function ($q) {
                $q->where('userRole', 'CM');
            })->pluck('userID');

            // Get RDD user IDs
            $rddUserIds = User::whereHas('role', function ($q) {
                $q->where('userRole', 'RDD');
            })->pluck('userID');

            // Get proposals that have approved endorsements from CM users
            // but NOT yet endorsed by RDD users, and are not archived
            $proposals = Proposal::with(['status', 'files', 'user.department', 'user.role', 'endorsements.endorser.role'])
                ->whereNull('archivedByRDD')
                ->whereHas('endorsements', function ($query) use ($cmUserIds) {
                    $query->where('endorsementStatus', 'approved')
                        ->whereIn('endorserID', $cmUserIds);
                })
                ->whereDoesntHave('endorsements', function ($query) use ($rddUserIds) {
                    $query->where('endorsementStatus', 'approved')
                        ->whereIn('endorserID', $rddUserIds);
                })
                ->orderBy('proposalID', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $proposals
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch CM-endorsed proposals',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get proposals that have been endorsed by RDD (Research & Development Division)
     * Only returns proposals with approved endorsements from RDD users
     */
    public function getRddEndorsedProposals(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $user->loadMissing('role');

            // Only RDD users can access this endpoint
            if ($user->role?->userRole !== 'RDD') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only RDD users can access this endpoint.'
                ], 403);
            }

            // Get proposals that have been archived by RDD (endorsed with approved status)
            // These are proposals where archivedByRDD timestamp is set
            $proposals = Proposal::with(['status', 'files', 'user.department', 'user.researchCenter', 'user.role', 'endorsements.endorser.role', 'proponents'])
                ->whereNotNull('archivedByRDD')
                ->orderByDesc('archivedByRDD')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $proposals
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch RDD-endorsed proposals',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get RDE Agenda data from proposals
     */
    private function getRdeAgendaData($proposals)
    {
        $officialAgendas = [
            'Agriculture, Aquatic, and Agro-Forestry',
            'Business and Trade',
            'Social Sciences and Education',
            'Engineering and Technology',
            'Environment and Natural Resources',
            'Health and Wellness',
            'Peace and Security',
        ];

        $officialData = collect($officialAgendas)
            ->mapWithKeys(function ($agenda) {
                return [$agenda => [
                    'name' => $agenda,
                    'ongoing' => 0,
                    'completed' => 0,
                    'other' => 0,
                    'rawTotal' => 0,
                ]];
            })
            ->all();

        $additionalData = [];

        foreach ($proposals as $proposal) {
            $agendas = $proposal->researchAgenda ?? [];
            $status = $proposal->statusID;

            foreach ($agendas as $agenda) {
                $match = $this->matchOfficialAgenda($agenda, $officialAgendas);
                $key = $match ?? $this->formatAgendaLabel($agenda);

                $bucket = $match !== null ? $officialData[$match] : ($additionalData[$key] ?? [
                    'name' => $key,
                    'ongoing' => 0,
                    'completed' => 0,
                    'other' => 0,
                    'rawTotal' => 0,
                ]);

                $bucket['rawTotal']++;

                if ($status === 4) {
                    $bucket['ongoing']++;
                } elseif ($status === 5) {
                    $bucket['completed']++;
                } else {
                    $bucket['other']++;
                }

                if ($match !== null) {
                    $officialData[$match] = $bucket;
                } else {
                    $additionalData[$key] = $bucket;
                }
            }
        }

        return collect($officialData)
            ->merge($additionalData)
            ->filter(fn($item) => ($item['ongoing'] + $item['completed'] + $item['other']) > 0)
            ->map(function ($item) {
                $item['total'] = $item['ongoing'] + $item['completed'];
                unset($item['rawTotal']);
                return $item;
            })
            ->values()
            ->all();
    }

    /**
     * Get DOST 6Ps data from proposals
     */
    private function getDost6PsData($proposals)
    {
        $officialCategories = [
            'Publications' => 0,
            'Patent' => 0,
            'Product' => 0,
            'People Services' => 0,
            'Places and Partnership' => 0,
            'Policies' => 0,
        ];

        $additionalCategories = [];

        foreach ($proposals as $proposal) {
            $dostSPs = $proposal->dostSPs ?? [];

            foreach ($dostSPs as $dostSP) {
                $category = $this->mapDostValueToCategory($dostSP);

                if ($category !== null && array_key_exists($category, $officialCategories)) {
                    $officialCategories[$category]++;
                } else {
                    $label = $this->formatDostLabel($dostSP);
                    if (!isset($additionalCategories[$label])) {
                        $additionalCategories[$label] = 0;
                    }
                    $additionalCategories[$label]++;
                }
            }
        }

        $data = collect($officialCategories)
            ->map(function ($count, $name) {
                return ['name' => $name, 'value' => $count];
            })
            ->filter(fn($item) => $item['value'] > 0)
            ->values();

        foreach ($additionalCategories as $label => $count) {
            if ($count > 0) {
                $data->push(['name' => $label, 'value' => $count]);
            }
        }

        return $data
            ->sortByDesc('value')
            ->values()
            ->all();
    }

    /**
     * Get SDG data from proposals
     */
    private function getSdgData($proposals)
    {
        $sdgMeta = [
            '1' => ['fullName' => 'No Poverty', 'color' => '#E5243B'],
            '2' => ['fullName' => 'Zero Hunger', 'color' => '#DDA63A'],
            '3' => ['fullName' => 'Good Health and Well-being', 'color' => '#4C9F38'],
            '4' => ['fullName' => 'Quality Education', 'color' => '#C5192D'],
            '5' => ['fullName' => 'Gender Equality', 'color' => '#FF3A21'],
            '6' => ['fullName' => 'Clean Water and Sanitation', 'color' => '#26BDE2'],
            '7' => ['fullName' => 'Affordable and Clean Energy', 'color' => '#FCC30B'],
            '8' => ['fullName' => 'Decent Work and Economic Growth', 'color' => '#A21942'],
            '9' => ['fullName' => 'Industry, Innovation and Infrastructure', 'color' => '#FD6925'],
            '10' => ['fullName' => 'Reduced Inequalities', 'color' => '#DD1367'],
            '11' => ['fullName' => 'Sustainable Cities and Communities', 'color' => '#FD9D24'],
            '12' => ['fullName' => 'Responsible Consumption and Production', 'color' => '#BF8B2E'],
            '13' => ['fullName' => 'Climate Action', 'color' => '#3F7E44'],
            '14' => ['fullName' => 'Life Below Water', 'color' => '#0A97D9'],
            '15' => ['fullName' => 'Life on Land', 'color' => '#56C02B'],
            '16' => ['fullName' => 'Peace, Justice and Strong Institutions', 'color' => '#00689D'],
            '17' => ['fullName' => 'Partnerships for the Goals', 'color' => '#19486A'],
        ];

        $sdgCounts = [];

        foreach ($proposals as $proposal) {
            $sdgs = $proposal->sustainableDevelopmentGoals ?? [];

            foreach ($sdgs as $sdg) {
                $sdgNumber = $this->extractSdgNumber($sdg);

                if ($sdgNumber === null) {
                    continue;
                }

                if (!isset($sdgCounts[$sdgNumber])) {
                    $sdgCounts[$sdgNumber] = 0;
                }

                $sdgCounts[$sdgNumber]++;
            }
        }

        // If nothing matched, return an empty collection so the frontend can render a fallback state
        if (empty($sdgCounts)) {
            return [];
        }

        // Sort SDGs by value (desc) then by SDG number (asc) for consistent ordering
        arsort($sdgCounts);

        return collect($sdgCounts)
            ->map(function ($count, $sdgNumber) use ($sdgMeta) {
                $meta = $sdgMeta[$sdgNumber] ?? [
                    'fullName' => "SDG {$sdgNumber}",
                    'color' => '#4B5563', // Neutral gray fallback
                ];

                return [
                    'name' => (string) $sdgNumber,
                    'fullName' => $meta['fullName'],
                    'color' => $meta['color'],
                    'value' => $count,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Attempt to normalize SDG identifiers from stored proposal data.
     */
    private function extractSdgNumber($sdg): ?string
    {
        if (is_array($sdg)) {
            // Support formats like ['id' => 4, 'label' => 'Quality Education']
            if (isset($sdg['id'])) {
                return (string) $sdg['id'];
            }

            if (isset($sdg['value'])) {
                return $this->extractSdgNumber($sdg['value']);
            }
        }

        if (is_numeric($sdg)) {
            $sdgNumber = (int) $sdg;
            return $sdgNumber >= 1 && $sdgNumber <= 17 ? (string) $sdgNumber : null;
        }

        if (is_string($sdg)) {
            // Match patterns like "SDG 4: Quality Education" or "SDG 4"
            if (preg_match('/SDG\s*(\d{1,2})/i', $sdg, $matches)) {
                return $matches[1];
            }

            // Match patterns like "Goal 4" or "Goal-4"
            if (preg_match('/Goal[\s\-]*(\d{1,2})/i', $sdg, $matches)) {
                return $matches[1];
            }

            // Finally, check for raw digit strings
            if (preg_match('/^(\d{1,2})$/', trim($sdg), $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    /**
     * Attempt to match a research agenda entry to the official list.
     */
    private function matchOfficialAgenda($agenda, array $officialAgendas): ?string
    {
        if (!is_string($agenda)) {
            return null;
        }

        foreach ($officialAgendas as $official) {
            if (strcasecmp($agenda, $official) === 0) {
                return $official;
            }

            // Handle cases where the stored agenda contains the official label as a substring
            if (stripos($agenda, $official) !== false) {
                return $official;
            }
        }

        return null;
    }

    /**
     * Produce a clean label for non-standard research agenda entries.
     */
    private function formatAgendaLabel($agenda): string
    {
        if (is_string($agenda)) {
            return Str::title(trim($agenda));
        }

        if (is_array($agenda)) {
            return Str::title(trim(implode(', ', $agenda)));
        }

        return 'Other Research Agenda';
    }

    /**
     * Map potential DOST SP values to the official 6Ps categories.
     */
    private function mapDostValueToCategory($value): ?string
    {
        if (is_array($value)) {
            $value = $value['label'] ?? $value['name'] ?? $value['value'] ?? null;
        }

        if (!is_string($value)) {
            return null;
        }

        $normalized = Str::lower($value);

        if (str_contains($normalized, 'publication')) {
            return 'Publications';
        }

        if (str_contains($normalized, 'patent')) {
            return 'Patent';
        }

        if (str_contains($normalized, 'product')) {
            return 'Product';
        }

        if (str_contains($normalized, 'people') || str_contains($normalized, 'service')) {
            return 'People Services';
        }

        if (str_contains($normalized, 'place') || str_contains($normalized, 'partner')) {
            return 'Places and Partnership';
        }

        if (str_contains($normalized, 'policy')) {
            return 'Policies';
        }

        return null;
    }

    /**
     * Format additional DOST SP labels for display.
     */
    private function formatDostLabel($value): string
    {
        if (is_array($value)) {
            $value = $value['label'] ?? $value['name'] ?? $value['value'] ?? null;
        }

        if (is_string($value) && trim($value) !== '') {
            return Str::title(trim($value));
        }

        return 'Other DOST Priorities';
    }

    private function prepareBudgetBreakdown($input, float $total): ?array
    {
        if (is_array($input) && !empty($input)) {
            $normalized = [];
            foreach ($input as $key => $value) {
                if (is_array($value) && isset($value['amount'])) {
                    $normalized[$key] = round((float) $value['amount'], 2);
                } elseif (is_numeric($value)) {
                    $normalized[$key] = round((float) $value, 2);
                }
            }

            if (!empty($normalized)) {
                return $normalized;
            }
        }

        if ($total <= 0) {
            return null;
        }

        return $this->generateDefaultBudgetBreakdown($total);
    }

    private function generateDefaultBudgetBreakdown(float $total): array
    {
        $breakdown = [
            'personnel' => round($total * 0.5, 2),
            'equipment' => round($total * 0.2, 2),
            'materials' => round($total * 0.15, 2),
            'travel' => round($total * 0.1, 2),
            'other' => round($total * 0.05, 2),
        ];

        $allocated = array_sum($breakdown);
        $difference = round($total - $allocated, 2);
        if ($difference !== 0.0) {
            $breakdown['other'] += $difference;
        }

        return $breakdown;
    }

    /**
     * Get analytics data for RDD users
     */
    public function getRddAnalytics(Request $request): JsonResponse
    {
        $user = Auth::user();
        $user->loadMissing('role');

        // Only RDD users can access this endpoint
        if ($user->role?->userRole !== 'RDD') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        // Include all proposals (not just archived) so analytics reflects current pipeline
        $query = Proposal::with(['status', 'endorsements', 'user.researchCenter', 'user.department']);
        
        // Filter by research center if provided
        if ($request->has('centerID') && $request->centerID) {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('researchCenterID', $request->centerID);
            });
        }
        
        // Filter by department if provided
        if ($request->has('departmentID') && $request->departmentID) {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('departmentID', $request->departmentID);
            });
        }
        
        $proposals = $query->get();

        $totalProposals = $proposals->count();
        $totalOngoing = 0;
        $totalCompleted = 0;

        // Initialize aggregation maps
        $rdeAgendaMap = [];
        $dost6PsMap = [];
        $sdgMap = [];

        foreach ($proposals as $proposal) {
            // Determine completion based on status
            $statusName = strtolower($proposal->status->statusName ?? '');
            $isCompleted = in_array($proposal->statusID, [5]) // Approved
                || str_contains($statusName, 'approved')
                || str_contains($statusName, 'endorsed')
                || str_contains($statusName, 'completed');

            $statusBucket = $isCompleted ? 'completed' : 'ongoing';
            $isCompleted ? $totalCompleted++ : $totalOngoing++;

            // Get matrixOfCompliance once for all data extraction
            $rawMatrix = $proposal->getRawOriginal('matrixOfCompliance');
            $matrixOfCompliance = null;
            if ($rawMatrix) {
                if (is_string($rawMatrix)) {
                    $matrixOfCompliance = json_decode($rawMatrix, true);
                } else {
                    $matrixOfCompliance = $rawMatrix;
                }
            }

            // Get research agenda - check matrixOfCompliance first, then direct column
            $researchAgenda = null;
            
            // Check matrixOfCompliance directly (bypass accessor)
            if ($matrixOfCompliance && is_array($matrixOfCompliance) && isset($matrixOfCompliance['researchAgenda']) && !empty($matrixOfCompliance['researchAgenda'])) {
                $researchAgenda = $matrixOfCompliance['researchAgenda'];
            }
            
            // If still empty, try the accessor (which also reads from matrixOfCompliance)
            if (empty($researchAgenda)) {
                $matrixAgenda = $proposal->researchAgenda;
                if (!empty($matrixAgenda) && is_array($matrixAgenda)) {
                    $researchAgenda = $matrixAgenda;
                }
            }
            
            // Final fallback to direct column
            if (empty($researchAgenda)) {
                $rawAgenda = $proposal->getRawOriginal('researchAgenda');
                if ($rawAgenda !== null) {
                    if (is_string($rawAgenda)) {
                        $decoded = json_decode($rawAgenda, true);
                        $researchAgenda = json_last_error() === JSON_ERROR_NONE && is_array($decoded) && !empty($decoded) ? $decoded : null;
                    } elseif (is_array($rawAgenda) && !empty($rawAgenda)) {
                        $researchAgenda = $rawAgenda;
                    }
                }
            }
            
            // Aggregate by Research Agenda
            if ($researchAgenda && is_array($researchAgenda) && !empty($researchAgenda)) {
                foreach ($researchAgenda as $agenda) {
                    $normalizedAgenda = is_string($agenda) ? trim($agenda) : (is_array($agenda) ? ($agenda['name'] ?? $agenda['value'] ?? null) : $agenda);
                    if ($normalizedAgenda === '' || $normalizedAgenda === null) {
                        continue;
                    }
                    if (!isset($rdeAgendaMap[$normalizedAgenda])) {
                        $rdeAgendaMap[$normalizedAgenda] = ['ongoing' => 0, 'completed' => 0];
                    }
                    $rdeAgendaMap[$normalizedAgenda][$statusBucket]++;
                }
            }

            // Get DOST 6Ps - check matrixOfCompliance first, then direct column
            $dostSPs = null;
            
            // Check matrixOfCompliance directly (bypass accessor)
            if ($matrixOfCompliance && is_array($matrixOfCompliance) && isset($matrixOfCompliance['dostSPs']) && !empty($matrixOfCompliance['dostSPs'])) {
                $dostSPs = $matrixOfCompliance['dostSPs'];
            }
            
            // If still empty, try the accessor
            if (empty($dostSPs)) {
                $matrixDost = $proposal->dostSPs;
                if (!empty($matrixDost) && is_array($matrixDost)) {
                    $dostSPs = $matrixDost;
                }
            }
            
            // Final fallback to direct column
            if (empty($dostSPs)) {
                $rawDost = $proposal->getRawOriginal('dostSPs');
                if ($rawDost !== null) {
                    if (is_string($rawDost)) {
                        $decoded = json_decode($rawDost, true);
                        $dostSPs = json_last_error() === JSON_ERROR_NONE && is_array($decoded) && !empty($decoded) ? $decoded : null;
                    } elseif (is_array($rawDost) && !empty($rawDost)) {
                        $dostSPs = $rawDost;
                    }
                }
            }
            
            // Aggregate by DOST 6Ps
            if ($dostSPs && is_array($dostSPs) && !empty($dostSPs)) {
                foreach ($dostSPs as $dost) {
                    $normalizedDost = is_string($dost) ? trim($dost) : (is_array($dost) ? ($dost['name'] ?? $dost['value'] ?? null) : $dost);
                    if ($normalizedDost === '' || $normalizedDost === null) {
                        continue;
                    }
                    if (!isset($dost6PsMap[$normalizedDost])) {
                        $dost6PsMap[$normalizedDost] = 0;
                    }
                    $dost6PsMap[$normalizedDost]++;
                }
            }

            // Get SDG - check matrixOfCompliance first, then direct column
            $sdgGoals = null;
            
            // Check matrixOfCompliance directly (bypass accessor)
            if ($matrixOfCompliance && is_array($matrixOfCompliance) && isset($matrixOfCompliance['sustainableDevelopmentGoals']) && !empty($matrixOfCompliance['sustainableDevelopmentGoals'])) {
                $sdgGoals = $matrixOfCompliance['sustainableDevelopmentGoals'];
            }
            
            // If still empty, try the accessor
            if (empty($sdgGoals)) {
                $matrixSdg = $proposal->sustainableDevelopmentGoals;
                if (!empty($matrixSdg) && is_array($matrixSdg)) {
                    $sdgGoals = $matrixSdg;
                }
            }
            
            // Final fallback to direct column
            if (empty($sdgGoals)) {
                $rawSdg = $proposal->getRawOriginal('sustainableDevelopmentGoals');
                if ($rawSdg !== null) {
                    if (is_string($rawSdg)) {
                        $decoded = json_decode($rawSdg, true);
                        $sdgGoals = json_last_error() === JSON_ERROR_NONE && is_array($decoded) && !empty($decoded) ? $decoded : null;
                    } elseif (is_array($rawSdg) && !empty($rawSdg)) {
                        $sdgGoals = $rawSdg;
                    }
                }
            }
            
            // Aggregate by SDG
            if ($sdgGoals && is_array($sdgGoals) && !empty($sdgGoals)) {
                foreach ($sdgGoals as $sdg) {
                    $normalizedSdg = is_string($sdg) ? trim($sdg) : (is_array($sdg) ? ($sdg['name'] ?? $sdg['value'] ?? $sdg['goal'] ?? null) : $sdg);
                    if ($normalizedSdg === '' || $normalizedSdg === null) {
                        continue;
                    }
                    // Normalize SDG format (handle "1", "SDG 1", "SDG1", etc.)
                    $normalizedSdg = preg_replace('/^sdg\s*/i', '', (string)$normalizedSdg);
                    $normalizedSdg = trim($normalizedSdg);
                    if (!isset($sdgMap[$normalizedSdg])) {
                        $sdgMap[$normalizedSdg] = 0;
                    }
                    $sdgMap[$normalizedSdg]++;
                }
            }
        }

        // Format RDE Agenda data
        $rdeAgenda = [];
        foreach ($rdeAgendaMap as $name => $counts) {
            $rdeAgenda[] = [
                'name' => $name,
                'ongoing' => $counts['ongoing'],
                'completed' => $counts['completed'],
                'total' => $counts['ongoing'] + $counts['completed']
            ];
        }

        // Format DOST 6Ps data
        $dost6Ps = [];
        foreach ($dost6PsMap as $name => $value) {
            $dost6Ps[] = [
                'name' => $name,
                'value' => $value
            ];
        }

        // Format SDG data
        $sdg = [];
        foreach ($sdgMap as $name => $value) {
            $sdg[] = [
                'name' => $name,
                'value' => $value
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'overview' => [
                    'totalProposals' => $totalProposals,
                    'totalOngoing' => $totalOngoing,
                    'totalCompleted' => $totalCompleted
                ],
                'rdeAgenda' => $rdeAgenda,
                'dost6Ps' => $dost6Ps,
                'sdg' => $sdg
            ]
        ]);
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
