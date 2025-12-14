<?php

namespace App\Console\Commands;

use App\Models\Setting;
use App\Services\ActivityService;
use App\Services\BackupService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RunBackups extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:run {--no-scan : Skip scanning for duplicate files before copying} {--force : Run even if frequency window has not elapsed}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run scheduled backups based on configured frequency and storage location';

    public function __construct(private readonly BackupService $backupService)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $backupPath = Setting::get('backupStorageLocation');
        $frequency = Setting::get('backupFrequency', 'daily');
        $lastBackup = Setting::get('lastBackupTime');
        $scan = !$this->option('no-scan');
        $force = $this->option('force');

        if (empty($backupPath)) {
            $this->error('Backup storage location is not configured. Set it in System Settings.');
            Log::warning('Scheduled backup skipped: backup path not configured');
            return Command::FAILURE;
        }

        // Determine if backup is due based on frequency
        if (!$force && !$this->isBackupDue($frequency, $lastBackup)) {
            $this->info('Backup not due yet based on frequency; skipping.');
            return Command::SUCCESS;
        }

        $this->info('Running backup...');
        $result = $this->backupService->createBackup($backupPath, $scan);

        if (!$result['success']) {
            $message = $result['message'] ?? 'Unknown backup failure';
            $this->error($message);
            Log::error('Scheduled backup failed', ['message' => $message]);
            return Command::FAILURE;
        }

        // Persist last backup time for frequency checks
        Setting::set('lastBackupTime', Carbon::now()->toIso8601String());

        $this->info('Backup completed successfully.');
        Log::info('Scheduled backup completed', $result['data'] ?? []);

        // Log activity for visibility
        ActivityService::log(
            'backup_triggered',
            'Scheduled backup completed',
            'System',
            null,
            null,
            $result['data'] ?? null
        );

        return Command::SUCCESS;
    }

    /**
     * Determine if a backup is due based on frequency and last run time.
     */
    private function isBackupDue(string $frequency, $lastBackup): bool
    {
        if (empty($lastBackup)) {
            return true; // Never run before
        }

        $last = Carbon::parse($lastBackup);
        $now = Carbon::now();

        $nextDue = match (strtolower($frequency)) {
            'hourly' => $last->copy()->addHour(),
            'twice_daily' => $last->copy()->addHours(12),
            'weekly' => $last->copy()->addWeek(),
            'monthly' => $last->copy()->addMonth(),
            default => $last->copy()->addDay(), // daily fallback
        };

        return $now->greaterThanOrEqualTo($nextDue);
    }
}
