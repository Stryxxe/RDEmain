# Dynamic Timeline Stages Implementation

## Overview
The timeline system has been made fully dynamic, allowing administrators to add, edit, reorder, and manage timeline stages through the admin panel. The changes automatically reflect across all user views with dynamic progress calculations.

## What Was Created

### 1. Database Layer
- **Migration**: `2025_12_04_000001_create_timeline_stages_table.php`
  - Creates `timeline_stages` table with fields:
    - `stageName`: Name of the stage
    - `stageDescription`: Description text
    - `orderIndex`: Order in timeline (1, 2, 3, etc.)
    - `statusID`: Optional link to proposal status
    - `isActive`: Enable/disable stage visibility
    - `color`: Color theme (blue, green, red, etc.)
  - Pre-populated with 11 default stages matching current implementation

- **Model**: `TimelineStage.php`
  - Eloquent model with relationships to Status
  - Scopes for `active()` and `ordered()`

### 2. Backend API
- **Controller**: `TimelineStageController.php`
  - `index()`: Admin page view with all stages
  - `getActiveStages()`: Public API endpoint for active stages (JSON)
  - `store()`: Create new stage
  - `update()`: Update existing stage
  - `updateOrder()`: Bulk reorder stages via drag-and-drop
  - `toggleActive()`: Enable/disable stage
  - `destroy()`: Delete stage

- **Routes**:
  - **API Routes** (`routes/api.php`):
    - `GET /api/timeline-stages/active` - Fetch active stages (all authenticated users)
    - `POST /api/timeline-stages/update-order` - Reorder stages (admin)
    - `POST /api/timeline-stages/{id}/toggle` - Toggle active status (admin)
  
  - **Web Routes** (`routes/web.php`):
    - `GET /admin/timeline-stages` - Admin management page
    - `POST /admin/timeline-stages` - Create stage
    - `PUT /admin/timeline-stages/{id}` - Update stage
    - `DELETE /admin/timeline-stages/{id}` - Delete stage

### 3. Frontend Components
- **Admin Page**: `resources/js/Pages/Admin/TimelineStages.jsx`
  - Full CRUD interface for managing stages
  - Drag-and-drop reordering with `react-beautiful-dnd`
  - Live status toggles
  - Color picker for stage themes
  - Status association
  - Real-time order updates

- **Hook**: `resources/js/hooks/useTimelineStages.js`
  - `useTimelineStages()`: React hook to fetch active stages from API
  - `calculateStageStatus()`: Determine stage status (completed/current/pending/rejected)
  - `getCompletionPercentage()`: Calculate dynamic progress percentage

## How to Use

### For Administrators:

1. **Access Timeline Management**:
   ```
   Navigate to: /admin/timeline-stages
   ```

2. **Add New Stage**:
   - Click "+ Add New Stage" button
   - Fill in stage name, description, order index
   - Select associated status (optional)
   - Choose color theme
   - Toggle active status
   - Click "Create Stage"

3. **Reorder Stages**:
   - Drag and drop stages in the desired order
   - Changes save automatically to backend

4. **Edit Stage**:
   - Click "Edit" button on any stage
   - Modify fields in modal
   - Click "Update Stage"

5. **Enable/Disable Stage**:
   - Click the "Active" / "Inactive" toggle button
   - Stage immediately shows/hides from user views

6. **Delete Stage**:
   - Click "Delete" button
   - Confirm deletion
   - Stage permanently removed

### For Developers:

#### Using Dynamic Timeline in Components:

```javascript
import { useTimelineStages, calculateStageStatus, getCompletionPercentage } from '@/hooks/useTimelineStages';

function MyComponent({ proposal }) {
    const { stages, loading, error } = useTimelineStages();

    if (loading) return <div>Loading timeline...</div>;
    if (error) return <div>Error loading timeline</div>;

    // Calculate progress
    const progressPercentage = getCompletionPercentage(proposal, stages);

    // Render stages dynamically
    return (
        <div>
            <h3>Progress: {progressPercentage}%</h3>
            {stages.map((stage) => {
                const status = calculateStageStatus(proposal, stage, stages);
                return (
                    <div key={stage.stageID} className={`stage-${status}`}>
                        <h4>{stage.stageName}</h4>
                        <p>{stage.stageDescription}</p>
                    </div>
                );
            })}
        </div>
    );
}
```

#### Updating TrackerDetail.jsx (Example):

Replace the hardcoded `getTimelineStages()` function with:

```javascript
import { useTimelineStages, calculateStageStatus, getCompletionPercentage } from '@/hooks/useTimelineStages';

// Inside component:
const { stages: dynamicStages, loading, error } = useTimelineStages();

// Calculate progress:
const completionPercentage = getCompletionPercentage(proposal, dynamicStages);

// Render timeline:
{dynamicStages.map((stage) => {
    const status = calculateStageStatus(proposal, stage, dynamicStages);
    // Render stage with dynamic status
})}
```

## Database Migration

To apply the changes to your database:

```bash
php artisan migrate
```

This will:
1. Create the `timeline_stages` table
2. Insert 11 default stages (matching current implementation)

## Features

### ✅ Dynamic Stage Management
- Add unlimited timeline stages
- Edit stage details anytime
- Reorder stages via drag-and-drop

### ✅ Flexible Configuration
- Associate stages with proposal statuses
- Set custom colors per stage
- Add descriptive text for each stage
- Enable/disable stages without deletion

### ✅ Automatic Progress Calculation
- Progress percentage updates based on active stages
- Completed stage count adjusts dynamically
- Works with status-based logic and endorsements

### ✅ Real-time Updates
- Changes in admin panel immediately affect all views
- No frontend code changes needed for new stages
- API-driven architecture ensures consistency

## Benefits

1. **No Code Changes**: Add/remove timeline stages without touching frontend code
2. **Scalable**: Supports any number of stages (not limited to 11)
3. **Flexible**: Reorder and customize stages based on institutional needs
4. **User-Friendly**: Admin interface with drag-and-drop and visual feedback
5. **Progress Tracking**: Automatic calculation of completion percentage
6. **Future-Proof**: Easy to extend with additional features

## Next Steps

1. Run migration: `php artisan migrate`
2. Access admin panel: `/admin/timeline-stages`
3. Test adding/editing/reordering stages
4. Update `TrackerDetail.jsx` to use `useTimelineStages` hook (optional)
5. Verify progress calculations update correctly

## Color Options

Available color themes:
- `gray`, `blue`, `green`, `red`, `yellow`, `purple`, `indigo`, `pink`, `orange`, `cyan`

These map to Tailwind CSS color classes for consistent styling.

## Status Associations

Stages can be associated with proposal statuses:
- **Draft** (ID: 1)
- **Submitted** (ID: 2)
- **Under Review** (ID: 3)
- **Ongoing** (ID: 4)
- **Approved** (ID: 5)
- **Rejected** (ID: 6)
- **Endorsed** (ID: 7)

This helps determine which stages are active based on proposal status.

## Notes

- The system maintains backward compatibility with existing proposals
- Default stages match the current hardcoded implementation
- Stage status calculation includes endorsement logic (CM and RDD)
- Inactive stages are hidden from user views but retained in database
- Order indices can have gaps (system sorts by `orderIndex` field)

## Support

For issues or questions about the dynamic timeline system, refer to:
- `app/Http/Controllers/TimelineStageController.php` - Backend logic
- `resources/js/hooks/useTimelineStages.js` - Frontend hook
- `resources/js/Pages/Admin/TimelineStages.jsx` - Admin interface
