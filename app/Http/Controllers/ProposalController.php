<?php

namespace App\Http\Controllers;

use App\Models\Proposal;
use App\Models\File;
use App\Models\Notification;
use App\Models\User;
use App\Events\ProposalSubmitted;
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
        
        // Load the role relationship if not already loaded
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }
        
        // For RDD users, show all proposals; for CM users, show proposals from their department; for others, show only their own
        $query = Proposal::with(['status', 'files', 'user.department', 'user.role']);
        if ($user->role && $user->role->userRole === 'RDD') {
            // RDD users can see all proposals - no filtering needed
        } elseif ($user->role && $user->role->userRole === 'CM') {
            // For CM users, filter by department
            $query->whereHas('user', function($q) use ($user) {
                $q->where('departmentID', $user->departmentID);
            });
        } else {
            // For other users (like Proponents), show only their own proposals
            $query->where('userID', $user->userID);
        }
        
        $proposals = $query->orderBy('proposalID', 'asc')->get();

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
        
        // Load the role relationship if not already loaded
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }
        
        // For RDD users, show all proposals; for CM users, show proposals from their department; for others, show only their own
        $query = Proposal::where('proposalID', $id)->with(['status', 'files', 'user.department', 'user.role']);
        if ($user->role && $user->role->userRole === 'RDD') {
            // RDD users can see all proposals - no filtering needed
        } elseif ($user->role && $user->role->userRole === 'CM') {
            // For CM users, filter by department
            $query->whereHas('user', function($q) use ($user) {
                $q->where('departmentID', $user->departmentID);
            });
        } else {
            // For other users (like Proponents), show only their own proposals
            $query->where('userID', $user->userID);
        }
        
        $proposal = $query->first();

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
        $user = Auth::user();
        
        // Load the role relationship if not already loaded
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }
        
        // Only proponents can submit proposals
        if (!$user->role || $user->role->userRole !== 'Proponent') {
            return response()->json([
                'success' => false,
                'message' => 'Only proponents can submit proposals'
            ], 403);
        }

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
            // Parse JSON strings from frontend
            $researchAgenda = json_decode($request->researchAgenda, true);
            $dostSPs = json_decode($request->dostSPs, true);
            $sustainableDevelopmentGoals = json_decode($request->sustainableDevelopmentGoals, true);
            
            // Get user's department as research center
            $userDepartment = $user->department;
            $researchCenter = $userDepartment ? $userDepartment->name : 'Not specified';
            
            // Create the proposal
            $proposal = Proposal::create([
                'researchTitle' => $request->researchTitle,
                'description' => $request->description,
                'objectives' => $request->objectives,
                'researchCenter' => $researchCenter,
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

            // Find CM of the same department and notify them
            $cmUser = User::whereHas('role', function($query) {
                $query->where('userRole', 'CM');
            })
            ->where('departmentID', $user->departmentID)
            ->first();

            if ($cmUser) {
                Notification::create([
                    'userID' => $cmUser->userID,
                    'type' => 'info',
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
        
        // Load the role relationship if not already loaded
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }
        
        // For RDD users, show all proposals; for CM users, show proposals from their department; for others, show only their own
        $query = Proposal::query();
        if ($user->role && $user->role->userRole === 'RDD') {
            // RDD users can see all proposals - no filtering needed
        } elseif ($user->role && $user->role->userRole === 'CM') {
            // For CM users, filter by department
            $query->whereHas('user', function($q) use ($user) {
                $q->where('departmentID', $user->departmentID);
            });
        } else {
            // For other users (like Proponents), show only their own proposals
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
        
        // Load the role relationship if not already loaded
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }
        
        // For RDD users, show all proposals; for others, show only their own
        $query = Proposal::with(['status', 'user.department']);
        if ($user->role && $user->role->userRole !== 'RDD') {
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
     * Get RDE Agenda data from proposals
     */
    private function getRdeAgendaData($proposals)
    {
        $rdeAgendas = [
            'Agriculture, Aquatic, and Agro-Forestry' => ['ongoing' => 0, 'completed' => 0, 'total' => 0],
            'Business and Trade' => ['ongoing' => 0, 'completed' => 0, 'total' => 0],
            'Social Sciences and Education' => ['ongoing' => 0, 'completed' => 0, 'total' => 0],
            'Engineering and Technology' => ['ongoing' => 0, 'completed' => 0, 'total' => 0],
            'Environment and Natural Resources' => ['ongoing' => 0, 'completed' => 0, 'total' => 0],
            'Health and Wellness' => ['ongoing' => 0, 'completed' => 0, 'total' => 0],
            'Peace and Security' => ['ongoing' => 0, 'completed' => 0, 'total' => 0],
        ];

        foreach ($proposals as $proposal) {
            $agendas = $proposal->researchAgenda ?? [];
            $status = $proposal->statusID;
            
            foreach ($agendas as $agenda) {
                if (isset($rdeAgendas[$agenda])) {
                    $rdeAgendas[$agenda]['total']++;
                    if ($status == 4) { // Ongoing
                        $rdeAgendas[$agenda]['ongoing']++;
                    } elseif ($status == 5) { // Completed
                        $rdeAgendas[$agenda]['completed']++;
                    }
                }
            }
        }

        return array_map(function($name, $data) {
            return array_merge(['name' => $name], $data);
        }, array_keys($rdeAgendas), array_values($rdeAgendas));
    }

    /**
     * Get DOST 6Ps data from proposals
     */
    private function getDost6PsData($proposals)
    {
        $dost6Ps = [
            'Publications' => 0,
            'Patent' => 0,
            'Product' => 0,
            'People Services' => 0,
            'Places and Partner' => 0,
            'Policies' => 0,
        ];

        foreach ($proposals as $proposal) {
            $dostSPs = $proposal->dostSPs ?? [];
            foreach ($dostSPs as $dostSP) {
                // Map DOST SPs to 6Ps categories
                if (strpos($dostSP, 'Publications') !== false) {
                    $dost6Ps['Publications']++;
                } elseif (strpos($dostSP, 'Patent') !== false) {
                    $dost6Ps['Patent']++;
                } elseif (strpos($dostSP, 'Product') !== false) {
                    $dost6Ps['Product']++;
                } elseif (strpos($dostSP, 'People') !== false) {
                    $dost6Ps['People Services']++;
                } elseif (strpos($dostSP, 'Places') !== false || strpos($dostSP, 'Partner') !== false) {
                    $dost6Ps['Places and Partner']++;
                } elseif (strpos($dostSP, 'Policies') !== false) {
                    $dost6Ps['Policies']++;
                }
            }
        }

        return array_map(function($name, $value) {
            return ['name' => $name, 'value' => $value];
        }, array_keys($dost6Ps), array_values($dost6Ps));
    }

    /**
     * Get SDG data from proposals
     */
    private function getSdgData($proposals)
    {
        $sdgData = [
            '1' => ['fullName' => 'No Poverty', 'value' => 0, 'color' => '#E5243B'],
            '2' => ['fullName' => 'Zero Hunger', 'value' => 0, 'color' => '#DDA63A'],
            '3' => ['fullName' => 'Good Health and Well-being', 'value' => 0, 'color' => '#4C9F38'],
            '4' => ['fullName' => 'Quality Education', 'value' => 0, 'color' => '#C5192D'],
            '5' => ['fullName' => 'Gender Equality', 'value' => 0, 'color' => '#FF3A21'],
            '6' => ['fullName' => 'Clean Water and Sanitation', 'value' => 0, 'color' => '#26BDE2'],
            '7' => ['fullName' => 'Affordable and Clean Energy', 'value' => 0, 'color' => '#FCC30B'],
            '8' => ['fullName' => 'Decent Work and Economic Growth', 'value' => 0, 'color' => '#A21942'],
            '9' => ['fullName' => 'Industry, Innovation and Infrastructure', 'value' => 0, 'color' => '#FD6925'],
            '10' => ['fullName' => 'Reduced Inequalities', 'value' => 0, 'color' => '#DD1367'],
            '11' => ['fullName' => 'Sustainable Cities and Communities', 'value' => 0, 'color' => '#FD9D24'],
            '12' => ['fullName' => 'Responsible Consumption and Production', 'value' => 0, 'color' => '#BF8B2E'],
            '13' => ['fullName' => 'Climate Action', 'value' => 0, 'color' => '#3F7E44'],
            '14' => ['fullName' => 'Life Below Water', 'value' => 0, 'color' => '#0A97D9'],
            '15' => ['fullName' => 'Life on Land', 'value' => 0, 'color' => '#56C02B'],
            '16' => ['fullName' => 'Peace, Justice and Strong Institutions', 'value' => 0, 'color' => '#00689D'],
            '17' => ['fullName' => 'Partnerships for the Goals', 'value' => 0, 'color' => '#19486A'],
        ];

        foreach ($proposals as $proposal) {
            $sdgs = $proposal->sustainableDevelopmentGoals ?? [];
            foreach ($sdgs as $sdg) {
                // Extract SDG number from string like "SDG 1: No Poverty"
                if (preg_match('/SDG (\d+):/', $sdg, $matches)) {
                    $sdgNumber = $matches[1];
                    if (isset($sdgData[$sdgNumber])) {
                        $sdgData[$sdgNumber]['value']++;
                    }
                }
            }
        }

        return array_map(function($name, $data) {
            return array_merge(['name' => $name], $data);
        }, array_keys($sdgData), array_values($sdgData));
    }
}
