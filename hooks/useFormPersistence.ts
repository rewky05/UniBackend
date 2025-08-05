import { useState, useEffect, useCallback, useRef } from 'react';
import { saveFormData, loadFormData, clearFormData } from '@/lib/utils';

interface UseFormPersistenceOptions<T> {
  formKey: string;
  userId?: string;
  maxAge?: number; // in milliseconds
  autoSave?: boolean;
  autoSaveDelay?: number; // in milliseconds
  onDataLoaded?: (data: T) => void;
  onDataSaved?: (data: T) => void;
}

/**
 * Custom hook for form data persistence
 * Automatically saves form data to localStorage and restores it on page reload
 */
export function useFormPersistence<T>(
  initialData: T,
  options: UseFormPersistenceOptions<T>
) {
  const {
    formKey,
    userId,
    maxAge = 24 * 60 * 60 * 1000, // 24 hours default
    autoSave = false, // Default to false to prevent interference
    autoSaveDelay = 3000, // Increased default delay
    onDataLoaded,
    onDataSaved
  } = options;

  const [data, setData] = useState<T>(initialData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<T>(initialData);

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadFormData<T>(formKey, userId, maxAge);
    if (savedData) {
      setData(savedData);
      lastDataRef.current = savedData;
      setIsLoaded(true);
      onDataLoaded?.(savedData);
    } else {
      setIsLoaded(true);
    }
  }, [formKey, userId, maxAge, onDataLoaded]);

  // Debounced auto-save functionality (only if enabled)
  useEffect(() => {
    if (!autoSave || !isLoaded) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Only save if data has actually changed
    const hasChanged = JSON.stringify(data) !== JSON.stringify(lastDataRef.current);
    
    if (hasChanged) {
      saveTimeoutRef.current = setTimeout(() => {
        saveFormData(formKey, data, userId);
        setLastSaved(Date.now());
        lastDataRef.current = data;
        onDataSaved?.(data);
      }, autoSaveDelay);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, formKey, userId, autoSave, autoSaveDelay, isLoaded, onDataSaved]);

  // Manual save function
  const saveData = useCallback((newData?: T) => {
    const dataToSave = newData || data;
    saveFormData(formKey, dataToSave, userId);
    setLastSaved(Date.now());
    lastDataRef.current = dataToSave;
    onDataSaved?.(dataToSave);
  }, [formKey, userId, data, onDataSaved]);

  // Manual clear function
  const clearData = useCallback(() => {
    clearFormData(formKey, userId);
    setData(initialData);
    lastDataRef.current = initialData;
    setLastSaved(null);
  }, [formKey, userId, initialData]);

  // Update data function with better handling
  const updateData = useCallback((newData: T | ((prev: T) => T)) => {
    setData(prev => {
      const updated = typeof newData === 'function' ? newData(prev) : newData;
      return updated;
    });
  }, []);

  return {
    data,
    setData: updateData,
    saveData,
    clearData,
    isLoaded,
    lastSaved,
    hasUnsavedChanges: lastSaved !== null
  };
}

/**
 * Hook for simple form field persistence
 * Useful for individual form fields that need to persist
 */
export function useFieldPersistence<T>(
  fieldKey: string,
  initialValue: T,
  userId?: string,
  maxAge: number = 24 * 60 * 60 * 1000
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved value on mount
  useEffect(() => {
    const savedValue = loadFormData<T>(fieldKey, userId, maxAge);
    if (savedValue !== null) {
      setValue(savedValue);
    }
    setIsLoaded(true);
  }, [fieldKey, userId, maxAge]);

  // Debounced save value when it changes
  useEffect(() => {
    if (isLoaded) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveFormData(fieldKey, value, userId);
      }, 1000); // Increased delay to 1 second

      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }
  }, [value, fieldKey, userId, isLoaded]);

  const clearValue = useCallback(() => {
    clearFormData(fieldKey, userId);
    setValue(initialValue);
  }, [fieldKey, userId, initialValue]);

  return {
    value,
    setValue,
    clearValue,
    isLoaded
  };
} 