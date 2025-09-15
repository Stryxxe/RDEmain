<?php

namespace App\Events;

use App\Models\Notification;
use App\Models\Proposal;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProposalSubmitted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Proposal $proposal,
        public User $user
    ) {
        // Create notification in database
        Notification::create([
            'userID' => $user->userID,
            'type' => 'success',
            'title' => 'Proposal Submitted Successfully',
            'message' => "Your proposal \"{$proposal->title}\" has been submitted for review.",
            'data' => [
                'proposal_id' => $proposal->proposalID,
                'proposal_title' => $proposal->title,
                'event' => 'proposal.submitted'
            ]
        ]);
    }
}
