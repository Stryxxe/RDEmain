<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Proposal;
use App\Models\User;

class FixProposalOwnershipSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all proposals created by OP users (Office of President users should not create proposals)
        $opProposals = Proposal::whereIn('userID', User::where('userRolesID', 4)->pluck('userID'))->get();
        
        // Get all proposals created by CM users (College Managers should not create proposals)
        $cmProposals = Proposal::whereIn('userID', User::where('userRolesID', 2)->pluck('userID'))->get();
        
        // Get all proponent users to reassign proposals to
        $proponentUsers = User::where('userRolesID', 3)->get();
        
        if ($proponentUsers->isEmpty()) {
            $this->command->error('No proponent users found!');
            return;
        }
        
        $proponentIndex = 0;
        
        // Reassign OP proposals to proponent users
        foreach ($opProposals as $proposal) {
            $newOwner = $proponentUsers[$proponentIndex % $proponentUsers->count()];
            $proposal->update(['userID' => $newOwner->userID]);
            $this->command->info("Reassigned proposal '{$proposal->researchTitle}' from OP user to {$newOwner->fullName} (Proponent)");
            $proponentIndex++;
        }
        
        // Reassign CM proposals to proponent users
        foreach ($cmProposals as $proposal) {
            $newOwner = $proponentUsers[$proponentIndex % $proponentUsers->count()];
            $proposal->update(['userID' => $newOwner->userID]);
            $this->command->info("Reassigned proposal '{$proposal->researchTitle}' from CM user to {$newOwner->fullName} (Proponent)");
            $proponentIndex++;
        }
        
        $this->command->info('Proposal ownership fixed successfully.');
        $this->command->info("Reassigned {$opProposals->count()} OP proposals and {$cmProposals->count()} CM proposals to proponent users.");
    }
}
