<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Status;

class StatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [
            [
                'statusName' => 'Under Review',
                'statusDescription' => 'Proposal is currently being reviewed by the committee'
            ],
            [
                'statusName' => 'Approved',
                'statusDescription' => 'Proposal has been approved and can proceed'
            ],
            [
                'statusName' => 'Rejected',
                'statusDescription' => 'Proposal has been rejected and needs revision'
            ],
            [
                'statusName' => 'Ongoing',
                'statusDescription' => 'Proposal is approved and research is in progress'
            ],
            [
                'statusName' => 'Completed',
                'statusDescription' => 'Research project has been completed'
            ]
        ];

        foreach ($statuses as $index => $status) {
            Status::updateOrCreate(
                ['statusID' => $index + 1],
                $status
            );
        }
    }
}
