import { useState, useEffect, useCallback } from 'react';
import { clearFormCompletely as clearFormUtil } from '@/lib/utils/form-reset';

export interface UseFormPersistenceOptions {
  storageKey: string;
  initialData?: any;
  autoSave?: boolean;
  autoLoad?: boolean;
}

export interface UseFormPersistenceReturn<T> {
  formData: T;
  setFormData: (data: T | ((prev: T) => T)) => void;
  clearForm: () => void;
  isLoaded: boolean;
  hasUnsavedChanges: boolean;
}

/**
 * Custom hook for form persistence with automatic clearing functionality
 * @param options - Configuration options for form persistence
 * @returns Form data state and utility functions
 */
export function useFormPersistence<T>(
  options: UseFormPersistenceOptions
): UseFormPersistenceReturn<T> {
  const { storageKey, initialData = {} as T, autoSave = true, autoLoad = true } = options;
  
  const [formData, setFormDataState] = useState<T>(initialData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load form data from localStorage on mount
  useEffect(() => {
    if (!autoLoad) {
      setIsLoaded(true);
      return;
    }

    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormDataState(parsedData);
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error('Error loading form data from localStorage:', error);
      setFormDataState(initialData);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey, autoLoad, initialData]);

  // Save form data to localStorage whenever it changes
  const setFormData = useCallback((data: T | ((prev: T) => T)) => {
    setFormDataState(prevData => {
      const newData = typeof data === 'function' ? (data as (prev: T) => T)(prevData) : data;
      
      if (autoSave) {
        try {
          // Create a copy without File objects for localStorage serialization
          const serializableData = { ...newData } as Record<string, any>;
          
          // Remove File objects as they can't be serialized
          Object.keys(serializableData).forEach(key => {
            if (serializableData[key] instanceof File) {
              delete serializableData[key];
            }
          });
          
          localStorage.setItem(storageKey, JSON.stringify(serializableData));
          setHasUnsavedChanges(true);
        } catch (error) {
          console.error('Error saving form data to localStorage:', error);
        }
      }
      
      return newData;
    });
  }, [storageKey, autoSave]);

  // Clear form data completely
  const clearForm = useCallback(() => {
    setFormDataState(initialData);
    setHasUnsavedChanges(false);
    
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing form data from localStorage:', error);
    }
  }, [storageKey, initialData]);

  return {
    formData,
    setFormData,
    clearForm,
    isLoaded,
    hasUnsavedChanges
  };
}

/**
 * Enhanced form clearing function that works with the persistence hook
 * @param setFormData - The form data setter from useFormPersistence
 * @param clearForm - The clear function from useFormPersistence
 * @param options - Additional options for clearing
 */
export const clearFormWithPersistence = (
  setFormData: (data: any) => void,
  clearForm: () => void,
  options: {
    setActiveTab?: (tab: string) => void;
    setFormResetKey?: (updater: (prev: number) => number) => void;
    showToast?: boolean;
    toastMessage?: string;
  } = {}
) => {
  const { setActiveTab, setFormResetKey, showToast, toastMessage } = options;

  // Clear form data
  clearForm();

  // Reset to first tab if specified
  if (setActiveTab) {
    setActiveTab('personal');
  }

  // Force re-render of all form components by incrementing reset key
  if (setFormResetKey) {
    setFormResetKey(prev => prev + 1);
  }

  // Show toast if specified
  if (showToast) {
    console.log('Toast message:', toastMessage || 'Form cleared successfully');
  }
}; 