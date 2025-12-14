# RDD Analytics Backend Implementation

## Overview
This document describes the implementation of the RDD analytics endpoint that provides statistical data for the RDD Statistics dashboard.

## Endpoint Details

**URL:** `GET /api/proposals/rdd-analytics`

**Authentication:** Required (RDD role only)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalProposals": 25,
      "totalOngoing": 10,
      "totalCompleted": 15
    },
    "rdeAgenda": [
      {
        "name": "Agriculture, Aquatic, and Natural Resources",
        "ongoing": 3,
        "completed": 5,
        "total": 8
      }
      // ... more items
    ],
    "dost6Ps": [
      {
        "name": "Food Security",
        "value": 12
      }
      // ... more items
    ],
    "sdg": [
      {
        "name": "SDG 1",
        "value": 8
      }
      // ... more items
    ]
  }
}
```

## Implementation Details

### Database Schema
- **proposals table:**
  - `researchAgenda` (JSON array) - Contains selected RDE Agenda items
  - `dostSPs` (JSON array) - Contains selected DOST 6Ps items
  - `sustainableDevelopmentGoals` (JSON array) - Contains selected SDG items

- **endorsements table:**
  - `proposalID` (foreign key)
  - `endorserID` (foreign key)
  - `endorsementStatus` (string: 'pending', 'approved', etc.)

### Logic

1. **Authorization Check:**
   - Only users with RDD role can access this endpoint
   - Returns 403 Forbidden for unauthorized users

2. **Proposal Counting:**
   - **Total Proposals:** All proposals in the system
   - **Ongoing:** Proposals without an approved endorsement
   - **Completed:** Proposals with at least one approved endorsement

3. **Aggregation:**
   - Loops through all proposals and their related endorsements
   - For RDE Agenda: Counts ongoing and completed proposals for each agenda item
   - For DOST 6Ps: Counts total proposals for each 6P item
   - For SDG: Counts total proposals for each SDG item

4. **Data Structure:**
   - Handles JSON arrays stored in database
   - A single proposal can have multiple selections per category
   - Each selection increments the respective counter

### Code Location

**Controller:** `app/Http/Controllers/ProposalController.php`
- Method: `getRddAnalytics()`

**Route:** `routes/api.php`
- Route definition: `Route::get('/proposals/rdd-analytics', [ProposalController::class, 'getRddAnalytics']);`

**Frontend Service:** `resources/js/services/rddService.js`
- Method: `getRddAnalytics()`

## Frontend Integration

The RDD Statistics page (`resources/js/Pages/RoleViews/RDD/RDDStatistics.jsx`) calls this endpoint and:

1. Merges API data with fallback datasets to ensure complete visualization
2. Displays overview cards with total, ongoing, and completed proposal counts
3. Renders charts for:
   - RDE Agenda (with ongoing/completed breakdown)
   - DOST 6Ps (total counts)
   - SDG (total counts with visual cards)

## Testing

To test the endpoint:

1. Log in as an RDD user
2. Navigate to Statistics page
3. Check browser DevTools Network tab for API call to `/api/proposals/rdd-analytics`
4. Verify response data matches expected format
5. Confirm charts render with correct data

## Notes

- The frontend has fallback data that ensures charts always display, even with empty API responses
- Proposal status is determined by endorsement status, not the proposals.statusID field
- Multiple endorsements per proposal are supported; only one needs to be approved for "completed" status
- The aggregation respects the fact that proposals can have multiple selections per category
