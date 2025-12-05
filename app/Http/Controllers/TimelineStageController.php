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
     * Store a newly created timeline stage
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'stageName' => 'required|string|max:100',
            'stageDescription' => 'nullable|string',
            'orderIndex' => 'required|integer|min:0',
            'statusID' => 'nullable|exists:status,statusID',
            'isActive' => 'boolean',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20'
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $stage = TimelineStage::create($request->all());

            // Log activity
            ActivityService::logTimelineStageCreate($stage->stageID, $stage->stageName);

            return back()->with('success', 'Timeline stage created successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to create timeline stage: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified timeline stage
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'stageName' => 'required|string|max:100',
            'stageDescription' => 'nullable|string',
            'orderIndex' => 'required|integer|min:0',
            'statusID' => 'nullable|exists:status,statusID',
            'isActive' => 'boolean',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20'
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $stage = TimelineStage::findOrFail($id);
            $oldData = $stage->toArray();
            $stage->update($request->all());

            // Log activity
            ActivityService::logTimelineStageUpdate($stage->stageID, $stage->stageName, $oldData, $stage->toArray());

            return back()->with('success', 'Timeline stage updated successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to update timeline stage: ' . $e->getMessage());
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

            return back()->with('success', 'Timeline stage status updated successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to update stage status: ' . $e->getMessage());
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

            return back()->with('success', 'Timeline stage deleted successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete timeline stage: ' . $e->getMessage());
        }
    }
}
