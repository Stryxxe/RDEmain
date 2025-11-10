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
use Illuminate\Support\Str;

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
            $budgetBreakdown = $this->prepareBudgetBreakdown(
                $request->input('budgetBreakdown'),
                (float) $request->proposedBudget
            );

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
            'proposedBudget' => 'sometimes|numeric|min:0',
            'budgetBreakdown' => 'sometimes|array'
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

            $proposedBudget = $request->has('proposedBudget')
                ? (float) $request->proposedBudget
                : (float) $proposal->proposedBudget;

            if ($request->has('budgetBreakdown')) {
                $updateData['budgetBreakdown'] = $this->prepareBudgetBreakdown(
                    $request->input('budgetBreakdown'),
                    $proposedBudget
                );
            } elseif ($request->has('proposedBudget')) {
                $updateData['budgetBreakdown'] = $this->generateDefaultBudgetBreakdown($proposedBudget);
            }

            if ($request->hasAny(['researchAgenda', 'dostSPs', 'sustainableDevelopmentGoals', 'proposedBudget', 'budgetBreakdown'])) {
                $matrixData = $proposal->matrixOfCompliance ?: [];
                
                if ($request->has('researchAgenda')) $matrixData['researchAgenda'] = $request->researchAgenda;
                if ($request->has('dostSPs')) $matrixData['dostSPs'] = $request->dostSPs;
                if ($request->has('sustainableDevelopmentGoals')) $matrixData['sustainableDevelopmentGoals'] = $request->sustainableDevelopmentGoals;
                if ($request->has('proposedBudget')) $matrixData['proposedBudget'] = $request->proposedBudget;
                if (array_key_exists('budgetBreakdown', $updateData)) {
                    $matrixData['budgetBreakdown'] = $updateData['budgetBreakdown'];
                }
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
            ->filter(fn ($item) => ($item['ongoing'] + $item['completed'] + $item['other']) > 0)
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
            ->filter(fn ($item) => $item['value'] > 0)
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
}
