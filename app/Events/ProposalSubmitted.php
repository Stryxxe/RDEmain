<?php

namespace App\Events;

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
        // Constructor only sets properties
    }
}
