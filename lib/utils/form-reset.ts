/**
 * Form Reset Utilities
 * 
 * This module provides utilities for properly clearing form data and internal component state
 * to ensure forms are completely reset without leaving any residual data.
 */

export interface FormResetOptions {
  clearLocalStorage?: boolean;
  storageKey?: string;
  resetToFirstTab?: boolean;
  showToast?: boolean;
  toastMessage?: string;
  initialData?: any; // Add initial data option
}

/**
 * Comprehensive form clearing function that handles all aspects of form reset
 * @param formData - The form data state setter
 * @param setActiveTab - Optional tab state setter
 * @param setFormResetKey - Optional reset key setter for forcing re-renders
 * @param options - Configuration options for the reset
 */
export const clearFormCompletely = (
  formData: any,
  setActiveTab?: (tab: string) => void,
  setFormResetKey?: (updater: (prev: number) => number) => void,
  options: FormResetOptions = {}
) => {
  const {
    clearLocalStorage = true,
    storageKey,
    resetToFirstTab = true,
    showToast = false,
    toastMessage = "Form cleared successfully",
    initialData = {} // Default to empty object if no initial data provided
  } = options;

  // Clear form data by resetting to initial data
  formData(initialData);

  // Clear localStorage if specified
  if (clearLocalStorage && storageKey) {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  // Reset to first tab if specified
  if (resetToFirstTab && setActiveTab) {
    setActiveTab('personal');
  }

  // Force re-render of all form components by incrementing reset key
  if (setFormResetKey) {
    setFormResetKey(prev => prev + 1);
  }

  // Show toast if specified
  if (showToast) {
    // Note: This would need to be handled by the calling component
    // as we don't have access to the toast function here
    console.log('Toast message:', toastMessage);
  }
};

/**
 * Check if form data is empty
 * @param data - The form data object
 * @returns boolean indicating if the form is empty
 */
export const isFormEmpty = (data: any): boolean => {
  if (!data) return true;
  
  // Check if all top-level properties are empty
  return Object.keys(data).every(key => {
    const value = data[key];
    
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (typeof value === 'number') return value === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    
    return false;
  });
};

/**
 * Reset form to initial state with default values
 * @param defaultValues - The default values to reset to
 * @param formData - The form data state setter
 */
export const resetFormToDefaults = (
  defaultValues: any,
  formData: (data: any) => void
) => {
  formData(defaultValues);
};
