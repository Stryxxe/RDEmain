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
        // Notifications are now handled directly in EndorsementController
        // This event is kept for potential future listeners or logging purposes
    }
}
