<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Proposal;
use App\Models\File;
use Carbon\Carbon;

class ProposalFileSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all proposals
        $proposals = Proposal::all();
        
        if ($proposals->isEmpty()) {
            $this->command->error('No proposals found. Please run ProposalSeeder first.');
            return;
        }

        // Sample file types and names
        $fileTypes = [
            'report' => 'Research Proposal Report',
            'seti_scorecard' => 'SETI Scorecard',
            'gad_certificate' => 'GAD Certificate',
            'matrix_compliance' => 'Matrix of Compliance'
        ];

        foreach ($proposals as $proposal) {
            // Check if proposal already has files
            if ($proposal->files()->count() > 0) {
                $this->command->info("Proposal '{$proposal->researchTitle}' already has files, skipping...");
                continue;
            }

            // Create sample files for each proposal
            $files = [];
            
            // Main report file (always create this one)
            $files[] = [
                'proposalID' => $proposal->proposalID,
                'fileName' => 'research_proposal_' . $proposal->proposalID . '.pdf',
                'filePath' => 'proposals/' . $proposal->proposalID . '/research_proposal_' . $proposal->proposalID . '.pdf',
                'fileType' => 'report',
                'fileSize' => rand(500000, 2000000), // 500KB to 2MB
                'uploadedAt' => $proposal->uploadedAt ?? Carbon::now()->subDays(rand(1, 30))
            ];

            // Randomly add supporting documents (70% chance for each)
            if (rand(1, 10) <= 7) {
                $files[] = [
                    'proposalID' => $proposal->proposalID,
                    'fileName' => 'seti_scorecard_' . $proposal->proposalID . '.pdf',
                    'filePath' => 'proposals/' . $proposal->proposalID . '/seti_scorecard_' . $proposal->proposalID . '.pdf',
                    'fileType' => 'seti_scorecard',
                    'fileSize' => rand(200000, 800000), // 200KB to 800KB
                    'uploadedAt' => $proposal->uploadedAt ?? Carbon::now()->subDays(rand(1, 30))
                ];
            }

            if (rand(1, 10) <= 7) {
                $files[] = [
                    'proposalID' => $proposal->proposalID,
                    'fileName' => 'gad_certificate_' . $proposal->proposalID . '.pdf',
                    'filePath' => 'proposals/' . $proposal->proposalID . '/gad_certificate_' . $proposal->proposalID . '.pdf',
                    'fileType' => 'gad_certificate',
                    'fileSize' => rand(150000, 600000), // 150KB to 600KB
                    'uploadedAt' => $proposal->uploadedAt ?? Carbon::now()->subDays(rand(1, 30))
                ];
            }

            if (rand(1, 10) <= 7) {
                $files[] = [
                    'proposalID' => $proposal->proposalID,
                    'fileName' => 'matrix_compliance_' . $proposal->proposalID . '.pdf',
                    'filePath' => 'proposals/' . $proposal->proposalID . '/matrix_compliance_' . $proposal->proposalID . '.pdf',
                    'fileType' => 'matrix_compliance',
                    'fileSize' => rand(300000, 1000000), // 300KB to 1MB
                    'uploadedAt' => $proposal->uploadedAt ?? Carbon::now()->subDays(rand(1, 30))
                ];
            }

            // Create the files
            foreach ($files as $fileData) {
                File::create($fileData);
            }

            $this->command->info("Created " . count($files) . " files for proposal: {$proposal->researchTitle}");
        }

        $this->command->info('Proposal file seeding completed successfully!');
    }
}
