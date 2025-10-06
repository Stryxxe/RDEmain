<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\CacheService;

class OptimizePerformance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'performance:optimize {--warm-cache : Warm up frequently accessed caches}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Optimize system performance by running migrations and warming caches';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting performance optimization...');

        // Run the performance migration
        $this->info('Running performance optimization migration...');
        $this->call('migrate', ['--path' => 'database/migrations/2025_01_03_000001_optimize_messages_performance.php']);

        if ($this->option('warm-cache')) {
            $this->info('Warming up caches...');
            CacheService::warmUpCaches();
        }

        // Clear existing caches to ensure fresh start
        $this->info('Clearing existing caches...');
        $this->call('cache:clear');

        // Show cache statistics
        $this->info('Cache statistics:');
        $stats = CacheService::getCacheStats();
        foreach ($stats as $key => $value) {
            $this->line("  {$key}: {$value}");
        }

        $this->info('Performance optimization completed successfully!');
        
        return Command::SUCCESS;
    }
}
