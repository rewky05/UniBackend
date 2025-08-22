import { useState, useEffect, useCallback, useRef } from 'react';
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use refs to store stable references to avoid dependency issues
  const storageKeyRef = useRef(storageKey);
  const autoSaveRef = useRef(autoSave);
  const initialDataRef = useRef(initialData);

  // Update refs when options change
  useEffect(() => {
    storageKeyRef.current = storageKey;
    autoSaveRef.current = autoSave;
    initialDataRef.current = initialData;
  }, [storageKey, autoSave, initialData]);

  // Load form data from localStorage on mount
  useEffect(() => {
    if (!autoLoad) {
      setIsLoaded(true);
      return;
    }

    try {
      const savedData = localStorage.getItem(storageKeyRef.current);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormDataState(parsedData);
      }
    } catch (error) {
      console.error('Error loading form data from localStorage:', error);
      setFormDataState(initialDataRef.current);
    } finally {
      setIsLoaded(true);
    }
  }, [autoLoad]); // Only depend on autoLoad, use refs for other values

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Save form data to localStorage whenever it changes (debounced)
  const setFormData = useCallback((data: T | ((prev: T) => T)) => {
    setFormDataState(prevData => {
      const newData = typeof data === 'function' ? (data as (prev: T) => T)(prevData) : data;
      
      if (autoSaveRef.current) {
        // Clear existing timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        // Debounce the save operation
        saveTimeoutRef.current = setTimeout(() => {
          try {
            // Create a copy without File objects for localStorage serialization
            const serializableData = { ...newData } as Record<string, any>;
            
            // Remove File objects as they can't be serialized
            Object.keys(serializableData).forEach(key => {
              if (serializableData[key] instanceof File) {
                delete serializableData[key];
              }
            });
            
            localStorage.setItem(storageKeyRef.current, JSON.stringify(serializableData));
          } catch (error) {
            console.error('Error saving form data to localStorage:', error);
          }
        }, 500); // 500ms debounce
      }
      
      return newData;
    });
  }, []); // Empty dependency array - use refs for all external values

  // Clear form data completely
  const clearForm = useCallback(() => {
    setFormDataState(initialDataRef.current);
    
    try {
      localStorage.removeItem(storageKeyRef.current);
    } catch (error) {
      console.error('Error clearing form data from localStorage:', error);
    }
  }, []); // Empty dependency array - use refs for all external values

  return {
    formData,
    setFormData,
    clearForm,
    isLoaded
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