<?php

namespace App\Jobs;

use App\Models\Setting;
use App\Services\ActivityService;
use App\Services\BackupService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class PerformScheduledBackup implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(BackupService $backupService): void
    {
        $backupPath = Setting::get('backupStorageLocation');
        $frequency = Setting::get('backupFrequency', 'daily');
        $lastBackup = Setting::get('lastBackupTime');

        // Skip if not configured
        if (empty($backupPath)) {
            Log::info('Auto-backup skipped: backup path not configured');
            return;
        }

        // Check if backup is due
        if (!$this->isBackupDue($frequency, $lastBackup)) {
            Log::info('Auto-backup skipped: not due yet', [
                'frequency' => $frequency,
                'last_backup' => $lastBackup,
            ]);
            return;
        }

        // Perform backup
        $result = $backupService->createBackup($backupPath, true);

        if ($result['success']) {
            Setting::set('lastBackupTime', Carbon::now()->toIso8601String());
            Log::info('Auto-backup completed on admin login', $result['data'] ?? []);

            ActivityService::log(
                'backup_triggered',
                'Automatic backup on admin login',
                'System',
                null,
                null,
                $result['data'] ?? null
            );
        } else {
            Log::warning('Auto-backup failed', ['message' => $result['message'] ?? 'Unknown error']);
        }
    }

    /**
     * Check if backup is due based on frequency
     */
    private function isBackupDue(string $frequency, $lastBackup): bool
    {
        if (empty($lastBackup)) {
            return true;
        }

        $last = Carbon::parse($lastBackup);
        $now = Carbon::now();

        $nextDue = match (strtolower($frequency)) {
            'hourly' => $last->copy()->addHour(),
            'twice_daily' => $last->copy()->addHours(12),
            'weekly' => $last->copy()->addWeek(),
            'monthly' => $last->copy()->addMonth(),
            default => $last->copy()->addDay(),
        };

        return $now->greaterThanOrEqualTo($nextDue);
    }
}
