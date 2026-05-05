# District Search Feature for Ground Station Location

## Overview
Added a comprehensive district search feature to the Ground Station Location modal in the ground station application. Users can now locate the ground station by searching for districts across all Indian states.

## Changes Made

### 1. **Database Addition - `INDIA_DISTRICTS`**
- Added a comprehensive database containing major districts from all 28 states and 8 union territories of India
- Each district entry includes:
  - District name
  - Geographic coordinates (latitude & longitude)
  - Organized by state for easy navigation

**Coverage includes:**
- Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh
- Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand
- Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur
- Meghalaya, Mizoram, Nagaland, Odisha, Punjab
- Rajasthan, Tamil Nadu, Telangana, Tripura, Uttar Pradesh
- Uttarakhand, West Bengal, Delhi

### 2. **Modal State Management**
Added two new state variables to `GSSettingsModal` component:
- `selectedState`: Tracks which state is currently selected
- `districtSearch`: Stores the search query for district filtering

### 3. **Search Logic**
Implemented filtering functions:
- **State filtering**: Lists states containing districts matching the search query
- **District filtering**: 
  - Shows districts within selected state if a state is chosen
  - Shows all matching districts across India if no state is selected
  - Case-insensitive search

### 4. **UI Components Added**
A new "Search by District" section in the modal featuring:

#### Search Input
- Text input field for searching districts
- Real-time filtering as user types
- Placeholder: "Search district..."

#### State Selector (Conditional)
- Appears only when district search is active
- Dropdown showing matching states
- Allows user to narrow down search to specific state

#### Back Button (Conditional)
- Appears when a state is selected
- Allows user to go back and select a different state
- Text: "← Back to States"

#### District Results Grid
- 2-column layout for compact display
- Scrollable area (max-height: 200px) for many results
- Each district button shows:
  - District name (bold)
  - Coordinates in format: "LAT°N, LON°E"
- Selected district is highlighted with blue gradient
- "No districts found" message when no matches

### 5. **Integration Features**
- **Auto-fill**: Clicking a district auto-fills:
  - Station Name with district name
  - Latitude field
  - Longitude field
- **Clear on select**: Search and state selection clear after picking a district
- **Styling**: Consistent with existing design (blue theme with 0066cc primary color)
- **Selection feedback**: Selected district shows blue border and gradient background

## User Workflow

1. Open Ground Station Location modal
2. Click "Search by District" section
3. Type a district name in search field (e.g., "Mumbai", "Bangalore")
4. (Optional) Select a state from dropdown to narrow results
5. Click desired district from results
6. District coordinates and name auto-populate
7. Click "Save Location" to save ground station location

## Technical Details

**File Modified:** `ground/src/pages/LiveRequests.jsx`

**Lines Modified:**
- Lines 23-150: Added `INDIA_DISTRICTS` database
- Lines 371-410: Updated `GSSettingsModal` component with new state and logic
- Lines 505-570: Added "Search by District" UI section

**Styling:**
- Matches existing blue theme (#0066cc)
- Uses RGBA transparency for backgrounds
- Responsive with grid layout
- Maintains accessibility with proper labels and spacing

**Performance:**
- Efficient filtering algorithms
- Scrollable districts list prevents layout overflow
- No external API calls (all data is local)

## Benefits

✅ Users can easily locate ground stations by district name
✅ Comprehensive coverage of entire India
✅ Intuitive search and filter workflow
✅ Quick access to coordinates without manual entry
✅ Consistent with existing UI design
✅ No additional dependencies required
