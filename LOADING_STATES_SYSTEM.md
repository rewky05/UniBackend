# Loading States System

This document describes the comprehensive loading state system implemented to improve user experience throughout the UniHealth Admin Portal.

## Overview

The loading states system provides visual feedback for all user interactions including:
- Navigation between pages
- Form submissions
- Data fetching operations
- Button clicks and actions

## Components

### 1. LoadingButton (`components/ui/loading-button.tsx`)

A specialized button component that shows loading states during actions.

```tsx
import { LoadingButton, SubmitButton, SaveButton, DeleteButton } from '@/components/ui/loading-button';

// Basic usage
<LoadingButton loading={isLoading} loadingText="Processing...">
  Click Me
</LoadingButton>

// Specialized buttons
<SubmitButton loading={isSubmitting}>Submit</SubmitButton>
<SaveButton loading={isSaving}>Save Changes</SaveButton>
<DeleteButton loading={isDeleting}>Delete Item</DeleteButton>
```

### 2. LoadingLink (`components/ui/loading-link.tsx`)

A link component that shows loading states during navigation.

```tsx
import { LoadingLink } from '@/components/ui/loading-link';

<LoadingLink 
  href="/dashboard" 
  loading={isNavigating} 
  loadingText="Navigating..."
>
  Go to Dashboard
</LoadingLink>
```

### 3. Modern Loading Overlay (`components/ui/modern-loading-overlay.tsx`)

A modern glassmorphism loading overlay with beautiful visual effects.

```tsx
import { ModernLoadingOverlay, CompactModernLoading } from '@/components/ui/modern-loading-overlay';

// Full overlay with glassmorphism card
<ModernLoadingOverlay isLoading={true} message="Loading..." />

// Compact overlay for smaller operations
<CompactModernLoading isLoading={true} message="Processing..." />
```

### 4. Global Loading Overlay (`components/ui/global-loading-overlay.tsx`)

A global loading overlay that appears for major operations.

```tsx
import { GlobalLoadingOverlay } from '@/components/ui/global-loading-overlay';

// Automatically included in the root layout
<GlobalLoadingOverlay />
```

## Hooks

### 1. useGlobalLoading (`hooks/useGlobalLoading.tsx`)

Manages global loading states across the application.

```tsx
import { useGlobalLoading } from '@/hooks/useGlobalLoading';

const { isLoading, loadingMessage, showLoading, hideLoading } = useGlobalLoading();

// Show loading with custom message
showLoading('Processing your request...');

// Hide loading
hideLoading();
```

### 2. usePageTransition (`hooks/usePageTransition.tsx`)

Handles page transitions with loading states.

```tsx
import { usePageTransition } from '@/hooks/usePageTransition';

const { isTransitioning, navigateWithTransition } = usePageTransition({
  loadingMessage: 'Navigating...',
  delay: 500
});

// Navigate with loading
navigateWithTransition('/dashboard');
```

### 3. useFormSubmission (`hooks/useFormSubmission.tsx`)

Manages form submission loading states.

```tsx
import { useFormSubmission } from '@/hooks/useFormSubmission';

const { isSubmitting, submitForm, submitError, submitSuccess } = useFormSubmission({
  loadingMessage: 'Submitting...',
  successMessage: 'Success!',
  errorMessage: 'An error occurred'
});

// Submit form with loading
await submitForm(async () => {
  await api.submitData(formData);
});
```

### 4. useLinkLoading (`components/ui/loading-link.tsx`)

Manages loading states for individual links.

```tsx
import { useLinkLoading } from '@/components/ui/loading-link';

const { setLinkLoading, isLinkLoading } = useLinkLoading();

// Set loading state for a specific link
setLinkLoading('/dashboard', true);
```

## Implementation Examples

### Navigation Loading

The sidebar navigation automatically shows loading states when navigating between pages:

```tsx
// In sidebar.tsx
const { isLinkLoading } = useLinkLoading();

{navigationItems.map((item) => {
  const isLoading = isLinkLoading(item.href);
  return (
    <Link href={item.href}>
      {isLoading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <item.icon />
      )}
      {item.title}
    </Link>
  );
})}
```

### Form Submission Loading

Forms use the loading button and form submission hook:

```tsx
const { isSubmitting, submitForm } = useFormSubmission({
  loadingMessage: 'Saving...',
  successMessage: 'Saved successfully!'
});

const handleSubmit = async (formData) => {
  await submitForm(async () => {
    await api.saveData(formData);
  });
};

return (
  <form onSubmit={handleSubmit}>
    <LoadingButton 
      type="submit" 
      loading={isSubmitting}
      loadingText="Saving..."
    >
      Save
    </LoadingButton>
  </form>
);
```

### Global Loading States

For major operations that affect the entire application:

```tsx
const { showLoading, hideLoading } = useGlobalLoading();

const handleMajorOperation = async () => {
  showLoading('Processing major operation...');
  try {
    await performOperation();
  } finally {
    hideLoading();
  }
};
```

## Features

### 1. Automatic Loading States
- Navigation between pages shows loading indicators
- Form submissions display loading states
- Button clicks provide immediate feedback

### 2. Customizable Messages
- Each loading state can have custom messages
- Different messages for different types of operations
- Contextual feedback for users

### 3. Global and Local Loading
- Global loading overlay for major operations
- Local loading states for specific components
- Granular control over loading behavior

### 4. Error Handling
- Loading states automatically reset on errors
- Error messages are displayed appropriately
- Graceful fallbacks for failed operations

### 5. Accessibility
- Loading states are accessible to screen readers
- Proper ARIA labels and states
- Keyboard navigation support

## Best Practices

### 1. Use Appropriate Loading States
- Use global loading for major operations
- Use local loading for specific components
- Use button loading for immediate actions

### 2. Provide Clear Feedback
- Use descriptive loading messages
- Show progress when possible
- Indicate what's happening

### 3. Handle Errors Gracefully
- Reset loading states on errors
- Show appropriate error messages
- Provide retry options when possible

### 4. Optimize Performance
- Use loading states to prevent multiple submissions
- Debounce rapid actions
- Cancel operations when appropriate

## Testing

The test page (`/test`) includes examples of all loading states:

- Navigation loading with transitions
- Form submission loading
- Global loading overlay
- Button loading states

Visit `/test` to see all loading states in action.

## Integration

The loading system is automatically integrated into:

- Root layout with global loading provider
- Dashboard layout with page transition handling
- Sidebar navigation with link loading states
- All form components with submission loading
- Button components with action loading

No additional setup is required - the loading states work out of the box throughout the application.
