# Backend Update Instructions for Proposal Editing

## Changes Needed in ProposalController.php

Replace the `update` method (lines 356-432) with the following:

```php
    public function update(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $user->loadMissing('role');

        // Find the proposal
        $proposal = Proposal::where('proposalID', $id)->firstOrFail();

        // Authorization: Allow proposal owner, CM (for their department), and RDD (for all)
        $canEdit = match ($user->role?->userRole) {
            'RDD' => true, // RDD can edit all proposals
            'CM' => $proposal->user?->departmentID === $user->departmentID, // CM can edit proposals from their department
            default => $proposal->userID === $user->userID, // Others can only edit their own
        };

        if (!$canEdit) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to edit this proposal'
            ], 403);
        }

        $validated = $request->validate([
            'researchTitle' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'objectives' => 'sometimes|string',
            'researchCenter' => 'sometimes|string',
            'researchAgenda' => 'sometimes|array',
            'dostSPs' => 'sometimes|array',
            'sustainableDevelopmentGoals' => 'sometimes|array',
            'proposedBudget' => 'sometimes|numeric|min:0',
            'budgetBreakdown' => 'sometimes|array',
            'updatedForm' => 'nullable|file|mimes:pdf,doc,docx|max:5120'
        ]);

        try {
            $updateData = $request->only([
                'researchTitle',
                'description',
                'objectives',
                'researchCenter',
                'researchAgenda',
                'dostSPs',
                'sustainableDevelopmentGoals',
                'proposedBudget'
            ]);

            // Handle file upload if provided
            if ($request->hasFile('updatedForm')) {
                $file = $request->file('updatedForm');
                $fileName = 'updated_form_' . time() . '.' . $file->getClientOriginalExtension();
                $filePath = $file->storeAs('proposals/' . $proposal->proposalID, $fileName, 'public');

                // Create file record
                File::create([
                    'proposalID' => $proposal->proposalID,
                    'fileName' => $fileName,
                    'filePath' => $filePath,
                    'fileType' => 'updated_form',
                    'fileSize' => $file->getSize(),
                ]);
            }

            $proposedBudget = isset($updateData['proposedBudget'])
                ? (float) $updateData['proposedBudget']
                : (float) $proposal->proposedBudget;

            if ($request->has('budgetBreakdown')) {
                $updateData['budgetBreakdown'] = $this->prepareBudgetBreakdown(
                    $request->input('budgetBreakdown'),
                    $proposedBudget
                );
            } elseif ($request->has('proposedBudget')) {
                $updateData['budgetBreakdown'] = $this->generateDefaultBudgetBreakdown($proposedBudget);
            }

            $proposal->update($updateData);
            $proposal->load(['status', 'files', 'user.department']);

            return response()->json([
                'success' => true,
                'message' => 'Proposal updated successfully',
                'data' => $proposal
            ]);
        } catch (\Exception $e) {
            Log::error('Proposal update failed', [
                'proposal_id' => $id,
                'user_id' => $user->userID,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update proposal',
                'error' => $e->getMessage()
            ], 500);
        }
    }
```

## Key Changes:

1. **Authorization**: Now checks if user is:
   - RDD (can edit all proposals)
   - CM (can edit proposals from their department)
   - Proponent (can edit own proposals only)

2. **Field Updates**: Added `researchAgenda`, `dostSPs`, `sustainableDevelopmentGoals`, `proposedBudget` to updateData

3. **File Upload**: Supports uploading updated forms (updatedForm field)

4. **Removed matrixOfCompliance logic**: These fields are now stored directly in the proposal table

5. **Better Error Logging**: Added detailed error logging for debugging
