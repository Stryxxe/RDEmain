<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityController extends Controller
{
    public function getRecentActivities(Request $request)
    {
        $perPage = $request->input('per_page', 50);
        $page = $request->input('page', 1);

        $activities = Activity::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        $formattedActivities = $activities->items();
        foreach ($formattedActivities as $activity) {
            $activity->userName = $activity->user?->name ?? 'System';
            $activity->formatted_date = $activity->created_at->diffForHumans();
        }

        return response()->json([
            'data' => $formattedActivities,
            'total' => $activities->total(),
            'per_page' => $activities->perPage(),
            'current_page' => $activities->currentPage(),
            'last_page' => $activities->lastPage(),
        ]);
    }

    public function getDashboardActivities()
    {
        $activities = Activity::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function ($activity) {
                return [
                    'activityID' => $activity->activityID,
                    'userID' => $activity->userID,
                    'userName' => $activity->user?->name ?? 'System',
                    'action' => $activity->action,
                    'description' => $activity->description,
                    'model_type' => $activity->model_type,
                    'model_id' => $activity->model_id,
                    'ip_address' => $activity->ip_address,
                    'created_at' => $activity->created_at,
                    'formatted_date' => $activity->created_at->diffForHumans(),
                ];
            });

        return response()->json($activities);
    }
}
