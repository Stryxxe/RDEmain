<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\Setting;
use Illuminate\Console\Command;
use Carbon\Carbon;

class CleanOldActivityLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logs:clean-activities';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean old activity logs based on log retention setting';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Get retention days from settings
        $retentionDays = Setting::get('log_retention', 90);
        
        $this->info("Cleaning activity logs older than {$retentionDays} days...");
        
        // Calculate cutoff date
        $cutoffDate = Carbon::now()->subDays($retentionDays);
        
        // Delete old logs
        $deleted = ActivityLog::where('created_at', '<', $cutoffDate)->delete();
        
        $this->info("Deleted {$deleted} old activity log(s).");
        
        return Command::SUCCESS;
    }
}
