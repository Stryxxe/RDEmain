<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ProgressReport;
use App\Models\ResearchCenter;
use App\Models\Department;

class FixProgressReportCenters extends Command
{
    protected $signature = 'fix:progress-report-centers';
    protected $description = 'Fix researchCenterID in progress_reports to match valid research_centers';

    public function handle()
    {
        $fixed = 0;
        $reports = ProgressReport::all();
        foreach ($reports as $report) {
            // Try to find a matching research center by department
            $center = ResearchCenter::where('departmentID', $report->departmentID)->first();
            if ($center && $report->researchCenterID !== $center->centerID) {
                $report->researchCenterID = $center->centerID;
                $report->save();
                $fixed++;
                $this->info("Fixed reportID {$report->reportID}: set researchCenterID to {$center->centerID} ({$center->name})");
            }
        }
        $this->info("Done. Fixed {$fixed} progress reports.");
    }
}
