<?php

namespace App\Services;

use App\Models\Activity;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityService
{
    public static function log(
        string $action,
        string $description,
        ?string $modelType = null,
        ?int $modelId = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): Activity {
        return Activity::create([
            'userID' => Auth::id(),
            'action' => $action,
            'description' => $description,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    public static function logUserCreate(array $userData, int $userId): void
    {
        self::log(
            'create',
            'Created new user: ' . $userData['name'],
            'User',
            $userId,
            null,
            $userData
        );
    }

    public static function logUserUpdate(int $userId, array $oldData, array $newData): void
    {
        $changes = self::getChangedFields($oldData, $newData);
        self::log(
            'update',
            'Updated user: ' . ($newData['name'] ?? 'Unknown'),
            'User',
            $userId,
            $oldData,
            $newData
        );
    }

    public static function logUserDelete(array $userData): void
    {
        self::log(
            'delete',
            'Deleted user: ' . $userData['name'],
            'User',
            $userData['userID'] ?? null,
            $userData,
            null
        );
    }

    public static function logProposalCreate(int $proposalId, string $proposalTitle): void
    {
        self::log(
            'create',
            'Created proposal: ' . $proposalTitle,
            'Proposal',
            $proposalId
        );
    }

    public static function logProposalStatusChange(int $proposalId, string $proposalTitle, string $oldStatus, string $newStatus): void
    {
        self::log(
            'update',
            "Updated proposal '$proposalTitle' status from $oldStatus to $newStatus",
            'Proposal',
            $proposalId,
            ['status' => $oldStatus],
            ['status' => $newStatus]
        );
    }

    public static function logProposalDelete(int $proposalId, string $proposalTitle): void
    {
        self::log(
            'delete',
            'Deleted proposal: ' . $proposalTitle,
            'Proposal',
            $proposalId
        );
    }

    public static function logSettingsChange(string $setting, $oldValue, $newValue): void
    {
        self::log(
            'update',
            "Changed setting: $setting",
            'Settings',
            null,
            [$setting => $oldValue],
            [$setting => $newValue]
        );
    }

    public static function logTimelineStageCreate(int $proposalId, string $stageName): void
    {
        self::log(
            'create',
            "Added timeline stage: $stageName to proposal ID $proposalId",
            'TimelineStage',
            $proposalId
        );
    }

    public static function logTimelineStageDelete(int $proposalId, string $stageName): void
    {
        self::log(
            'delete',
            "Removed timeline stage: $stageName from proposal ID $proposalId",
            'TimelineStage',
            $proposalId
        );
    }

    public static function logDepartmentCreate(string $departmentName, int $departmentId): void
    {
        self::log(
            'create',
            'Created department: ' . $departmentName,
            'Department',
            $departmentId
        );
    }

    public static function logDepartmentUpdate(string $departmentName, int $departmentId, array $oldData, array $newData): void
    {
        self::log(
            'update',
            'Updated department: ' . $departmentName,
            'Department',
            $departmentId,
            $oldData,
            $newData
        );
    }

    public static function logDepartmentDelete(string $departmentName): void
    {
        self::log(
            'delete',
            'Deleted department: ' . $departmentName,
            'Department'
        );
    }

    public static function logResearchCenterCreate(string $centerName, int $centerId): void
    {
        self::log(
            'create',
            'Created research center: ' . $centerName,
            'ResearchCenter',
            $centerId
        );
    }

    public static function logResearchCenterDelete(string $centerName): void
    {
        self::log(
            'delete',
            'Deleted research center: ' . $centerName,
            'ResearchCenter'
        );
    }

    public static function logRoleCreate(string $roleName, int $roleId): void
    {
        self::log(
            'create',
            'Created role: ' . $roleName,
            'Role',
            $roleId
        );
    }

    public static function logRoleDelete(string $roleName): void
    {
        self::log(
            'delete',
            'Deleted role: ' . $roleName,
            'Role'
        );
    }

    private static function getChangedFields(array $oldData, array $newData): array
    {
        $changes = [];
        foreach ($newData as $key => $value) {
            if (!isset($oldData[$key]) || $oldData[$key] != $value) {
                $changes[$key] = [
                    'old' => $oldData[$key] ?? null,
                    'new' => $value,
                ];
            }
        }
        return $changes;
    }
}
