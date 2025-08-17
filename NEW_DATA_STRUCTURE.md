# 🔄 New Data Structure - Separation of Concerns

## Overview

We've restructured the data model to promote better separation of concerns by separating immutable user information from detailed profile information.

## 🏗️ New Structure

### Key Principle: ID-Based References
All relationships in the system now use Firebase unique push keys (IDs) instead of names:
- `patientId` - references patient in users/patients nodes
- `doctorId` - references doctor in users/doctors nodes  
- `clinicId` - references clinic in clinics node
- `userId` - references user in users node

This ensures data integrity, performance, and eliminates name-based inconsistencies.

### 1. Users Node (Immutable Fields Only)

**Patient User Structure:**
```json
{
  "-OX-aZfWI0hGEDtFyqLZ": {
    "createdAt": "2025-08-06T18:17:30.868Z",
    "email": "please.work@gmail.com",
    "firstName": "Please",
    "middleName": "Work",
    "lastName": "Haha",
    "patientId": "-OX-aZfWI0hGEDtFyqLZ",
    "role": "patient"
  }
}
```

**Doctor User Structure:**
```json
{
  "-OX-NB0dc0yg_A2o2wCD": {
    "createdAt": "2025-08-06T17:14:39.765Z",
    "doctorId": "-OX-NB0dc0yg_A2o2wCD",
    "email": "maria.senora@gmail.com",
    "firstName": "Maria",
    "middleName": "Bella",
    "lastName": "Senora",
    "role": "specialist"
  }
}
```

### 2. Patients Node (Detailed Information)

```json
{
  "pgney6p630UQ7C0IKh2UxBXbWJt2": {
    "contactNumber": "09159452600",
    "highestEducationalAttainment": "Bachelor's Degree",
    "createdAt": "2025-08-01T20:57:29.624Z",
    "dateOfBirth": "12/09/2003",
    "emergencyContact": {
      "name": "April Marie Rosales",
      "phone": "09159452600",
      "relationship": "Friend"
    },
    "firstName": "Gian Mathew",
    "gender": "Male",
    "middleName": "Sollano",
    "lastName": "Gutang",
    "lastUpdated": "2025-08-01T20:57:29.624Z",
    "userId": "pgney6p630UQ7C0IKh2UxBXbWJt2"
  }
}
```

### 3. Doctors Node (Detailed Information)

```json
{
  "-OX-GFmhUU5IXLjMnOlT": {
    "address": "Universe Milkyway",
    "civilStatus": "single",
    "clinicAffiliations": ["clin_perpetual_succour_id"],
    "contactNumber": "09159452699",
    "createdAt": "2025-08-06T16:44:24.699Z",
    "dateOfBirth": "2002-04-06",
    "email": "universe@gmail.com",
    "firstName": "Hello",
    "gender": "female",
    "isGeneralist": false,
    "isSpecialist": true,
    "lastLogin": "2025-08-06T16:44:24.699Z",
    "lastName": "World",
    "medicalLicenseNumber": "ML-120980293",
    "middleName": "Universe",
    "prcExpiryDate": "2030-04-01",
    "prcId": "PRC-380247",
    "professionalFee": 3300,
    "profileImageUrl": "",
    "specialty": "Neurology",
    "status": "pending",
    "userId": "-OX-GFmhUU5IXLjMnOlT"
  }
}
```

### 4. Specialist Schedules Node

```json
{
  "-OX-GFmhUU5IXLjMnOlT": {
    "sched_-OX-GFmhUU5IXLjMnOlT_1": {
      "createdAt": "2025-08-06T16:44:24.699Z",
      "isActive": true,
      "lastUpdated": "2025-08-06T16:44:24.699Z",
      "practiceLocation": {
        "clinicId": "clin_perpetual_succour_id",
        "roomOrUnit": "3rd Flr., Rm 590"
      },
      "recurrence": {
        "dayOfWeek": [0, 2, 4],
        "type": "weekly"
      },
      "scheduleType": "Weekly",
      "slotTemplate": {
        "09:00 AM": {
          "defaultStatus": "available",
          "durationMinutes": 30
        }
      },
      "specialistId": "-OX-GFmhUU5IXLjMnOlT",
      "validFrom": "2025-08-06"
    }
  }
}
```

