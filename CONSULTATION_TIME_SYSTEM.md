# Consultation Time Calculation System

## Overview

This system calculates the average consultation time by measuring the time difference between appointment start time and completion time for both appointments and referrals with "completed" status.

## Formula

**Consultation Time = lastUpdated - (appointmentDate + appointmentTime)**

Where:
- `appointmentDate`: The date of the appointment (YYYY-MM-DD format)
- `appointmentTime`: The scheduled time of the appointment (HH:MM format)
- `lastUpdated`: The timestamp when the appointment/referral was marked as completed

## Implementation

### 1. Core Utility Functions (`lib/utils/consultation-time.ts`)

#### `calculateConsultationTime(appointmentDate, appointmentTime, lastUpdated)`
- Calculates the time difference between appointment start and completion
- Returns time in minutes
- Handles timezone issues by treating appointment times as local time
- Returns 0 for invalid or negative time differences

#### `calculateAverageConsultationTime(appointments, referrals)`
- Processes all completed appointments and referrals
- Calculates comprehensive statistics including:
  - Average consultation time
  - Total completed consultations
  - Shortest and longest consultation times
  - Average time by specialty

#### `formatConsultationTime(minutes)`
- Formats time for display (e.g., "45 min", "1h 30m")

### 2. Dashboard Integration

#### Main Stats Card
- Added "Avg Consultation Time" to the top stats grid
- Shows average time and number of completed consultations

#### Detailed Statistics Section
- New `ConsultationTimeStats` component displays:
  - Main average consultation time
  - Shortest and longest consultation times
  - Breakdown by specialty (top 5)
  - Total completed consultations analyzed

#### Consultation Efficiency Card
- Shows total completed consultations
- Displays shortest and longest consultation times

### 3. Data Service Integration

#### Real Data Service (`lib/services/real-data.service.ts`)
- Added `getConsultationTimeStats()` method
- Integrated consultation time calculation into `getDashboardStats()`
- Updated `DashboardStats` interface to include consultation time data

#### Custom Hooks
- `useConsultationTime()`: Calculates stats from appointment/referral arrays
- `useRealConsultationTime()`: Fetches stats from Firebase data

### 4. Sample Data

Updated sample appointment and referral data with realistic consultation times:
- Appointments: 20-70 minutes
- Referrals: 65-90 minutes
- All completed consultations have proper `lastUpdated` timestamps

## Usage

### In Components
```typescript
import { useConsultationTime } from '@/hooks/useConsultationTime';

const { consultationTimeStats } = useConsultationTime(appointments, referrals);
```

### In Services
```typescript
import { calculateAverageConsultationTime } from '@/lib/utils/consultation-time';

const stats = calculateAverageConsultationTime(appointments, referrals);
```

## Data Requirements

### Appointments
- Must have `status: 'completed'`
- Must have valid `appointmentDate`, `appointmentTime`, and `lastUpdated` fields
- `specialty` field is used for specialty breakdown

### Referrals
- Must have `status: 'completed'`
- Must have valid `appointmentDate`, `appointmentTime`, and `lastUpdated` fields

## Error Handling

- Invalid dates or times return 0 minutes
- Negative time differences (completion before start) return 0
- Missing or invalid data is gracefully handled
- Console errors are logged for debugging

## Future Enhancements

1. **Trend Analysis**: Compare current period vs previous period
2. **Specialty Filtering**: Filter by specific specialties
3. **Time Range Filtering**: Calculate stats for specific date ranges
4. **Doctor-specific Stats**: Average consultation time per doctor
5. **Clinic-specific Stats**: Average consultation time per clinic
6. **Export Functionality**: Export consultation time reports
7. **Real-time Updates**: Live updates when new consultations are completed

## Testing

The system has been tested with:
- Valid appointment and referral data
- Various consultation durations (20-120 minutes)
- Different specialties
- Edge cases (cancelled appointments, invalid dates)
- Timezone handling

## Performance Considerations

- Calculations are memoized using `useMemo` in hooks
- Only completed consultations are processed
- Efficient date/time calculations
- Minimal memory footprint for large datasets
