<?php

namespace App\Events;

use App\Models\Notification;
use App\Models\Proposal;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProposalStatusUpdated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Proposal $proposal,
        public User $user,
        public string $oldStatus,
        public string $newStatus
    ) {
        $statusMessages = [
            'under_review' => 'Your proposal is now under review.',
            'approved' => 'Congratulations! Your proposal has been approved.',
            'rejected' => 'Your proposal has been rejected.',
            'revision_required' => 'Your proposal requires revisions.',
        ];

        $notificationType = match($newStatus) {
            'approved' => 'success',
            'rejected' => 'error',
            default => 'info'
        };

        // Create notification in database
        Notification::create([
            'userID' => $user->userID,
            'type' => $notificationType,
            'title' => 'Proposal Status Updated',
            'message' => $statusMessages[$newStatus] ?? "Your proposal status has been updated to {$newStatus}.",
            'data' => [
                'proposal_id' => $proposal->proposalID,
                'proposal_title' => $proposal->title,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'event' => 'proposal.status.updated'
            ]
        ]);
    }
}
