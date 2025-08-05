import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Philippine peso with proper formatting
 * @param amount - The amount in pesos
 * @returns Formatted string like "₱2,500.00"
 */
export function formatPhilippinePeso(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) {
    return 'Not specified';
  }
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

/**
 * Format a date string to text format (e.g., "May 6, 2025")
 * @param dateString - The date string or Date object
 * @returns Formatted date string
 */
export function formatDateToText(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a date and time to text format (e.g., "May 6, 2025 at 2:30 PM")
 * @param dateString - The date string or Date object
 * @returns Formatted date and time string
 */
export function formatDateTimeToText(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Form persistence utilities for saving and restoring form data
 */

/**
 * Save form data to localStorage with user-specific key
 * @param formKey - Unique identifier for the form
 * @param data - Form data to save
 * @param userId - Current user ID (optional, for user-specific storage)
 */
export function saveFormData<T>(formKey: string, data: T, userId?: string): void {
  try {
    const storageKey = userId ? `form_${formKey}_${userId}` : `form_${formKey}`;
    const timestamp = Date.now();
    const formData = {
      data,
      timestamp,
      userId: userId || 'anonymous'
    };
    
    localStorage.setItem(storageKey, JSON.stringify(formData));
  } catch (error) {
    console.error('Error saving form data:', error);
  }
}

/**
 * Load form data from localStorage
 * @param formKey - Unique identifier for the form
 * @param userId - Current user ID (optional, for user-specific storage)
 * @param maxAge - Maximum age of saved data in milliseconds (default: 24 hours)
 * @returns Saved form data or null if not found/expired
 */
export function loadFormData<T>(formKey: string, userId?: string, maxAge: number = 24 * 60 * 60 * 1000): T | null {
  try {
    const storageKey = userId ? `form_${formKey}_${userId}` : `form_${formKey}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (!savedData) {
      return null;
    }
    
    const parsedData = JSON.parse(savedData);
    const now = Date.now();
    
    // Check if data is expired
    if (now - parsedData.timestamp > maxAge) {
      localStorage.removeItem(storageKey);
      return null;
    }
    
    return parsedData.data;
  } catch (error) {
    console.error('Error loading form data:', error);
    return null;
  }
}

/**
 * Clear saved form data
 * @param formKey - Unique identifier for the form
 * @param userId - Current user ID (optional, for user-specific storage)
 */
export function clearFormData(formKey: string, userId?: string): void {
  try {
    const storageKey = userId ? `form_${formKey}_${userId}` : `form_${formKey}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Error clearing form data:', error);
  }
}

/**
 * Get all saved form keys for a user
 * @param userId - Current user ID
 * @returns Array of form keys
 */
export function getSavedFormKeys(userId?: string): string[] {
  try {
    const keys: string[] = [];
    const prefix = userId ? `form_${userId}` : 'form_';
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    
    return keys;
  } catch (error) {
    console.error('Error getting saved form keys:', error);
    return [];
  }
}

/**
 * Clear all saved form data for a user
 * @param userId - Current user ID
 */
export function clearAllFormData(userId?: string): void {
  try {
    const keys = getSavedFormKeys(userId);
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing all form data:', error);
  }
}
