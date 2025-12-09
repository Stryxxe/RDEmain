<?php

namespace App\Http\Controllers;

use App\Models\TimelineStage;
use App\Models\Status;
use App\Services\ActivityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class TimelineStageController extends Controller
{
    /**
     * Display a listing of timeline stages (Admin view)
     */
    public function index()
    {
        $stages = TimelineStage::with('status')->ordered()->get();
        $statuses = Status::all();

        return Inertia::render('Admin/TimelineStages', [
            'stages' => $stages,
            'statuses' => $statuses
        ]);
    }

    /**
     * Get all active timeline stages (API endpoint for frontend)
     */
    public function getActiveStages()
    {
        $stages = TimelineStage::active()->ordered()->with('status')->get();
        
        return response()->json([
            'success' => true,
            'stages' => $stages
        ]);
    }

    /**
     * Get all timeline stages for admin (including inactive)
     */
    public function getAllStages()
    {
        $stages = TimelineStage::ordered()->with('status')->get();
        
        return response()->json([
            'success' => true,
            'stages' => $stages
        ]);
    }

    /**
     * Store a newly created timeline stage
     */
    public function store(Request $request)
    {
        // Prepare data - convert empty statusID to null
        $data = $request->all();
        if (empty($data['statusID'])) {
            $data['statusID'] = null;
        }
        
        $validator = Validator::make($data, [
            'stageName' => 'required|string|max:100',
            'stageDescription' => 'nullable|string',
            'orderIndex' => 'required|integer|min:0',
            'statusID' => 'nullable|exists:status,statusID',
            'isActive' => 'boolean',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $stage = TimelineStage::create($data);

            // Log activity
            ActivityService::logTimelineStageCreate($stage->stageID, $stage->stageName);

            return response()->json([
                'success' => true,
                'message' => 'Timeline stage created successfully!',
                'stage' => $stage
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create timeline stage: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified timeline stage
     */
    public function update(Request $request, $id)
    {
        // Prepare data - convert empty statusID to null
        $data = $request->all();
        if (empty($data['statusID'])) {
            $data['statusID'] = null;
        }
        
        $validator = Validator::make($data, [
            'stageName' => 'required|string|max:100',
            'stageDescription' => 'nullable|string',
            'orderIndex' => 'required|integer|min:0',
            'statusID' => 'nullable|exists:status,statusID',
            'isActive' => 'boolean',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $stage = TimelineStage::findOrFail($id);
            $oldData = $stage->toArray();
            $stage->update($data);

            // Log activity
            ActivityService::logTimelineStageUpdate($stage->stageID, $stage->stageName, $oldData, $stage->toArray());

            return response()->json([
                'success' => true,
                'message' => 'Timeline stage updated successfully!',
                'stage' => $stage
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update timeline stage: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the order of timeline stages (bulk update)
     */
    public function updateOrder(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'stages' => 'required|array',
            'stages.*.stageID' => 'required|exists:timeline_stages,stageID',
            'stages.*.orderIndex' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            foreach ($request->stages as $stageData) {
                TimelineStage::where('stageID', $stageData['stageID'])
                    ->update(['orderIndex' => $stageData['orderIndex']]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Timeline stages reordered successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder stages: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle the active status of a timeline stage
     */
    public function toggleActive($id)
    {
        try {
            $stage = TimelineStage::findOrFail($id);
            $stage->isActive = !$stage->isActive;
            $stage->save();

            return response()->json([
                'success' => true,
                'message' => 'Timeline stage status updated successfully!',
                'stage' => $stage
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update stage status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified timeline stage
     */
    public function destroy($id)
    {
        try {
            $stage = TimelineStage::findOrFail($id);
            $stageName = $stage->stageName;
            $stage->delete();

            // Log activity
            ActivityService::logTimelineStageDelete($id, $stageName);

            return response()->json([
                'success' => true,
                'message' => 'Timeline stage deleted successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete timeline stage: ' . $e->getMessage()
            ], 500);
        }
    }
}
