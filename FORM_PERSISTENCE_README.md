# Form Persistence System

This document explains how to use the form persistence system implemented in the UniHealth application.

## Overview

The form persistence system automatically saves form data to localStorage and restores it when the page reloads or network connection is lost. This ensures users don't lose their work when:

- The page accidentally refreshes
- Network connection is interrupted
- Browser crashes or is closed unexpectedly
- User navigates away and comes back

## Features

- **Automatic Saving**: Form data is saved automatically with configurable delay
- **User-Specific Storage**: Data is tied to the logged-in user's email
- **Data Expiration**: Saved data automatically expires after 24 hours
- **Manual Controls**: Users can manually save or clear data
- **Unsaved Changes Detection**: System tracks whether there are unsaved changes
- **Loading States**: Proper loading indicators while data is being restored
- **Page Unload Warnings**: Warns users about unsaved changes when leaving

## Implementation in Add Doctor Form

The Add Doctor form (`app/doctors/add/page.tsx`) now includes:

### 1. Form Persistence Hook

```typescript
const {
  data: formData,
  setData: setFormData,
  saveData,
  clearData,
  isLoaded,
  hasUnsavedChanges
} = useFormPersistence(initialFormData, {
  formKey: 'add-doctor-form',
  userId: user?.email,
  autoSave: true,
  autoSaveDelay: 1000,
  onDataLoaded: (data) => {
    console.log('Form data restored:', data);
  },
  onDataSaved: (data) => {
    console.log('Form data auto-saved');
  }
});
```

### 2. Loading State

```typescript
if (!isLoaded) {
  return (
    <DashboardLayout title="">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading saved form data...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### 3. Auto-Save Indicator

```typescript
{hasUnsavedChanges && (
  <Alert className="border-blue-200 bg-blue-50">
    <Save className="h-4 w-4" />
    <AlertDescription>
      Your changes are being automatically saved.
    </AlertDescription>
  </Alert>
)}
```

### 4. Manual Controls

```typescript
<div className="flex items-center space-x-2">
  <Button 
    variant="outline" 
    size="sm"
    onClick={() => saveData()}
    disabled={!hasUnsavedChanges}
  >
    <Save className="h-4 w-4 mr-2" />
    Save Now
  </Button>
  <Button 
    variant="outline" 
    size="sm"
    onClick={() => {
      if (confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
        clearData();
      }
    }}
  >
    Clear Form
  </Button>
</div>
```

### 5. Page Unload Warning

```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);
```

### 6. Clear Data After Successful Submission

```typescript
const confirmSubmit = async () => {
  // ... submit logic ...
  
  // Clear saved form data after successful submission
  clearData();
  
  // ... navigation ...
};
```

## How It Works

### 1. Data Storage

Form data is stored in localStorage with a user-specific key:
```
form_add-doctor-form_user@email.com
```

### 2. Data Structure

```typescript
{
  data: DoctorFormData,
  timestamp: number,
  userId: string
}
```

### 3. Auto-Save Process

1. User types in form fields
2. After 1 second delay, data is automatically saved
3. Blue indicator shows "Your changes are being automatically saved"
4. Data persists across page reloads

### 4. Data Restoration

1. Page loads
2. System checks for saved data with user's email
3. If found and not expired, data is restored
4. Loading spinner shows during restoration
5. Form is populated with saved data

### 5. Data Expiration

- Saved data expires after 24 hours
- Expired data is automatically cleared
- Users see fresh form after expiration

## Security Considerations

1. **Data Privacy**: Form data is stored in localStorage, which is accessible to the user
2. **User-Specific**: Data is tied to the user's email, preventing data leakage
3. **No Sensitive Data**: Only form fields are saved, not passwords or sensitive info
4. **Automatic Cleanup**: Data expires and is cleared automatically

## Usage in Other Forms

To add form persistence to other forms:

1. Import the hook:
```typescript
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useAuth } from '@/hooks/useAuth';
```

2. Replace useState with useFormPersistence:
```typescript
const { user } = useAuth();
const { data: formData, setData: setFormData, isLoaded } = useFormPersistence(
  initialData,
  {
    formKey: 'your-form-key',
    userId: user?.email,
    autoSave: true
  }
);
```

3. Add loading state:
```typescript
if (!isLoaded) {
  return <LoadingSpinner />;
}
```

4. Add auto-save indicator (optional):
```typescript
{hasUnsavedChanges && <AutoSaveIndicator />}
```

## Testing

To test the form persistence:

1. Navigate to `/doctors/add`
2. Fill in some form fields
3. Refresh the page - data should be restored
4. Close browser and reopen - data should still be there
5. Wait 24 hours - data should be cleared
6. Try different user accounts - data should be separate

## Troubleshooting

### Data Not Saving
- Check browser console for errors
- Ensure localStorage is available (not in incognito mode)
- Verify formKey is unique and valid

### Data Not Loading
- Check if data has expired (24 hours)
- Verify userId is correct
- Check browser console for errors

### Performance Issues
- Reduce autoSaveDelay for better responsiveness
- Use debouncing for large forms
- Consider using sessionStorage for temporary data

## Future Enhancements

1. **Cloud Backup**: Sync form data to Firebase for cross-device access
2. **Version History**: Keep multiple versions of saved data
3. **Collaborative Editing**: Allow multiple users to edit the same form
4. **Advanced Expiration**: Configurable expiration times per form
5. **Data Compression**: Compress large form data before storage 