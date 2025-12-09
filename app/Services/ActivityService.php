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
        $name = ($userData['firstName'] ?? '') . ' ' . ($userData['lastName'] ?? '');
        self::log(
            'create',
            'Created new user: ' . trim($name),
            'User',
            $userId,
            null,
            $userData
        );
    }

    public static function logUserUpdate(int $userId, array $oldData, array $newData): void
    {
        $changes = self::getChangedFields($oldData, $newData);
        $name = ($newData['firstName'] ?? '') . ' ' . ($newData['lastName'] ?? '');
        self::log(
            'update',
            'Updated user: ' . trim($name ?: 'Unknown'),
            'User',
            $userId,
            $oldData,
            $newData
        );
    }

    public static function logUserDelete(array $userData): void
    {
        $name = ($userData['firstName'] ?? '') . ' ' . ($userData['lastName'] ?? '');
        self::log(
            'delete',
            'Deleted user: ' . trim($name),
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

    public static function logSettingsChange(array $settings): void
    {
        $settingKeys = array_keys($settings);
        $settingList = implode(', ', $settingKeys);
        
        $oldValues = [];
        $newValues = [];
        
        foreach ($settings as $key => $values) {
            $oldValues[$key] = $values['old'];
            $newValues[$key] = $values['new'];
        }
        
        $description = count($settingKeys) === 1 
            ? "Changed setting: $settingList" 
            : "Changed settings: $settingList";
        
        self::log(
            'update',
            $description,
            'Settings',
            null,
            $oldValues,
            $newValues
        );
    }

    public static function logTimelineStageCreate(int $stageId, string $stageName): void
    {
        self::log(
            'create',
            "Created timeline stage: $stageName",
            'TimelineStage',
            $stageId
        );
    }

    public static function logTimelineStageUpdate(int $stageId, string $stageName, array $oldData, array $newData): void
    {
        self::log(
            'update',
            "Updated timeline stage: $stageName",
            'TimelineStage',
            $stageId,
            $oldData,
            $newData
        );
    }

    public static function logTimelineStageDelete(int $stageId, string $stageName): void
    {
        self::log(
            'delete',
            "Deleted timeline stage: $stageName",
            'TimelineStage',
            $stageId
        );
    }

    public static function logDepartmentCreate(int $departmentId, string $departmentName): void
    {
        self::log(
            'create',
            'Created department: ' . $departmentName,
            'Department',
            $departmentId
        );
    }

    public static function logDepartmentUpdate(int $departmentId, string $oldName, string $newName): void
    {
        self::log(
            'update',
            'Updated department: ' . $oldName . ' to ' . $newName,
            'Department',
            $departmentId,
            ['name' => $oldName],
            ['name' => $newName]
        );
    }

    public static function logDepartmentDelete(int $departmentId, string $departmentName): void
    {
        self::log(
            'delete',
            'Deleted department: ' . $departmentName,
            'Department',
            $departmentId
        );
    }

    public static function logResearchCenterCreate(int $centerId, string $centerName): void
    {
        self::log(
            'create',
            'Created research center: ' . $centerName,
            'ResearchCenter',
            $centerId
        );
    }

    public static function logResearchCenterDelete(int $centerId, string $centerName): void
    {
        self::log(
            'delete',
            'Deleted research center: ' . $centerName,
            'ResearchCenter',
            $centerId
        );
    }

    public static function logRoleCreate(int $roleId, string $roleName): void
    {
        self::log(
            'create',
            'Created project role: ' . $roleName,
            'ProjectRole',
            $roleId
        );
    }

    public static function logRoleDelete(int $roleId, string $roleName): void
    {
        self::log(
            'delete',
            'Deleted project role: ' . $roleName,
            'ProjectRole',
            $roleId
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
