# Settings System

## Overview

The settings system allows administrators to configure system-wide parameters that affect the entire UniHealth platform. Currently, it supports configuring default appointment duration settings.

## Database Structure

Settings are stored in Firebase Realtime Database under the `settings/general` node:

```json
{
  "settings": {
    "general": {
      "defaultAppointmentDuration": 30,
      "appointmentDurationUnit": "minutes",
      "lastUpdated": "2024-01-15T10:30:00Z",
      "updatedBy": "user-uid-here"
    }
  }
}
```

## Features

### Current Settings

1. **Default Appointment Duration**
   - Controls the default duration when creating new schedule blocks
   - Supports both minutes and hours
   - Range: 1-480 minutes or 1-8 hours
   - Default: 30 minutes

### Read-Only Settings (Display Only)

The following settings are displayed but not editable in the current implementation:
- System Name: "UniHealth Philippines"
- Default Timezone: "Asia/Manila (GMT+8)"
- Default Currency: "PHP (Philippine Peso)"
- Patient Feedback: Enabled

## Implementation

### Services

- **SettingsService** (`lib/services/settings.service.ts`)
  - Singleton service for managing settings
  - Caching for performance
  - Real-time updates via Firebase listeners
  - Activity logging for audit trail

### Hooks

- **useSettings** (`hooks/useSettings.ts`)
  - React hook for accessing settings throughout the app
  - Provides `getDefaultDurationMinutes()` helper function
  - Handles loading states and errors

### Components

- **GeneralSettings** (`components/settings/general-settings.tsx`)
  - Settings UI component
  - Only appointment duration fields are editable
  - Captures user UID for audit trail
  - Real-time validation and feedback

## Usage

### In Components

```typescript
import { useSettings } from '@/hooks/useSettings';

function MyComponent() {
  const { settings, loading, getDefaultDurationMinutes } = useSettings();
  
  if (loading) return <div>Loading...</div>;
  
  const defaultDuration = getDefaultDurationMinutes(); // Returns minutes
  // Use defaultDuration in your component
}
```

### In Services

```typescript
import { settingsService } from '@/lib/services/settings.service';

// Get settings
const settings = await settingsService.getSettings();

// Update settings
await settingsService.updateSettings({
  defaultAppointmentDuration: 45,
  appointmentDurationUnit: 'minutes'
}, userUid);
```

## Integration Points

### Schedule Creation

The default appointment duration is automatically used when:
- Creating new schedule blocks in `ClinicScheduleDialog`
- Resetting schedule forms
- Initializing new schedule data

### Activity Logging

All settings changes are logged with:
- Setting name
- Old and new values
- User who made the change
- Timestamp

## Security

- Only users with `superadmin` or `admin` roles can access settings
- All changes are logged for audit purposes
- Settings are cached for performance but updated in real-time

## Testing

Run the test script to verify functionality:

```bash
npx ts-node scripts/test-settings.ts
```

## Future Enhancements

The settings system is designed to be easily extensible. To add new settings:

1. Update the `SystemSettings` interface in `lib/types/database.ts`
2. Add UI components in `GeneralSettings`
3. Update the settings service if needed
4. Add validation and error handling

## Default Values

If settings don't exist in the database, the system uses these defaults:
- `defaultAppointmentDuration`: 30
- `appointmentDurationUnit`: "minutes"
