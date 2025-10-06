<?php

namespace App\Events;

use App\Models\Notification;
use App\Models\Proposal;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProposalEndorsed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Proposal $proposal,
        public User $endorser
    ) {
        // Notify the proponent that their proposal has been endorsed
        Notification::create([
            'userID' => $proposal->userID,
            'type' => 'success',
            'title' => 'Proposal Endorsed',
            'message' => "Your proposal \"{$proposal->researchTitle}\" has been endorsed and forwarded to RDD.",
            'data' => [
                'proposal_id' => $proposal->proposalID,
                'proposal_title' => $proposal->researchTitle,
                'endorser_name' => $endorser->fullName,
                'event' => 'proposal.endorsed.proponent'
            ]
        ]);

        // Find RDD users and notify them
        $rddUsers = User::whereHas('role', function($query) {
            $query->where('userRole', 'RDD');
        })->get();

        foreach ($rddUsers as $rddUser) {
            Notification::create([
                'userID' => $rddUser->userID,
                'type' => 'info',
                'title' => 'Proposal Endorsed',
                'message' => "A proposal \"{$proposal->researchTitle}\" has been endorsed by {$endorser->fullName} and is ready for RDD review.",
                'data' => [
                    'proposal_id' => $proposal->proposalID,
                    'proposal_title' => $proposal->researchTitle,
                    'endorser_name' => $endorser->fullName,
                    'proponent_name' => $proposal->user->fullName,
                    'event' => 'proposal.endorsed.rdd'
                ]
            ]);
        }
    }
}
