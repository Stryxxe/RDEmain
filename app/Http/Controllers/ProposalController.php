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
use Illuminate\Support\Facades\DB;
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
                'user.researchCenter:centerID,name',
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
                // Exclude archived proposals
                $query->whereNull('archivedByRDD');
                
                // Only show proposals that have been endorsed by CM (Center Manager)
                // Get all CM user IDs
                $cmUserIds = User::whereHas('role', function($q) {
                    $q->where('userRole', 'CM');
                })->pluck('userID')->toArray();
                
                // Only show proposals with approved endorsements from CM users
                $query->whereHas('endorsements', function ($q) use ($cmUserIds) {
                    $q->whereIn('endorserID', $cmUserIds)
                      ->where('endorsementStatus', 'approved');
                });
                
                // Exclude proposals that RDD has already endorsed/archived
                $rddUserIds = User::whereHas('role', function($q) {
                    $q->where('userRole', 'RDD');
                })->pluck('userID')->toArray();
                
                $query->whereDoesntHave('endorsements', function ($q) use ($rddUserIds) {
                    $q->whereIn('endorserID', $rddUserIds)
                      ->where('endorsementStatus', 'approved');
                });
                
                // Exclude proposals sent for revision (statusID = 4)
                // These proposals should only appear in the For Revision page
                $query->where('statusID', '!=', 4);
                
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
                // Show submitted proposals from same research center
                // For Dashboard and Endorsement view:
                // - Show proposals with statusID != 4 (normal flow), OR
                // - Show proposals with statusID 4 that have been endorsed once (from For Revision Accept button)
                //   These need to appear in Endorsement view for final checking
                if ($user->researchCenterID) {
                    // Filter by research center first
                    $query->whereHas('user', function($q) use ($user) {
                        $q->where('researchCenterID', $user->researchCenterID);
                    });
                    
                    // Get RDD user IDs for filtering
                    $rddUserIds = User::whereHas('role', function($q) {
                        $q->where('userRole', 'RDD');
                    })->pluck('userID')->toArray();
                    
                    // Show proposals that:
                    // 1. Have statusID = 1 (Under Review) - includes resubmitted proposals
                    // 2. Have statusID 4 AND have been endorsed once by this CM (from For Revision Accept)
                    //    This allows proposals from For Revision to appear in Endorsement view for final checking
                    // CRITICAL: EXCLUDE proposals where this CM has endorsed twice (forwarded to RDD)
                    // This removal happens IMMEDIATELY when CM endorses twice - does NOT wait for RDD endorsement
                    $query->where(function($q) use ($user) {
                        $q->where(function($statusQ) use ($user) {
                            // StatusID = 1 proposals (includes resubmitted)
                            $statusQ->where('statusID', 1)
                                    // CRITICAL: Exclude if CM has endorsed twice (count >= 2)
                                    // This ensures immediate removal when CM forwards to RDD
                                    ->whereRaw('(SELECT COUNT(*) FROM endorsements WHERE endorsements.proposalID = proposals.proposalID AND endorsements.endorserID = ? AND endorsements.endorsementStatus = ?) < 2', 
                                        [$user->userID, 'approved']);
                        })
                        ->orWhere(function($subQ) use ($user) {
                            // StatusID = 4 proposals that have been endorsed once (from Accept button)
                            $subQ->where('statusID', 4)
                                 ->whereRaw('(SELECT COUNT(*) FROM endorsements WHERE endorsements.proposalID = proposals.proposalID AND endorsements.endorserID = ? AND endorsements.endorsementStatus = ?) = 1', 
                                     [$user->userID, 'approved']);
                        });
                    });
                    
                    // Exclude proposals that have been forwarded to RDD (have RDD endorsement)
                    $query->whereDoesntHave('endorsements', function ($q) use ($rddUserIds) {
                        $q->whereIn('endorserID', $rddUserIds)
                          ->where('endorsementStatus', 'approved');
                    });
                    
                    // Log for debugging
                    Log::info('CM Dashboard Query Applied', [
                        'user_id' => $user->userID,
                        'research_center_id' => $user->researchCenterID,
                        'role' => $role,
                        'query_sql' => $query->toSql(),
                        'query_bindings' => $query->getBindings()
                    ]);
                } else {
                    // If CM has no research center assigned, return empty set
                    $query->whereRaw('1=0');
                    Log::warning('CM user has no research center assigned', [
                        'user_id' => $user->userID
                    ]);
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

            $response = [
                'success' => true,
                'data' => $proposals
            ];
            
            return response()->json($response);
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
        
        // If request has 'force_refresh' parameter, bypass cache to get fresh data
        // This is important when viewing resubmitted proposals to see updated information
        $forceRefresh = $request->has('force_refresh') && $request->force_refresh;
        
        if ($forceRefresh) {
            // Clear cache first to ensure fresh data
            Cache::forget($cacheKey);
        }
        
        // Cache for 2 minutes - balance between performance and data freshness
        // If force_refresh is true, we'll fetch fresh data (cache was cleared above)
        $proposal = Cache::remember($cacheKey, $forceRefresh ? 0 : 120, function () use ($id, $user, $forceRefresh) {
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
                // CM users can see proposals from their research center
                // Allow viewing proposals even if already endorsed (for reference)
                // But in dashboard (index), we filter to only show submitted proposals needing endorsement
                if ($user->researchCenterID) {
                    $query->whereHas('user', fn($q) => $q->where('researchCenterID', $user->researchCenterID));
                } else {
                    // If CM has no research center assigned, return empty set
                    $query->whereRaw('1=0');
                }
            } else {
                $query->whereHas('proponents', fn($q) => $q->where('users.userID', $user->userID));
            }

            $result = $query->firstOrFail();
            
            // CRITICAL: When force_refresh is true, ensure files are loaded with a fresh query
            // This is especially important after file uploads to ensure CM sees updated files
            if ($forceRefresh) {
                // Force a fresh query for files to bypass any relationship cache
                $freshFiles = \App\Models\File::where('proposalID', $id)
                    ->orderBy('created_at', 'desc')
                    ->get();
                $result->setRelation('files', $freshFiles);
                
                Log::info('Force refresh - loaded fresh files', [
                    'proposal_id' => $id,
                    'files_count' => $freshFiles->count(),
                    'file_types' => $freshFiles->pluck('fileType')->toArray()
                ]);
            }
            
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
                'supportingDocuments.*' => "file|max:{$maxFileSizeKB}",
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
            
            // Log supporting documents validation errors
            if ($request->hasFile('supportingDocuments')) {
                $supportingDocs = $request->file('supportingDocuments');
                foreach ($supportingDocs as $index => $file) {
                    if ($file) {
                        Log::warning("Supporting document {$index} validation failed", [
                            'file_name' => $file->getClientOriginalName(),
                            'file_size' => $file->getSize(),
                            'file_mime' => $file->getMimeType(),
                            'file_extension' => $file->getClientOriginalExtension(),
                            'is_valid' => $file->isValid(),
                            'error_code' => $file->getError(),
                        ]);
                    }
                }
            }

            // Log supporting documents validation errors
            if ($request->hasFile('supportingDocuments')) {
                $supportingDocs = $request->file('supportingDocuments');
                if (is_array($supportingDocs)) {
                    foreach ($supportingDocs as $index => $file) {
                        if ($file) {
                            Log::warning("Supporting document {$index} validation failed", [
                                'file_name' => $file->getClientOriginalName(),
                                'file_size' => $file->getSize(),
                                'file_mime' => $file->getMimeType(),
                                'file_extension' => $file->getClientOriginalExtension(),
                                'is_valid' => $file->isValid(),
                                'error_code' => $file->getError(),
                            ]);
                        }
                    }
                }
            }
            
            // Also log what was actually received
            Log::warning('Proposal submission validation failed', [
                'errors' => $e->errors(),
                'has_supporting_docs' => $request->hasFile('supportingDocuments'),
                'supporting_docs_count' => $request->hasFile('supportingDocuments') ? count($request->file('supportingDocuments')) : 0,
            ]);

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
            $cmUsers = collect([]);
            if ($user->researchCenterID) {
                $cmUsers = User::whereHas('role', function ($query) {
                    $query->where('userRole', 'CM');
                })
                    ->where('researchCenterID', $user->researchCenterID)
                    ->get();
            }

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
        
        // Pre-process request: Convert JSON strings to arrays for FormData requests
        // When files are uploaded, FormData sends arrays as JSON strings
        $jsonFields = ['researchAgenda', 'dostSPs', 'sustainableDevelopmentGoals', 'budgetBreakdown'];
        foreach ($jsonFields as $field) {
            if ($request->has($field) && is_string($request->input($field))) {
                $decoded = json_decode($request->input($field), true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $request->merge([$field => $decoded]);
                }
            }
        }
        
        try {
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
                'updatedForm' => "nullable|file|mimes:pdf,doc,docx|max:{$maxFileSizeKB}",
                'setiFile' => "nullable|file|mimes:pdf,doc,docx|max:{$maxFileSizeKB}",
                'gadFile' => "nullable|file|mimes:pdf,doc,docx|max:{$maxFileSizeKB}",
                'matrixFile' => "nullable|file|mimes:pdf,doc,docx|max:{$maxFileSizeKB}",
                'supportingDocuments' => 'nullable|array|max:10',
                'supportingDocuments.*' => "file|max:{$maxFileSizeKB}",
                'revisionImages' => 'nullable|array|max:10',
                'revisionImages.*' => "nullable|file|mimes:jpeg,jpg,png,gif,webp|max:{$maxFileSizeKB}",
            ]);
        } catch (ValidationException $e) {
            Log::error('Proposal update validation failed', [
                'proposal_id' => $id,
                'user_id' => $user->userID,
                'errors' => $e->errors(),
                'request_data' => $request->except(['updatedForm', 'setiFile', 'gadFile', 'matrixFile', 'supportingDocuments', 'revisionImages'])
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }

        try {
            // Use database transaction to ensure atomicity of file uploads and proposal updates
            // This ensures files are committed to database before cache clearing
            DB::beginTransaction();
            
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
                
                // Initialize requestedStatusID for logging purposes
                // Use input() to handle both JSON and FormData requests
                $requestedStatusID = $request->has('statusID') ? (int) $request->input('statusID') : null;
                
                // Only allow statusID update if explicitly changing to For Revision (statusID 4) by CM/RDD
                // When proponent resubmits, the statusID will be changed to 1 later in the resubmission logic
                // This ensures the proposal becomes visible in R&D Initiatives and Endorsement pages again
                if ($request->has('statusID') && $requestedStatusID === 4) {
                    // Only allow CM/RDD to set status to 4 (For Revision)
                    // Proponents should not be able to change statusID when resubmitting
                    if ($user->role && in_array($user->role->userRole, ['CM', 'RDD'])) {
                        $updateData['statusID'] = 4;
                        Log::info('Early statusID update set to 4', [
                            'proposal_id' => $proposal->proposalID,
                            'user_role' => $user->role->userRole,
                            'requested_statusid' => $requestedStatusID
                        ]);
                    }
                }

                // Handle file uploads if provided
                // CRITICAL: Files must be saved and committed BEFORE proposal update to ensure they're visible
            // Main proposal file (updatedForm)
            if ($request->hasFile('updatedForm')) {
                $file = $request->file('updatedForm');
                // Keep original filename with timestamp prefix to avoid collisions
                $fileName = time() . '_' . $file->getClientOriginalName();
                
                // CRITICAL: Get old files BEFORE deleting database records, then delete physical files
                $oldFiles = File::where('proposalID', $proposal->proposalID)
                    ->whereIn('fileType', ['report', 'concept_paper', 'updated_form'])
                    ->get();
                
                // Delete physical files from storage
                foreach ($oldFiles as $oldFile) {
                    try {
                        if ($oldFile->filePath && Storage::disk('public')->exists($oldFile->filePath)) {
                            Storage::disk('public')->delete($oldFile->filePath);
                            Log::info('Deleted old proposal file from storage', [
                                'proposal_id' => $proposal->proposalID,
                                'file_path' => $oldFile->filePath,
                                'file_name' => $oldFile->fileName
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to delete old proposal file from storage', [
                            'proposal_id' => $proposal->proposalID,
                            'file_path' => $oldFile->filePath,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
                
                // Delete database records
                File::where('proposalID', $proposal->proposalID)
                    ->whereIn('fileType', ['report', 'concept_paper', 'updated_form'])
                    ->delete();
                
                // Store new file (with timestamp prefix on disk for uniqueness)
                $filePath = $file->storeAs('proposals/' . $proposal->proposalID, $fileName, 'public');

                // Store original filename in database for display purposes
                File::create([
                    'proposalID' => $proposal->proposalID,
                    'fileName' => $file->getClientOriginalName(), // Original filename for display
                    'filePath' => $filePath,
                    'fileType' => 'report',
                    'fileSize' => $file->getSize(),
                ]);
            }

            // SETI Scorecard file
            if ($request->hasFile('setiFile')) {
                $file = $request->file('setiFile');
                $fileName = 'seti_' . time() . '_' . $file->getClientOriginalName();
                
                // CRITICAL: Get old files BEFORE deleting database records, then delete physical files
                $oldFiles = File::where('proposalID', $proposal->proposalID)
                    ->where('fileType', 'seti_scorecard')
                    ->get();
                
                // Delete physical files from storage
                foreach ($oldFiles as $oldFile) {
                    try {
                        if ($oldFile->filePath && Storage::disk('public')->exists($oldFile->filePath)) {
                            Storage::disk('public')->delete($oldFile->filePath);
                            Log::info('Deleted old SETI file from storage', [
                                'proposal_id' => $proposal->proposalID,
                                'file_path' => $oldFile->filePath,
                                'file_name' => $oldFile->fileName
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to delete old SETI file from storage', [
                            'proposal_id' => $proposal->proposalID,
                            'file_path' => $oldFile->filePath,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
                
                // Delete database records
                File::where('proposalID', $proposal->proposalID)
                    ->where('fileType', 'seti_scorecard')
                    ->delete();
                
                // Store new file
                $filePath = $file->storeAs('proposals/' . $proposal->proposalID, $fileName, 'public');

                File::create([
                    'proposalID' => $proposal->proposalID,
                    'fileName' => $file->getClientOriginalName(), // Original filename for display
                    'filePath' => $filePath,
                    'fileType' => 'seti_scorecard',
                    'fileSize' => $file->getSize(),
                ]);
            }

            // GAD Certificate file
            if ($request->hasFile('gadFile')) {
                $file = $request->file('gadFile');
                $fileName = 'gad_' . time() . '_' . $file->getClientOriginalName();
                
                // CRITICAL: Get old files BEFORE deleting database records, then delete physical files
                $oldFiles = File::where('proposalID', $proposal->proposalID)
                    ->where('fileType', 'gad_certificate')
                    ->get();
                
                // Delete physical files from storage
                foreach ($oldFiles as $oldFile) {
                    try {
                        if ($oldFile->filePath && Storage::disk('public')->exists($oldFile->filePath)) {
                            Storage::disk('public')->delete($oldFile->filePath);
                            Log::info('Deleted old GAD file from storage', [
                                'proposal_id' => $proposal->proposalID,
                                'file_path' => $oldFile->filePath,
                                'file_name' => $oldFile->fileName
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to delete old GAD file from storage', [
                            'proposal_id' => $proposal->proposalID,
                            'file_path' => $oldFile->filePath,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
                
                // Delete database records
                File::where('proposalID', $proposal->proposalID)
                    ->where('fileType', 'gad_certificate')
                    ->delete();
                
                // Store new file
                $filePath = $file->storeAs('proposals/' . $proposal->proposalID, $fileName, 'public');

                File::create([
                    'proposalID' => $proposal->proposalID,
                    'fileName' => $file->getClientOriginalName(), // Original filename for display
                    'filePath' => $filePath,
                    'fileType' => 'gad_certificate',
                    'fileSize' => $file->getSize(),
                ]);
            }

            // Matrix of Compliance file
            if ($request->hasFile('matrixFile')) {
                $file = $request->file('matrixFile');
                $fileName = 'matrix_' . time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('proposals/' . $proposal->proposalID, $fileName, 'public');

                // Replace existing MOC files
                File::where('proposalID', $proposal->proposalID)
                    ->where('fileType', 'matrix_compliance')
                    ->delete();

                File::create([
                    'proposalID' => $proposal->proposalID,
                    'fileName' => $file->getClientOriginalName(), // Original filename for display
                    'filePath' => $filePath,
                    'fileType' => 'matrix_compliance',
                    'fileSize' => $file->getSize(),
                ]);
            }

            // Supporting documents
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
                        $fileName = 'supporting_' . time() . '_' . $file->getClientOriginalName();
                        $filePath = $file->storeAs('proposals/' . $proposal->proposalID, $fileName, 'public');

                        File::create([
                            'proposalID' => $proposal->proposalID,
                            'fileName' => $file->getClientOriginalName(), // Original filename for display
                            'filePath' => $filePath,
                            'fileType' => 'supporting_document',
                            'fileSize' => $file->getSize(),
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Error uploading supporting document', [
                            'proposalID' => $proposal->proposalID,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
            }

            // Revision images (pasted images in revision comments)
            // Handle array file uploads - check if revisionImages exists as array
            if ($request->hasFile('revisionImages')) {
                $revisionImageFiles = $request->file('revisionImages');
                
                // Handle both array format and single file
                if ($revisionImageFiles && (is_array($revisionImageFiles) ? count($revisionImageFiles) > 0 : $revisionImageFiles !== null)) {
                    // If it's an array, iterate through it
                    if (is_array($revisionImageFiles)) {
                        foreach ($revisionImageFiles as $index => $file) {
                            if (!$file || !$file->isValid()) {
                                Log::warning("Invalid revision image skipped", [
                                    'proposalID' => $proposal->proposalID,
                                    'index' => $index,
                                    'error' => $file?->getError(),
                                ]);
                                continue;
                            }

                            try {
                                $fileName = 'revision_image_' . time() . '_' . $index . '_' . $file->getClientOriginalName();
                                $filePath = $file->storeAs('proposals/' . $proposal->proposalID, $fileName, 'public');

                                File::create([
                                    'proposalID' => $proposal->proposalID,
                                    'fileName' => $file->getClientOriginalName(), // Original filename for display
                                    'filePath' => $filePath,
                                    'fileType' => 'revision_image',
                                    'fileSize' => $file->getSize(),
                                ]);
                            } catch (\Exception $e) {
                                Log::error('Error uploading revision image', [
                                    'proposalID' => $proposal->proposalID,
                                    'index' => $index,
                                    'error' => $e->getMessage()
                                ]);
                            }
                        }
                    } else {
                        // Single file (shouldn't happen but handle it)
                        if ($revisionImageFiles->isValid()) {
                            try {
                                $fileName = 'revision_image_' . time() . '_' . $revisionImageFiles->getClientOriginalName();
                                $filePath = $revisionImageFiles->storeAs('proposals/' . $proposal->proposalID, $fileName, 'public');

                                File::create([
                                    'proposalID' => $proposal->proposalID,
                                    'fileName' => $revisionImageFiles->getClientOriginalName(), // Original filename for display
                                    'filePath' => $filePath,
                                    'fileType' => 'revision_image',
                                    'fileSize' => $revisionImageFiles->getSize(),
                                ]);
                            } catch (\Exception $e) {
                                Log::error('Error uploading revision image', [
                                    'proposalID' => $proposal->proposalID,
                                    'error' => $e->getMessage()
                                ]);
                            }
                        }
                    }
                }
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

            // Get current proposal status BEFORE any updates
            $currentStatusID = (int) $proposal->statusID;
            
            // Track status change before updating
            // Handle both JSON and FormData requests - use input() instead of direct property access
            $requestedStatusID = null;
            if ($request->has('statusID')) {
                $requestedStatusID = (int) $request->input('statusID');
            }
            
            $wasRevisionStatusChange = $requestedStatusID === 4 && $currentStatusID !== 4;
            
            // Debug logging for RDD marking for revision
            if ($user->role && $user->role->userRole === 'RDD' && $request->has('statusID')) {
                Log::info('RDD marking proposal for revision - CHECKING', [
                    'proposal_id' => $proposal->proposalID,
                    'user_id' => $user->userID,
                    'current_status_id' => $currentStatusID,
                    'requested_status_id' => $requestedStatusID,
                    'was_revision_status_change' => $wasRevisionStatusChange,
                    'request_has_statusid' => $request->has('statusID'),
                    'request_statusid_value' => $request->input('statusID'),
                    'request_statusid_type' => gettype($request->input('statusID')),
                    'update_data_before' => $updateData ?? []
                ]);
            }

            // Track when resubmitting after revision
            // When proponent resubmits (status is 4), set resubmittedAfterRevision timestamp
            // IMPORTANT: Status should remain 4 (For Revision) - do NOT change to 1
            $isResubmitAfterRevision = false;
            
            // Check if this is a resubmission: current status is 4 (For Revision) and user is the proposal owner
            // This allows proponent to resubmit without changing statusID
            if ($currentStatusID === 4 && $proposal->userID === $user->userID) {
                $isResubmitAfterRevision = true;
                Log::info('Resubmission detected', [
                    'proposal_id' => $proposal->proposalID,
                    'current_status_id' => $currentStatusID,
                    'user_id' => $user->userID,
                    'proposal_owner_id' => $proposal->userID,
                    'is_owner' => $proposal->userID === $user->userID
                ]);
            }

            // Delete old revision images AND clear old comments when marking for revision again
            // This ensures only the current revision's images and comments are shown
            if ($wasRevisionStatusChange) {
                // Clear previous revision comments - new ones will be set below if provided
                $updateData['revisionComments'] = $request->input('revisionComments', null);
                
                // Delete old revision images
                $oldRevisionImages = File::where('proposalID', $proposal->proposalID)
                    ->where('fileType', 'revision_image')
                    ->get();
                
                foreach ($oldRevisionImages as $oldImage) {
                    // Delete from storage
                    if ($oldImage->filePath && Storage::disk('public')->exists($oldImage->filePath)) {
                        Storage::disk('public')->delete($oldImage->filePath);
                    }
                    // Delete from database
                    $oldImage->delete();
                }
                
                Log::info('Cleared old revision images', [
                    'proposal_id' => $proposal->proposalID,
                    'deleted_count' => $oldRevisionImages->count()
                ]);
            }

            // When resubmitting after revision, set resubmittedAfterRevision timestamp
            // IMPORTANT: Change statusID back to 1 (Under Review) so proposal appears in Dashboard and Endorsement pages
            // The For Revision page will still show it by checking resubmittedAfterRevision (status shows "Updated")
            // This also increments the "Under Review" card count
            if ($isResubmitAfterRevision) {
                $updateData['resubmittedAfterRevision'] = now();
                // Change statusID to 1 so it appears in Dashboard and Endorsement pages
                // Under Review card will increment
                $updateData['statusID'] = 1;
                
                Log::info('Setting resubmission data - changing statusID to 1', [
                    'proposal_id' => $proposal->proposalID,
                    'resubmitted_after_revision' => now(),
                    'status_id' => 1,
                    'current_status_id' => $currentStatusID
                ]);
            }
            
            // IMPORTANT: When CM or RDD marks proposal for revision, ensure statusID is 4
            // Override any statusID sent from frontend to ensure it's always 4 when marked for revision
            // Also ensure resubmittedAfterRevision is null (so status shows as "In Progress" not "Updated")
            if ($wasRevisionStatusChange) {
                $updateData['statusID'] = 4;
                // Ensure resubmittedAfterRevision is null when first marked for revision
                // It will be set when proponent resubmits
                // Explicitly set to null to clear any previous resubmission timestamp
                $updateData['resubmittedAfterRevision'] = null;
                Log::info('Proposal marked for revision', [
                    'proposal_id' => $proposal->proposalID,
                    'user_id' => $user->userID,
                    'user_role' => $user->role?->userRole,
                    'current_status_id' => $currentStatusID,
                    'new_status_id' => 4,
                    'resubmitted_after_revision' => 'set to null',
                    'revision_comments' => $request->has('revisionComments') ? 'provided' : 'not provided'
                ]);
            }

            // Log what will be updated
            if (!empty($updateData)) {
                Log::info('Proposal update data', [
                    'proposal_id' => $proposal->proposalID,
                    'update_data' => $updateData,
                    'is_resubmit' => $isResubmitAfterRevision,
                    'was_revision_status_change' => $wasRevisionStatusChange,
                    'user_role' => $user->role?->userRole
                ]);
            }

                // Update the proposal
                // If marking for revision, explicitly set resubmittedAfterRevision to null
                if ($wasRevisionStatusChange) {
                    // Use DB::statement to explicitly set to NULL in database
                    \DB::table('proposals')
                        ->where('proposalID', $proposal->proposalID)
                        ->update(['resubmittedAfterRevision' => null]);
                    // Also set in updateData to ensure it's in the update
                    $updateData['resubmittedAfterRevision'] = null;
                }
                $proposal->update($updateData);
                
                // Check for file uploads - handle array file uploads properly
                $hasRevisionImages = false;
                if ($request->hasFile('revisionImages')) {
                    $revisionImageFiles = $request->file('revisionImages');
                    $hasRevisionImages = is_array($revisionImageFiles) ? count($revisionImageFiles) > 0 : $revisionImageFiles !== null;
                }
                
                $hasFileUploads = $request->hasFile('updatedForm') || 
                                 $request->hasFile('setiFile') || 
                                 $request->hasFile('gadFile') || 
                                 $request->hasFile('matrixFile') || 
                                 $request->hasFile('supportingDocuments') ||
                                 $hasRevisionImages;
                
                // CRITICAL: Commit transaction to ensure all file uploads and proposal updates are persisted
                // This must happen BEFORE cache clearing to ensure data consistency
                DB::commit();
                
                Log::info('Proposal update transaction committed', [
                    'proposal_id' => $proposal->proposalID,
                    'has_file_uploads' => $hasFileUploads,
                    'files_committed' => true
                ]);
                
                // Clear proposal cache AFTER transaction commit to ensure fresh data
                // CRITICAL: Clear cache for all users, especially CM users who need to see updated files
                $this->clearProposalCache($proposal->proposalID);
            
            // Clear ALL relationships to force fresh load
            $proposal->unsetRelation('files');
            $proposal->unsetRelation('status');
            $proposal->unsetRelation('user');
            $proposal->unsetRelation('proponents');
            $proposal->unsetRelation('endorsements');
            
            // Reload proposal to get updated status and verify the update
            $proposal->refresh();
            
            // CRITICAL: Force reload files relationship with a fresh query to ensure CM sees updated files
            // This is especially important when proponent resubmits files after revision
            $freshFiles = \App\Models\File::where('proposalID', $proposal->proposalID)
                ->orderBy('created_at', 'desc')
                ->get();
            $proposal->setRelation('files', $freshFiles);
            
            Log::info('Files reloaded after proposal update', [
                'proposal_id' => $proposal->proposalID,
                'files_count' => $freshFiles->count(),
                'file_types' => $freshFiles->pluck('fileType')->toArray(),
                'is_resubmission' => $isResubmitAfterRevision
            ]);
            
            // Verify status was updated correctly
            if ($isResubmitAfterRevision) {
                Log::info('Proposal status after update', [
                    'proposal_id' => $proposal->proposalID,
                    'status_id' => $proposal->statusID,
                    'resubmitted_after_revision' => $proposal->resubmittedAfterRevision,
                    'expected_status' => 1, // Status should be 1 (Under Review) after resubmission
                    'status_correct' => $proposal->statusID === 1
                ]);
            }
            
            // Verify status was updated correctly when marked for revision
            if ($wasRevisionStatusChange) {
                // Force refresh from database to get actual saved value
                $proposal->refresh();
                $actualStatusID = (int) $proposal->statusID;
                $actualResubmittedAfterRevision = $proposal->resubmittedAfterRevision;
                
                Log::info('Proposal status after marking for revision', [
                    'proposal_id' => $proposal->proposalID,
                    'status_id' => $actualStatusID,
                    'expected_status' => 4, // Status should be 4 (For Revision)
                    'status_correct' => $actualStatusID === 4,
                    'resubmitted_after_revision' => $actualResubmittedAfterRevision,
                    'expected_resubmitted_after_revision' => null,
                    'resubmitted_after_revision_correct' => $actualResubmittedAfterRevision === null,
                    'user_role' => $user->role?->userRole,
                    'revision_comments' => $proposal->revisionComments ? 'set' : 'not set',
                    'update_data_statusid' => $updateData['statusID'] ?? 'not set'
                ]);
                
                // If resubmittedAfterRevision wasn't cleared, force clear it
                if ($actualResubmittedAfterRevision !== null) {
                    Log::warning('resubmittedAfterRevision was not cleared, forcing update', [
                        'proposal_id' => $proposal->proposalID,
                        'current_value' => $actualResubmittedAfterRevision,
                        'expected_value' => null
                    ]);
                    \DB::table('proposals')
                        ->where('proposalID', $proposal->proposalID)
                        ->update(['resubmittedAfterRevision' => null]);
                    $proposal->refresh();
                    Log::info('resubmittedAfterRevision force-cleared to null', [
                        'proposal_id' => $proposal->proposalID,
                        'new_value' => $proposal->resubmittedAfterRevision
                    ]);
                }
                
                // If status wasn't updated correctly, force update it
                if ($actualStatusID !== 4) {
                    Log::warning('StatusID was not updated correctly, forcing update', [
                        'proposal_id' => $proposal->proposalID,
                        'current_status' => $actualStatusID,
                        'expected_status' => 4
                    ]);
                    $proposal->update(['statusID' => 4]);
                    $proposal->refresh();
                    Log::info('StatusID force-updated to 4', [
                        'proposal_id' => $proposal->proposalID,
                        'new_status' => $proposal->statusID
                    ]);
                }
            }
            
                // CRITICAL: After transaction commit, force a fresh database query to get the latest files
                // This ensures we get files that were just saved, even if there's any query cache
                if ($hasFileUploads) {
                    // Force a fresh query to get the actual files from database
                    // Use fresh() to bypass any model cache
                    $actualFiles = \App\Models\File::where('proposalID', $proposal->proposalID)
                        ->orderBy('created_at', 'desc')
                        ->get();
                    
                    Log::info('Files uploaded - querying directly from database after commit', [
                        'proposal_id' => $proposal->proposalID,
                        'files_count' => $actualFiles->count(),
                        'file_types' => $actualFiles->pluck('fileType')->toArray(),
                        'file_names' => $actualFiles->pluck('fileName')->toArray(),
                        'file_ids' => $actualFiles->pluck('fileID')->toArray()
                    ]);
                    
                    // Set the files relationship directly with fresh data
                    $proposal->setRelation('files', $actualFiles);
                } else {
                    // Even if no new files, ensure files relationship is loaded
                    if (!$proposal->relationLoaded('files')) {
                        $proposal->load('files');
                    }
                }
                
                // Force reload all other relationships
                $proposal->load([
                    'status',
                    'user.department',
                    'user.role',
                    'user.researchCenter',
                    'proponents',
                    'proponents.role'
                ]);
                
                // If files weren't uploaded but we're resubmitting, still verify files are loaded
                if ($isResubmitAfterRevision && !$hasFileUploads) {
                    Log::info('Proposal files after resubmission (no new files)', [
                        'proposal_id' => $proposal->proposalID,
                        'files_count' => $proposal->files->count(),
                        'file_types' => $proposal->files->pluck('fileType')->toArray()
                    ]);
                }

                // Load project roles for proponents
                $proposal->proponents->each(function ($proponent) {
                    if ($proponent->pivot->projectRoleID) {
                        $projectRole = \App\Models\ProjectRole::find($proponent->pivot->projectRoleID);
                        $proponent->projectRole = $projectRole;
                    }
                });
            } catch (\Exception $e) {
                // Rollback transaction on error
                DB::rollBack();
                throw $e;
            }

            // Notify proponent when proposal is set to revision and include comments
            // Handle both CM and RDD revision workflows
            if ($wasRevisionStatusChange) {
                $revisionComments = $request->input('revisionComments');
                $userRole = $user->role?->userRole ?? null;
                
                // Determine notification message based on who is sending for revision
                if ($userRole === 'RDD') {
                    // RDD workflow: Direct notification to Proponent
                    $message = $revisionComments
                        ? "The R&D Division requested a revision: {$revisionComments}"
                        : 'The R&D Division requested a revision. Please check the details and resubmit.';

                    // Notify Proponent
                    try {
                        Notification::create([
                            'userID' => $proposal->userID,
                            'type' => 'revision',
                            'title' => 'R&D Division Requested Revision',
                            'message' => $message,
                            'data' => [
                                'proposal_id' => $proposal->proposalID,
                                'proposal_title' => $proposal->researchTitle,
                                'revision_comments' => $revisionComments,
                                'event' => 'proposal.revision_required.rdd',
                                'requested_by' => 'RDD'
                            ]
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Failed to create notification for Proponent (RDD revision)', [
                            'proposal_id' => $proposal->proposalID,
                            'proponent_user_id' => $proposal->userID,
                            'error' => $e->getMessage()
                        ]);
                        // Don't fail the entire update if notification fails
                    }

                    // Notify CM (view-only, for awareness)
                    if ($proposal->user && $proposal->user->researchCenterID) {
                        try {
                            $cmUsers = User::whereHas('role', function ($query) {
                                $query->where('userRole', 'CM');
                            })
                                ->where('researchCenterID', $proposal->user->researchCenterID)
                                ->get();

                            foreach ($cmUsers as $cmUser) {
                                try {
                                    Notification::create([
                                        'userID' => $cmUser->userID,
                                        'type' => 'info',
                                        'title' => 'RDD Requested Revision',
                                        'message' => "The R&D Division requested a revision for \"{$proposal->researchTitle}\" directly from the Proponent.",
                                        'data' => [
                                            'proposal_id' => $proposal->proposalID,
                                            'proposal_title' => $proposal->researchTitle,
                                            'event' => 'proposal.revision_required.rdd.cm_notification',
                                            'is_view_only' => true
                                        ]
                                    ]);
                                } catch (\Exception $e) {
                                    Log::error('Failed to create notification for CM (RDD revision)', [
                                        'cm_user_id' => $cmUser->userID,
                                        'proposal_id' => $proposal->proposalID,
                                        'error' => $e->getMessage()
                                    ]);
                                }
                            }
                        } catch (\Exception $e) {
                            Log::error('Failed to fetch CM users for RDD revision notification', [
                                'proposal_id' => $proposal->proposalID,
                                'research_center_id' => $proposal->user->researchCenterID,
                                'error' => $e->getMessage()
                            ]);
                        }
                    } else {
                        Log::warning('Cannot notify CM for RDD revision - proposal user has no research center', [
                            'proposal_id' => $proposal->proposalID,
                            'user_id' => $proposal->userID,
                            'research_center_id' => $proposal->user?->researchCenterID
                        ]);
                    }
                } else {
                    // CM workflow: Standard notification to Proponent
                    $message = $revisionComments
                        ? "For revision: {$revisionComments}"
                        : 'Your proposal requires revision. Please check the details and resubmit.';

                    try {
                        Notification::create([
                            'userID' => $proposal->userID,
                            'type' => 'revision',
                            'title' => 'Proposal Sent for Revision',
                            'message' => $message,
                            'data' => [
                                'proposal_id' => $proposal->proposalID,
                                'proposal_title' => $proposal->researchTitle,
                                'revision_comments' => $revisionComments,
                                'event' => 'proposal.revision_required',
                                'requested_by' => 'CM'
                            ]
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Failed to create notification for Proponent (CM revision)', [
                            'proposal_id' => $proposal->proposalID,
                            'proponent_user_id' => $proposal->userID,
                            'error' => $e->getMessage()
                        ]);
                        // Don't fail the entire update if notification fails
                    }
                }
            }

            // Notify when proposal is resubmitted after revision
            // Determine if this was originally sent for revision by CM or RDD
            if ($isResubmitAfterRevision) {
                // Ensure user relationship is loaded with research center
                if (!$proposal->relationLoaded('user')) {
                    $proposal->load('user');
                }
                
                // Check who originally sent for revision
                // RDD revision is detected by:
                // 1. Check for RDD notification in proposal's revision workflow
                // 2. Check if proposal has been endorsed by CM (forwarded to RDD level)
                // 3. Check if revision comments contain RDD indicators
                
                // Get CM user IDs
                $cmUserIds = User::whereHas('role', function ($q) {
                    $q->where('userRole', 'CM');
                })->pluck('userID')->toArray();
                
                // Check if proposal has CM endorsement (meaning it was forwarded to RDD)
                $hasCmEndorsement = $proposal->endorsements()
                    ->whereIn('endorserID', $cmUserIds)
                    ->where('endorsementStatus', 'approved')
                    ->exists();
                
                // If proposal has CM endorsement (forwarded to RDD level), this is RDD revision
                $wasRddRevision = $hasCmEndorsement;
                
                Log::info('Resubmission workflow detection', [
                    'proposal_id' => $proposal->proposalID,
                    'has_cm_endorsement' => $hasCmEndorsement,
                    'was_rdd_revision' => $wasRddRevision
                ]);
                
                // Create notification for the proponent that their proposal was resubmitted successfully
                try {
                    $targetRole = $wasRddRevision ? 'R&D Division' : 'Center Manager';
                    Notification::create([
                        'userID' => $proposal->userID,
                        'type' => 'success',
                        'title' => 'Proposal Resubmitted Successfully',
                        'message' => "Your proposal \"{$proposal->researchTitle}\" has been resubmitted successfully to the {$targetRole}.",
                        'data' => [
                            'proposal_id' => $proposal->proposalID,
                            'proposal_title' => $proposal->researchTitle,
                            'event' => $wasRddRevision ? 'proposal.resubmitted.to_rdd' : 'proposal.resubmitted.to_cm',
                            'resubmitted_to' => $wasRddRevision ? 'RDD' : 'CM'
                        ]
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to create resubmission success notification for proponent', [
                        'proposal_id' => $proposal->proposalID,
                        'proponent_id' => $proposal->userID,
                        'error' => $e->getMessage()
                    ]);
                }
                
                if ($wasRddRevision) {
                    // RDD workflow: Notify RDD users directly
                    $rddUsers = User::whereHas('role', function ($query) {
                        $query->where('userRole', 'RDD');
                    })->get();

                    $notificationsCreated = 0;
                    foreach ($rddUsers as $rddUser) {
                        try {
                            Notification::create([
                                'userID' => $rddUser->userID,
                                'type' => 'proposal',
                                'title' => 'Proposal Revision Resubmitted',
                                'message' => "{$proposal->user->fullName} has resubmitted the revised proposal \"{$proposal->researchTitle}\". Please review the updated proposal in the For Revision page.",
                                'data' => [
                                    'proposal_id' => $proposal->proposalID,
                                    'proposal_title' => $proposal->researchTitle,
                                    'proponent_name' => $proposal->user->fullName,
                                    'event' => 'proposal.resubmitted_after_revision.rdd',
                                    'is_resubmission' => true,
                                    'redirect_to' => '/rdd/for-revision'
                                ]
                            ]);
                            $notificationsCreated++;
                        } catch (\Exception $e) {
                            Log::error('Failed to create notification for RDD', [
                                'rdd_user_id' => $rddUser->userID,
                                'proposal_id' => $proposal->proposalID,
                                'error' => $e->getMessage()
                            ]);
                        }
                    }
                    
                    // Also notify CM for awareness (view-only)
                    if ($proposal->user && $proposal->user->researchCenterID) {
                        $cmUsers = User::whereHas('role', function ($query) {
                            $query->where('userRole', 'CM');
                        })
                            ->where('researchCenterID', $proposal->user->researchCenterID)
                            ->get();

                        foreach ($cmUsers as $cmUser) {
                            try {
                                Notification::create([
                                    'userID' => $cmUser->userID,
                                    'type' => 'info',
                                    'title' => 'Proponent Resubmitted Proposal Revision',
                                    'message' => "{$proposal->user->fullName} has resubmitted proposal revision \"{$proposal->researchTitle}\" back to the R&D Division.",
                                    'data' => [
                                        'proposal_id' => $proposal->proposalID,
                                        'proposal_title' => $proposal->researchTitle,
                                        'proponent_name' => $proposal->user->fullName,
                                        'event' => 'proposal.resubmitted_after_revision.rdd.cm_notification',
                                        'is_view_only' => true,
                                        'is_awareness_only' => true
                                    ]
                                ]);
                            } catch (\Exception $e) {
                                Log::error('Failed to create notification for CM', [
                                    'cm_user_id' => $cmUser->userID,
                                    'proposal_id' => $proposal->proposalID,
                                    'error' => $e->getMessage()
                                ]);
                            }
                        }
                    }
                    
                    Log::info('Proposal resubmitted after RDD revision - notifications sent', [
                        'proposal_id' => $proposal->proposalID,
                        'rdd_notifications' => $notificationsCreated,
                        'cm_notifications' => $cmUsers->count() ?? 0
                    ]);
                } else {
                    // CM workflow: Notify CM users
                    if (!$proposal->user || !$proposal->user->researchCenterID) {
                        Log::error('Cannot notify CM - proposal user has no research center', [
                            'proposal_id' => $proposal->proposalID,
                            'user_id' => $proposal->userID,
                            'research_center_id' => $proposal->user?->researchCenterID
                        ]);
                    } else {
                        // Get CM users from the same research center
                        $cmUsers = User::whereHas('role', function ($query) {
                            $query->where('userRole', 'CM');
                        })
                            ->where('researchCenterID', $proposal->user->researchCenterID)
                            ->get();

                        // Create notifications for all CM users
                        $notificationsCreated = 0;
                        foreach ($cmUsers as $cmUser) {
                            try {
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
                                $notificationsCreated++;
                            } catch (\Exception $e) {
                                Log::error('Failed to create notification for CM', [
                                    'cm_user_id' => $cmUser->userID,
                                    'proposal_id' => $proposal->proposalID,
                                    'error' => $e->getMessage()
                                ]);
                            }
                        }
                        
                        // Log for debugging
                        Log::info('Proposal resubmitted after revision - CM notification sent', [
                            'proposal_id' => $proposal->proposalID,
                            'old_status' => 4,
                            'new_status' => $proposal->statusID,
                            'resubmitted_at' => $proposal->resubmittedAfterRevision,
                            'cm_users_found' => $cmUsers->count(),
                            'notifications_created' => $notificationsCreated,
                            'research_center_id' => $proposal->user->researchCenterID
                        ]);
                    }
                }
            } else {
                // Log why notification was not sent
                Log::info('Proposal resubmission notification NOT sent', [
                    'proposal_id' => $proposal->proposalID,
                    'current_status' => $currentStatusID,
                    'requested_status' => $requestedStatusID,
                    'is_resubmit_flag' => $isResubmitAfterRevision
                ]);
            }

            // Clear cache for this proposal for all users (do this BEFORE returning response)
            // This ensures CM side will get fresh data when viewing the proposal
            $this->clearProposalCache($proposal->proposalID);
            
            // IMPORTANT: Make one final refresh to ensure all relationships are loaded with latest data
            // This is critical for file uploads - we need to ensure files are included in the response
            // Use fresh() to bypass any model cache and get the latest from database
            $proposal->refresh();
            
            // Force reload files relationship with a fresh query to ensure we get the latest files
            $freshFiles = \App\Models\File::where('proposalID', $proposal->proposalID)
                ->orderBy('created_at', 'desc')
                ->get();
            $proposal->setRelation('files', $freshFiles);
            
            $proposal->load([
                'status',
                'user.department',
                'user.role',
                'user.researchCenter',
                'proponents',
                'proponents.role',
                'endorsements',
                'endorsements.endorser',
                'endorsements.endorser.role'
            ]);
            
            // Log final file state for debugging
            Log::info('Final proposal state before response', [
                'proposal_id' => $proposal->proposalID,
                'files_count' => $proposal->files->count(),
                'file_types' => $proposal->files->pluck('fileType')->toArray(),
                'is_resubmission' => $isResubmitAfterRevision
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Proposal updated successfully',
                'data' => $proposal,
                'debug' => $isResubmitAfterRevision ? [
                    'is_resubmission' => true,
                    'files_count' => $proposal->files->count(),
                    'file_types' => $proposal->files->pluck('fileType')->toArray(),
                    'resubmitted_at' => $proposal->resubmittedAfterRevision,
                    'status_id' => $proposal->statusID
                ] : null
            ]);
        } catch (\Exception $e) {
            Log::error('Proposal update failed', [
                'proposal_id' => $id,
                'user_id' => $user->userID,
                'user_role' => $user->role?->userRole,
                'error' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request_data_keys' => array_keys($request->except(['updatedForm', 'setiFile', 'gadFile', 'matrixFile', 'supportingDocuments', 'revisionImages'])),
                'has_revision_images' => $request->hasFile('revisionImages'),
                'revision_images_count' => $request->hasFile('revisionImages') ? (is_array($request->file('revisionImages')) ? count($request->file('revisionImages')) : 1) : 0
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update proposal: ' . $e->getMessage(),
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while updating the proposal'
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

        // For RDD users, count ALL proposals (both archived and non-archived) for total statistics
        // For CM users, show proposals from their research center; for others, show only their own
        $query = Proposal::query();

        // Apply authorization filters based on user role
        $userRole = $user->role?->userRole;
        if ($userRole === 'RDD') {
            // Get all CM user IDs
            $cmUserIds = User::whereHas('role', function($q) {
                $q->where('userRole', 'CM');
            })->pluck('userID')->toArray();
            
            // Get all RDD user IDs
            $rddUserIds = User::whereHas('role', function($q) {
                $q->where('userRole', 'RDD');
            })->pluck('userID')->toArray();
            
            // For Cards 1 & 2: Only proposals endorsed by CM but NOT yet archived by RDD
            // This means when CM endorses, cards 1 & 2 increment
            // When RDD endorses, cards 1 & 2 decrement
            $query->whereNull('archivedByRDD')
                ->whereHas('endorsements', function ($q) use ($cmUserIds) {
                    $q->whereIn('endorserID', $cmUserIds)
                      ->where('endorsementStatus', 'approved');
                })
                ->whereDoesntHave('endorsements', function ($q) use ($rddUserIds) {
                    $q->whereIn('endorserID', $rddUserIds)
                      ->where('endorsementStatus', 'approved');
                });
        } elseif ($userRole === 'CM') {
            if ($user->researchCenterID) {
                $query->whereHas('user', fn($q) => $q->where('researchCenterID', $user->researchCenterID));
                // Exclude proposals with statusID 4 (For Revision) from statistics
                $query->where('statusID', '!=', 4);
            } else {
                $query->whereRaw('1=0');
            }
        } else {
            $query->where('userID', $user->userID);
        }

        // Get all statuses to map names to IDs
        $underReviewStatus = \App\Models\Status::whereRaw('LOWER(statusName) = ?', ['under review'])->first();
        $approvedStatus = \App\Models\Status::whereRaw('LOWER(statusName) = ?', ['approved'])->first();
        $rejectedStatus = \App\Models\Status::whereRaw('LOWER(statusName) = ?', ['rejected'])->first();
        $ongoingStatus = \App\Models\Status::whereRaw('LOWER(statusName) = ?', ['ongoing'])->first();
        $completedStatus = \App\Models\Status::whereRaw('LOWER(statusName) = ?', ['completed'])->first();

        // For RDD users, calculate cards differently:
        // Card 1 & 2: Proposals endorsed by CM but NOT archived by RDD
        // Card 3: Proposals archived by RDD (endorsed by RDD)
        if ($userRole === 'RDD') {
            // Get CM and RDD user IDs (already defined above)
            // Card 1: Total proposals endorsed by CM but not archived
            // IMPORTANT: Do NOT exclude statusID = 4 from Card 1
            // When RDD marks for revision, the proposal is still "received" (endorsed by CM)
            // Card 1 should remain unchanged - only Card 2 should decrement
            $card1Query = Proposal::query()
                ->whereNull('archivedByRDD')
                // Do NOT exclude statusID = 4 - Card 1 should count all received proposals
                ->whereHas('endorsements', function ($q) use ($cmUserIds) {
                    $q->whereIn('endorserID', $cmUserIds)
                      ->where('endorsementStatus', 'approved');
                })
                ->whereDoesntHave('endorsements', function ($q) use ($rddUserIds) {
                    $q->whereIn('endorserID', $rddUserIds)
                      ->where('endorsementStatus', 'approved');
                });
            
            // Card 2: Under Review proposals (same as Card 1 but with statusID = 1)
            // Exclude proposals sent for revision (statusID = 4) - these should not count in Under Review
            $card2Query = clone $card1Query;
            $underReviewStatusId = $underReviewStatus ? $underReviewStatus->statusID : 1;
            $card2Query->where('statusID', $underReviewStatusId); // Only statusID = 1 (Under Review), which automatically excludes statusID = 4
            
            // Card 3: Proposals archived by RDD (endorsed by RDD)
            $card3Query = Proposal::query()
                ->whereNotNull('archivedByRDD')
                ->whereHas('endorsements', function ($q) use ($rddUserIds) {
                    $q->whereIn('endorserID', $rddUserIds)
                      ->where('endorsementStatus', 'approved');
                });
            
            $stats = [
                'total' => $card1Query->count(),
                'under_review' => $card2Query->count(),
                'approved' => $approvedStatus
                    ? (clone $card1Query)->where('statusID', $approvedStatus->statusID)->count()
                    : (clone $card1Query)->where('statusID', 2)->count(),
                'rejected' => $rejectedStatus
                    ? (clone $card1Query)->where('statusID', $rejectedStatus->statusID)->count()
                    : (clone $card1Query)->where('statusID', 3)->count(),
                'ongoing' => $ongoingStatus
                    ? (clone $card1Query)->where('statusID', $ongoingStatus->statusID)->count()
                    : (clone $card1Query)->where('statusID', 4)->count(),
                'completed' => $card3Query->count() // Card 3: Total archived/endorsed by RDD
            ];
        } else {
            // For non-RDD users, use original logic
            // Use a base query that can be cloned for each status count
            $baseQuery = clone $query;
            
            $stats = [
                'total' => $baseQuery->count(),
                'under_review' => $underReviewStatus 
                    ? (clone $query)->where('statusID', $underReviewStatus->statusID)->count()
                    : (clone $query)->where('statusID', 1)->count(),
                'approved' => $approvedStatus
                    ? (clone $query)->where('statusID', $approvedStatus->statusID)->count()
                    : (clone $query)->where('statusID', 2)->count(),
                'rejected' => $rejectedStatus
                    ? (clone $query)->where('statusID', $rejectedStatus->statusID)->count()
                    : (clone $query)->where('statusID', 3)->count(),
                'ongoing' => $ongoingStatus
                    ? (clone $query)->where('statusID', $ongoingStatus->statusID)->count()
                    : (clone $query)->where('statusID', 4)->count(),
                'completed' => $completedStatus
                    ? (clone $query)->where('statusID', $completedStatus->statusID)->count()
                    : (clone $query)->where('statusID', 5)->count()
            ];
        }

        // For CM users, add received_proposals and endorsed_proposals
        if ($userRole === 'CM') {
            // Get RDD user IDs for filtering
            $rddUserIds = User::whereHas('role', function($q) {
                $q->where('userRole', 'RDD');
            })->pluck('userID')->toArray();
            
            // received_proposals = total count of all proposals from CM's research center
            // INCLUDES proposals with statusID 4 (For Revision) - these should still count as "received"
            // EXCLUDE proposals that have been forwarded to RDD (have RDD endorsement)
            // CRITICAL: EXCLUDE proposals where CM has endorsed at least once (when CM endorses, card 1 decrements)
            // Create a new query that includes For Revision proposals (statusID 4)
            $receivedQuery = Proposal::query();
            if ($user->researchCenterID) {
                $receivedQuery->whereHas('user', fn($q) => $q->where('researchCenterID', $user->researchCenterID));
                // Include all statuses including statusID 4 (For Revision)
                // Don't exclude statusID 4 here - we want to count them in received_proposals
            } else {
                $receivedQuery->whereRaw('1=0');
            }
            
            $stats['received_proposals'] = $receivedQuery
                ->whereDoesntHave('endorsements', function ($q) use ($rddUserIds) {
                    $q->whereIn('endorserID', $rddUserIds)
                      ->where('endorsementStatus', 'approved');
                })
                ->whereRaw('(SELECT COUNT(*) FROM endorsements WHERE endorsements.proposalID = proposals.proposalID AND endorsements.endorserID = ? AND endorsements.endorsementStatus = ?) = 0', 
                    [$user->userID, 'approved'])
                ->count();
            
            // under_review = proposals with statusID 1 that haven't been forwarded to RDD
            // INCLUDES resubmitted proposals (statusID = 1 with resubmittedAfterRevision set)
            // CRITICAL: EXCLUDE proposals where CM has endorsed at least once (when CM endorses, card 2 decrements)
            $underReviewStatus = \App\Models\Status::whereRaw('LOWER(statusName) = ?', ['under review'])->first();
            $underReviewStatusId = $underReviewStatus ? $underReviewStatus->statusID : 1;
            
            // Recalculate under_review with proper filters for CM
            // Include all proposals with statusID 1 (includes resubmitted proposals)
            // Exclude proposals forwarded to RDD and proposals where CM has endorsed at least once
            $underReviewQuery = clone $baseQuery;
            $stats['under_review'] = $underReviewQuery
                ->where('statusID', $underReviewStatusId)
                ->whereDoesntHave('endorsements', function ($q) use ($rddUserIds) {
                    $q->whereIn('endorserID', $rddUserIds)
                      ->where('endorsementStatus', 'approved');
                })
                ->whereRaw('(SELECT COUNT(*) FROM endorsements WHERE endorsements.proposalID = proposals.proposalID AND endorsements.endorserID = ? AND endorsements.endorsementStatus = ?) = 0', 
                    [$user->userID, 'approved'])
                ->count();
            
            // endorsed_proposals = count of proposals that have been endorsed by the current CM user
            // (regardless of whether forwarded to RDD or not, and regardless of statusID)
            // IMPORTANT: Do NOT exclude statusID 4 (For Revision) - endorsed proposals should still count even if marked for revision
            $endorsedQuery = Proposal::query();
            if ($user->researchCenterID) {
                $endorsedQuery->whereHas('user', fn($q) => $q->where('researchCenterID', $user->researchCenterID));
                // Do NOT exclude statusID 4 - endorsed proposals should count even when marked for revision
            } else {
                $endorsedQuery->whereRaw('1=0');
            }
            $stats['endorsed_proposals'] = $endorsedQuery->whereHas('endorsements', function ($q) use ($user) {
                $q->where('endorserID', $user->userID)
                  ->where('endorsementStatus', 'approved');
            })->count();
        }

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

        // For RDD users, show only proposals endorsed by CM; for others, show only their own
        $query = Proposal::with(['status', 'user.department']);

        if ($user->role?->userRole === 'RDD') {
            // Exclude archived proposals
            $query->whereNull('archivedByRDD');
            
            // Get all CM user IDs
            $cmUserIds = User::whereHas('role', function($q) {
                $q->where('userRole', 'CM');
            })->pluck('userID')->toArray();
            
            // Only include proposals with approved endorsements from CM users
            $query->whereHas('endorsements', function ($q) use ($cmUserIds) {
                $q->whereIn('endorserID', $cmUserIds)
                  ->where('endorsementStatus', 'approved');
            });
            
            // Exclude proposals that RDD has already endorsed/archived
            $rddUserIds = User::whereHas('role', function($q) {
                $q->where('userRole', 'RDD');
            })->pluck('userID')->toArray();
            
            $query->whereDoesntHave('endorsements', function ($q) use ($rddUserIds) {
                $q->whereIn('endorserID', $rddUserIds)
                  ->where('endorsementStatus', 'approved');
            });
            
            // Exclude proposals sent for revision (statusID = 4)
            // These proposals should only appear in the For Revision page
            $query->where('statusID', '!=', 4);
        } else {
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
            // Exclude proposals sent for revision (statusID = 4) - these should only appear in For Revision page
            $proposals = Proposal::with(['status', 'files', 'user.department', 'user.role', 'endorsements.endorser.role'])
                ->whereNull('archivedByRDD')
                ->where('statusID', '!=', 4) // Exclude proposals sent for revision
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

        // IMPORTANT: For statistics, include BOTH archived and non-archived proposals
        // This ensures statistics remain as real-time numbers and are NOT deducted when RDD endorses
        // When CM endorses, statistics are added/updated
        // When RDD endorses, statistics remain unchanged (not deducted)
        $query = Proposal::with(['status', 'endorsements', 'user.researchCenter', 'user.department']);
        
        // Get all CM user IDs
        $cmUserIds = User::whereHas('role', function($q) {
            $q->where('userRole', 'CM');
        })->pluck('userID')->toArray();
        
        // Only include proposals with approved endorsements from CM users
        // This includes both archived and non-archived proposals
        $query->whereHas('endorsements', function ($q) use ($cmUserIds) {
            $q->whereIn('endorserID', $cmUserIds)
              ->where('endorsementStatus', 'approved');
        });
        
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
                    
                    // Map to official category (e.g., "Publication" -> "Publications")
                    $mappedCategory = $this->mapDostValueToCategory($normalizedDost);
                    $categoryToUse = $mappedCategory ?? $normalizedDost;
                    
                    if (!isset($dost6PsMap[$categoryToUse])) {
                        $dost6PsMap[$categoryToUse] = 0;
                    }
                    $dost6PsMap[$categoryToUse]++;
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
     * Get proposals for CM's "For Revision" panel
     * Returns proposals with statusID 4 (For Revision) from CM's research center
     * that haven't been endorsed by the current CM after resubmission
     */
    public function getCmForRevisionProposals(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $user->loadMissing('role');

            // Only CM users can access this endpoint
            if ($user->role?->userRole !== 'CM') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only CM users can access this endpoint.'
                ], 403);
            }

            if (!$user->researchCenterID) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'debug' => [
                        'message' => 'CM user has no research center assigned',
                        'user_id' => $user->userID
                    ]
                ]);
            }

            // Get all proposals for revision from CM's research center
            // Include proposals with:
            // 1. statusID = 4 (For Revision) - original proposals sent for revision
            // 2. statusID = 1 AND resubmittedAfterRevision IS NOT NULL - resubmitted proposals (status changed to 1 but still need to be in For Revision)
            // CRITICAL: Use a subquery to check endorsement count to ensure we get the latest count even if endorsement was just created
            // This fixes the issue where proposals remain in "For Revision" after being endorsed to RDD
            $query = Proposal::with([
                'status:statusID,statusName,statusDescription',
                'files:fileID,proposalID,fileName,filePath,fileType,fileSize',
                'user:userID,firstName,lastName,email,researchCenterID,departmentID',
                'user.department:departmentID,name',
                'endorsements:endorsementID,proposalID,endorserID,endorsementStatus,endorsedAt'
            ])
            ->whereHas('user', function($q) use ($user) {
                $q->where('researchCenterID', $user->researchCenterID);
            })
            ->where(function($q) use ($user) {
                // Original proposals sent for revision (statusID = 4)
                $q->where(function($status4Q) use ($user) {
                    $status4Q->where('statusID', 4)
                             // CRITICAL: Exclude proposals where CM has endorsed at least once
                             // Once CM accepts the revision (endorses once), it should not appear in For Revision section
                             ->whereRaw('(SELECT COUNT(*) FROM endorsements WHERE endorsements.proposalID = proposals.proposalID AND endorsements.endorserID = ? AND endorsements.endorsementStatus = ?) = 0', 
                                 [$user->userID, 'approved']);
                })
                // OR resubmitted proposals (statusID = 1 but resubmittedAfterRevision is set)
                ->orWhere(function($subQ) use ($user) {
                    $subQ->where('statusID', 1)
                         ->whereNotNull('resubmittedAfterRevision')
                         // CRITICAL: Exclude proposals where CM has endorsed at least once
                         // Once CM accepts the revision (endorses once), it should not appear in For Revision section
                         ->whereRaw('(SELECT COUNT(*) FROM endorsements WHERE endorsements.proposalID = proposals.proposalID AND endorsements.endorserID = ? AND endorsements.endorsementStatus = ?) = 0', 
                             [$user->userID, 'approved']);
                });
            });

            // CRITICAL: Use fresh() to ensure we get the latest data from database, bypassing any query cache
            // This is important when endorsements are created just before this query runs
            // Include all necessary relationships to avoid losing user data
            $allProposals = $query->get()->fresh([
                'status:statusID,statusName,statusDescription',
                'files:fileID,proposalID,fileName,filePath,fileType,fileSize',
                'user:userID,firstName,lastName,email,researchCenterID,departmentID',
                'user.department:departmentID,name',
                'endorsements:endorsementID,proposalID,endorserID,endorsementStatus,endorsedAt,created_at'
            ]);

            // CRITICAL: Double-check filter - Remove proposals where CM has endorsed at least once
            // Use a fresh query to get the latest endorsement count for each proposal
            // This ensures immediate removal when CM accepts the revision - does NOT wait for RDD endorsement
            $filteredProposals = $allProposals->filter(function($proposal) use ($user) {
                // Use a fresh query to get the latest endorsement count
                // This ensures we catch endorsements that were just created
                $endorsementCount = \App\Models\Endorsement::where('proposalID', $proposal->proposalID)
                    ->where('endorserID', $user->userID)
                    ->where('endorsementStatus', 'approved')
                    ->count();
                
                // Exclude if CM has endorsed at least once (count >= 1)
                // Once CM accepts the revision (endorses once), it should not appear in For Revision section
                return $endorsementCount === 0;
            });

            // Log for debugging
            Log::info('CM For Revision Query Results', [
                'user_id' => $user->userID,
                'research_center_id' => $user->researchCenterID,
                'total_proposals_before_filter' => $allProposals->count(),
                'filtered_proposals_count' => $filteredProposals->count(),
                'proposal_ids' => $filteredProposals->pluck('proposalID')->toArray(),
                'endorsement_counts' => $filteredProposals->map(function($p) use ($user) {
                    $count = $p->endorsements->filter(function($e) use ($user) {
                        return $e->endorserID === $user->userID && $e->endorsementStatus === 'approved';
                    })->count();
                    return ['proposal_id' => $p->proposalID, 'endorsement_count' => $count];
                })->toArray()
            ]);

            return response()->json([
                'success' => true,
                'data' => $filteredProposals->values()->all(),
                'debug' => [
                    'total_proposals_in_center' => $allProposals->count(),
                    'filtered_proposals_count' => $filteredProposals->count(),
                    'research_center_id' => $user->researchCenterID
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching CM for revision proposals: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch proposals for revision',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    /**
     * Get proposals for RDD's "For Revision" panel
     * IMPORTANT: RDD's For Revision is at a different level than CM/Proponent's For Revision
     * This should ONLY show proposals that:
     * 1. Have been endorsed by CM (forwarded to RDD level)
     * 2. Have been reviewed by RDD and sent for revision (statusID = 4 set by RDD)
     * 3. OR have been resubmitted after RDD sent for revision
     * 
     * DO NOT include proposals that are still at CM/Proponent level (statusID = 4 but not yet reviewed by RDD)
     */
    public function getRddForRevisionProposals(Request $request): JsonResponse
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

            // Get all CM user IDs
            $cmUserIds = User::whereHas('role', function ($q) {
                $q->where('userRole', 'CM');
            })->pluck('userID')->toArray();

            // Get all RDD user IDs
            $rddUserIds = User::whereHas('role', function ($q) {
                $q->where('userRole', 'RDD');
            })->pluck('userID')->toArray();

            // RDD's For Revision should ONLY show proposals that:
            // 1. Have been endorsed by CM (forwarded to RDD level)
            // 2. Have statusID = 4 (sent for revision by RDD) OR statusID = 1 with resubmittedAfterRevision (resubmitted after RDD revision)
            // NOTE: For both cases, we don't require an RDD endorsement because:
            // - Marking for revision (statusID = 4) doesn't create an endorsement
            // - Resubmitted proposals (statusID = 1 with resubmittedAfterRevision) should show with "Updated" status
            $query = Proposal::with([
                'status:statusID,statusName,statusDescription',
                'files:fileID,proposalID,fileName,filePath,fileType,fileSize',
                'user:userID,firstName,lastName,email,researchCenterID,departmentID',
                'user.department:departmentID,name',
                'user.researchCenter:centerID,name',
                'endorsements:endorsementID,proposalID,endorserID,endorsementStatus,endorsedAt'
            ])
            ->whereNull('archivedByRDD')
            // Must have been endorsed by CM (forwarded to RDD level)
            ->whereHas('endorsements', function ($query) use ($cmUserIds) {
                $query->where('endorsementStatus', 'approved')
                    ->whereIn('endorserID', $cmUserIds);
            })
            ->where(function($q) {
                // Proposals sent for revision by RDD (statusID = 4) - "In Progress"
                $q->where('statusID', 4)
                // OR resubmitted proposals after RDD sent for revision (statusID = 1 but resubmittedAfterRevision is set) - "Updated"
                // No RDD endorsement required because they were already at RDD level before revision
                ->orWhere(function($subQ) {
                    $subQ->where('statusID', 1)
                         ->whereNotNull('resubmittedAfterRevision');
                });
            });

            $allProposals = $query->get();

            // Debug logging to help identify issues
            $debugProposals = Proposal::whereNull('archivedByRDD')
                ->whereHas('endorsements', function ($query) use ($cmUserIds) {
                    $query->where('endorsementStatus', 'approved')
                        ->whereIn('endorserID', $cmUserIds);
                })
                ->where('statusID', 4)
                ->get();

            Log::info('RDD For Revision proposals fetched', [
                'count' => $allProposals->count(),
                'user_id' => $user->userID,
                'debug_status_4_count' => $debugProposals->count(),
                'debug_status_4_proposal_ids' => $debugProposals->pluck('proposalID')->toArray()
            ]);

            return response()->json([
                'success' => true,
                'data' => $allProposals->values()->all()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching RDD for revision proposals: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch proposals for revision',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
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
                    // For non-Redis stores, try to clear using cache tags if supported
                    if (method_exists($store, 'tags')) {
                        try {
                            Cache::tags(["proposal_{$proposalId}"])->flush();
                        } catch (\Exception $e) {
                            // Tags might not be supported, fall back to manual clearing
                            Log::info("Cache tags not supported, attempting manual cache clear");
                        }
                    }
                    
                    // Also try to clear common cache keys manually
                    // Get all users who might have cached this proposal
                    $users = \App\Models\User::pluck('userID');
                    foreach ($users as $userId) {
                        $cacheKey = "proposal_{$proposalId}_user_{$userId}";
                        Cache::forget($cacheKey);
                    }
                    
                    // Clear the general proposal cache
                    Cache::forget("proposal_{$proposalId}");
                }
                
                // Also clear any list caches that might include this proposal
                Cache::forget("cm_for_revision_proposals");
                Cache::forget("rdd_for_revision_proposals");
                Cache::forget("proponent_proposals");
                
                // Clear statistics cache if it exists
                Cache::forget("proposal_statistics");
                Cache::forget("rdd_statistics_cache");
                Cache::forget("cm_statistics_cache");
                Cache::forget("rdd_dashboard_statistics_cache");
                Cache::forget("cm_dashboard_statistics_cache");
                
                Log::info("Proposal cache cleared including statistics", ['proposal_id' => $proposalId]);
            } catch (\Exception $e) {
                Log::warning("Failed to clear proposal cache: " . $e->getMessage());
            }
        } catch (\Exception $e) {
            Log::warning("Failed to clear proposal cache: " . $e->getMessage());
        }
    }
}