## 🔧 Changes Made

### 1. Updated Type Definitions

**`lib/types/database.ts`:**
- Updated `User` interface to only include immutable fields
- Updated `Patient` interface to match new structure
- Updated `Doctor` interface to match new structure

**`lib/types/index.ts`:**
- Added new `User` interface
- Updated `Doctor` interface with new fields
- Updated `Patient` interface with new fields
- Updated `CreateDoctorDto` and `CreatePatientDto`

### 2. Updated Services

**`lib/services/real-data.service.ts`:**
- Updated `createPatient()` method to create separate user and patient entries
- Updated `createDoctor()` method to create separate user and doctor entries
- Updated specialist schedules creation to use new naming convention

### 3. Updated Validation

**`lib/validations/doctor.ts`:**
- Updated validation schema to match new structure
- Removed fields that are now in users node
- Made appropriate fields optional

### 4. Updated Components

**`app/patients/page.tsx`:**
- Updated data fetching to combine information from both users and patients nodes
- Updated field mappings to match new structure

## 🎯 Benefits

1. **Separation of Concerns**: Immutable user data is separate from mutable profile data
2. **Better Security**: Sensitive user information is isolated
3. **Easier Maintenance**: Clear distinction between user management and profile management
4. **Scalability**: Easier to add new user types or profile fields
5. **Data Integrity**: Reduced risk of accidentally modifying immutable fields
6. **ID-Based References**: All relationships use Firebase unique push keys instead of names
7. **Performance**: Faster queries and reduced data redundancy
8. **Consistency**: No risk of name mismatches or duplicates

## 🔄 Migration Notes

- Existing data may need to be migrated to the new structure
- Components that display user information need to fetch from both nodes
- Authentication and user management should primarily work with the users node
- Profile management should work with the respective profile nodes (patients/doctors)
- All references now use IDs instead of names (patientId, doctorId, clinicId)
- UI components need to resolve names by querying the respective nodes using IDs

## 📝 Usage Examples

### Creating a Patient
```typescript
const { patientId, temporaryPassword } = await realDataService.createPatient({
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "09123456789",
  dateOfBirth: "1990-01-01",
  gender: "Male",
  emergencyContact: {
    name: "Jane Doe",
    phone: "09123456788",
    relationship: "Spouse"
  }
});
```

### Creating a Doctor
```typescript
const { doctorId, temporaryPassword } = await realDataService.createDoctor({
  firstName: "Dr. Maria",
  lastName: "Santos",
  email: "maria.santos@example.com",
  phone: "09123456787",
  specialty: "Cardiology",
  prcId: "PRC-123456",
  professionalFee: 2500,
  schedules: [/* schedule data */]
});
```

### Fetching Combined Data
```typescript
// For patients page
const [users, patients] = await Promise.all([
  realDataService.getUsers(),
  realDataService.getPatients()
]);

const patientUsers = users.filter(user => user.role === 'patient');
const combinedPatients = patientUsers.map(user => {
  const patientData = patients.find(p => p.userId === user.id);
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    // ... combine other fields
  };
});
```

### Resolving Names from IDs
```typescript
// When displaying appointments, resolve names using IDs
const appointments = await realDataService.getAppointments();
const [users, patients, doctors, clinics] = await Promise.all([
  realDataService.getUsers(),
  realDataService.getPatients(),
  realDataService.getDoctors(),
  realDataService.getClinics()
]);

const appointmentsWithNames = appointments.map(appointment => {
  const patientUser = users.find(u => u.id === appointment.patientId);
  const patientData = patients.find(p => p.userId === appointment.patientId);
  const doctorData = doctors.find(d => d.userId === appointment.doctorId);
  const clinicData = clinics.find(c => c.id === appointment.clinicId);
  
  return {
    ...appointment,
    patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Unknown Patient',
    doctorName: doctorData ? `${doctorData.firstName} ${doctorData.lastName}` : 'Unknown Doctor',
    clinicName: clinicData ? clinicData.name : 'Unknown Clinic'
  };
});
```
