# Complete Backend Integration Guide for Proposal Editing

## Files Modified/Created

### 1. Backend Controller Update

**File:** `app/Http/Controllers/ProposalController.php`

Replace the `update` method (starting at line 356) with:

```php
public function update(Request $request, int $id): JsonResponse
{
    $user = Auth::user();
    $user->loadMissing('role');

    // Find the proposal
    $proposal = Proposal::where('proposalID', $id)->with('user')->firstOrFail();

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
        $updateData = [];
        
        // Only include fields that were sent
        if ($request->has('researchTitle')) $updateData['researchTitle'] = $request->researchTitle;
        if ($request->has('description')) $updateData['description'] = $request->description;
        if ($request->has('objectives')) $updateData['objectives'] = $request->objectives;
        if ($request->has('researchCenter')) $updateData['researchCenter'] = $request->researchCenter;
        if ($request->has('researchAgenda')) $updateData['researchAgenda'] = $request->researchAgenda;
        if ($request->has('dostSPs')) $updateData['dostSPs'] = $request->dostSPs;
        if ($request->has('sustainableDevelopmentGoals')) $updateData['sustainableDevelopmentGoals'] = $request->sustainableDevelopmentGoals;
        if ($request->has('proposedBudget')) $updateData['proposedBudget'] = $request->proposedBudget;

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

### 2. Frontend Service Layer

**File:** `resources/js/services/proposalService.js` (Already created)

This file provides the `updateProposal` function to call the API.

### 3. CM View Integration

**File:** `resources/js/Pages/RoleViews/CM/CMProposalDetails.jsx`

Add import at the top:
```javascript
import { updateProposal } from '../../../services/proposalService';
```

Replace the onSave handler (around line 407-415) with:

```javascript
const handleSaveProposal = async (formData) => {
  try {
    // Show loading state
    setIsEndorsing(true);
    
    // Prepare data for API
    const updateData = {
      researchAgenda: formData.researchAgenda || [],
      dostSPs: formData.dostSPs || [],
      sustainableDevelopmentGoals: formData.sustainableDevelopmentGoals || [],
      proposedBudget: formData.proposedBudget || fullProposal?.proposedBudget || 0,
    };
    
    // Add file if present
    if (formData.updatedForm) {
      updateData.updatedForm = formData.updatedForm;
    }
    
    console.log('Saving proposal with data:', updateData);
    
    // Call API
    const response = await updateProposal(fullProposal.proposalID || fullProposal.id, updateData);
    
    if (response.success) {
      // Update local state with new data
      setFullProposal(response.data);
      
      // Show success message
      alert('Proposal updated successfully!');
      
      // Close edit view
      setShowEditProposal(false);
      
      // Refresh data
      handleRefresh();
    } else {
      throw new Error(response.message || 'Failed to update proposal');
    }
  } catch (error) {
    console.error('Error saving proposal:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to save proposal';
    alert(`Error: ${errorMessage}`);
  } finally {
    setIsEndorsing(false);
  }
};

// Show edit proposal page if edit is clicked
if (showEditProposal) {
  return (
    <CMEditProposal 
      proposal={fullProposal || proposal}
      onBack={() => setShowEditProposal(false)}
      onSave={handleSaveProposal}
    />
  );
}
```

### 4. RDD View Integration

**File:** `resources/js/Pages/RoleViews/RDD/RDDProposalDetail.jsx`

Add import at the top:
```javascript
import { updateProposal } from '../../../services/proposalService';
```

Replace the onSave handler (around line 407-416) with:

```javascript
const handleSaveProposal = async (formData) => {
  try {
    // Show loading state
    setIsEndorsing(true);
    
    // Prepare data for API
    const updateData = {
      researchAgenda: formData.researchAgenda || [],
      dostSPs: formData.dostSPs || [],
      sustainableDevelopmentGoals: formData.sustainableDevelopmentGoals || [],
      proposedBudget: formData.proposedBudget || proposal?.proposedBudget || 0,
    };
    
    // Add file if present
    if (formData.updatedForm) {
      updateData.updatedForm = formData.updatedForm;
    }
    
    console.log('Saving proposal with data:', updateData);
    
    // Call API
    const response = await updateProposal(proposal.proposalID || proposal.id, updateData);
    
    if (response.success) {
      // Update local state with new data
      setProposal(response.data);
      
      // Show success message
      alert('Proposal updated successfully!');
      
      // Close edit view
      setShowEditProposal(false);
      
      // Refresh data
      setRefreshKey(prev => prev + 1);
    } else {
      throw new Error(response.message || 'Failed to update proposal');
    }
  } catch (error) {
    console.error('Error saving proposal:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to save proposal';
    alert(`Error: ${errorMessage}`);
  } finally {
    setIsEndorsing(false);
  }
};

// Show edit proposal page if edit is clicked
if (showEditProposal) {
  return (
    <RDDEditProposal 
      proposal={proposal}
      onBack={() => setShowEditProposal(false)}
      onSave={handleSaveProposal}
    />
  );
}
```

## Testing Steps

1. **Backend Test:**
   ```bash
   # Test the API endpoint
   curl -X PUT http://localhost:8000/api/proposals/1 \
     -H "Content-Type: application/json" \
     -H "Accept: application/json" \
     -d '{"researchAgenda":["Agriculture"],"proposedBudget":50000}'
   ```

2. **Frontend Test:**
   - Login as CM user
   - Navigate to a proposal from your department
   - Click "Edit Proposal"
   - Modify research agenda, DOST SPs, SDGs, or budget
   - Click "Save Changes"
   - Verify data is saved and reflected

3. **RDD Test:**
   - Login as RDD user
   - Navigate to any proposal
   - Click "Edit Proposal"
   - Modify fields
   - Click "Save Changes"
   - Verify changes are saved

## Features Implemented

✅ CM can edit proposals from their department
✅ RDD can edit all proposals
✅ Proponent can edit their own proposals
✅ Research Agenda editing
✅ DOST Strategic Programs editing
✅ Sustainable Development Goals editing
✅ Budget editing
✅ File upload support for updated forms
✅ Proper authorization checks
✅ Error handling and logging
✅ Success/failure notifications
