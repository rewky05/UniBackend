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
 * @param dateString - The date string, Date object, or timestamp
 * @returns Formatted date string
 */
export function formatDateToText(dateString: string | Date | number): string {
  const date = safeCreateDate(dateString);
  
  if (!date) {
    // Try to provide a more helpful error message
    if (typeof dateString === 'string' && dateString.trim()) {
      return `Unable to parse date: "${dateString}"`;
    }
    return 'No date provided';
  }
  
  // For date-only strings (like birthdays), treat as local date, not UTC
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a date and time to text format (e.g., "May 6, 2025 at 2:30 PM")
 * @param dateString - The date string, Date object, or timestamp
 * @returns Formatted date and time string
 */
export function formatDateTimeToText(dateString: string | Date | number): string {
  const date = safeCreateDate(dateString);
  
  if (!date) {
    // Try to provide a more helpful error message
    if (typeof dateString === 'string' && dateString.trim()) {
      return `Unable to parse date: "${dateString}"`;
    }
    return 'No date provided';
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

/**
 * Safely get timestamp from a date value, handling undefined/null cases
 * @param dateValue - The date value (string, Date, number, or undefined/null)
 * @returns Timestamp in milliseconds, or 0 if invalid
 */
export function safeGetTimestamp(dateValue: string | Date | number | undefined | null): number {
  if (!dateValue) return 0;
  
  try {
    const date = safeCreateDate(dateValue);
    return date ? date.getTime() : 0;
  } catch (error) {
    console.warn('Invalid date value:', dateValue, error);
    return 0;
  }
}

/**
 * Safely create a Date object, handling undefined/null cases and multiple date formats
 * @param dateValue - The date value (string, Date, number, or undefined/null)
 * @returns Date object or null if invalid
 */
export function safeCreateDate(dateValue: string | Date | number | undefined | null): Date | null {
  if (!dateValue) return null;
  
  try {
    // If it's already a Date object, validate it
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }
    
    // If it's a number (timestamp), create Date directly
    if (typeof dateValue === 'number') {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // If it's a string, try multiple parsing strategies
    if (typeof dateValue === 'string') {
      const trimmedValue = dateValue.trim();
      if (!trimmedValue) return null;
      
      // Try direct Date constructor first
      let date = new Date(trimmedValue);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Try parsing common date formats
      const parsedDate = parseDateString(trimmedValue);
      if (parsedDate) {
        return parsedDate;
      }
      
      // Try ISO string format variations
      date = new Date(trimmedValue.replace(/[T\s]/g, ' '));
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Try timestamp as string
      const timestamp = parseInt(trimmedValue, 10);
      if (!isNaN(timestamp)) {
        date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Invalid date value:', dateValue, error);
    return null;
  }
}

/**
 * Parse various date string formats
 * @param dateString - The date string to parse
 * @returns Date object or null if parsing fails
 */
function parseDateString(dateString: string): Date | null {
  try {
    // Remove extra spaces and normalize
    const normalized = dateString.replace(/\s+/g, ' ').trim();
    
    // Common date patterns
    const patterns = [
      // MM/DD/YYYY or MM-DD-YYYY
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
      // YYYY/MM/DD or YYYY-MM-DD
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
      // DD/MM/YYYY or DD-MM-YYYY
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
      // MM/DD/YY or MM-DD-YY
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/,
      // DD/MM/YY or DD-MM-YY
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/,
      // Month name patterns
      /^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/,
      /^(\d{1,2})\s+(\w+)\s+(\d{4})$/,
      // ISO-like patterns without timezone
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/,
    ];
    
    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match) {
        const date = parseMatchedDate(match, pattern);
        if (date && !isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // Try natural language parsing for common formats
    const naturalDate = parseNaturalDate(normalized);
    if (naturalDate) {
      return naturalDate;
    }
    
    return null;
  } catch (error) {
    console.warn('Error parsing date string:', dateString, error);
    return null;
  }
}

/**
 * Parse date from regex match
 * @param match - Regex match result
 * @param pattern - The pattern that matched
 * @returns Date object or null
 */
function parseMatchedDate(match: RegExpMatchArray, pattern: RegExp): Date | null {
  try {
    const groups = match.slice(1);
    
    // Handle different pattern types
    if (pattern.source.includes('\\w+')) {
      // Month name pattern
      return parseMonthNameDate(groups);
    } else if (pattern.source.includes('T')) {
      // ISO-like pattern
      return parseISOLikeDate(groups);
    } else {
      // Numeric pattern
      return parseNumericDate(groups);
    }
  } catch (error) {
    console.warn('Error parsing matched date:', match, error);
    return null;
  }
}

/**
 * Parse numeric date patterns
 * @param groups - Regex groups
 * @returns Date object or null
 */
function parseNumericDate(groups: string[]): Date | null {
  const [first, second, third] = groups.map(g => parseInt(g, 10));
  
  // Determine format based on values
  if (first > 31) {
    // YYYY-MM-DD or YYYY/MM/DD
    return new Date(first, second - 1, third);
  } else if (third < 100) {
    // MM-DD-YY or DD-MM-YY
    const year = third < 50 ? 2000 + third : 1900 + third;
    return new Date(year, first - 1, second);
  } else {
    // MM-DD-YYYY or DD-MM-YYYY (assume MM-DD-YYYY for US format)
    return new Date(third, first - 1, second);
  }
}

/**
 * Parse month name date patterns
 * @param groups - Regex groups
 * @returns Date object or null
 */
function parseMonthNameDate(groups: string[]): Date | null {
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];
  
  const [first, second, third] = groups;
  let month: number;
  let day: number;
  let year: number;
  
  // Check if first group is month name
  const firstLower = first.toLowerCase();
  const monthIndex = monthNames.indexOf(firstLower);
  
  if (monthIndex !== -1) {
    // Month Day, Year format
    month = monthIndex % 12;
    day = parseInt(second, 10);
    year = parseInt(third, 10);
  } else {
    // Day Month Year format
    day = parseInt(first, 10);
    const secondLower = second.toLowerCase();
    const monthIndex2 = monthNames.indexOf(secondLower);
    if (monthIndex2 === -1) return null;
    month = monthIndex2 % 12;
    year = parseInt(third, 10);
  }
  
  return new Date(year, month, day);
}

/**
 * Parse ISO-like date patterns
 * @param groups - Regex groups
 * @returns Date object or null
 */
function parseISOLikeDate(groups: string[]): Date | null {
  const [year, month, day, hour = 0, minute = 0, second = 0] = groups.map(g => parseInt(g, 10));
  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Parse natural language date expressions
 * @param dateString - Date string to parse
 * @returns Date object or null
 */
function parseNaturalDate(dateString: string): Date | null {
  const lower = dateString.toLowerCase();
  const now = new Date();
  
  // Handle relative dates
  if (lower.includes('today')) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  
  if (lower.includes('yesterday')) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }
  
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  // Handle "X days ago" or "X days from now"
  const daysAgoMatch = lower.match(/(\d+)\s+days?\s+ago/);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date;
  }
  
  const daysFromNowMatch = lower.match(/(\d+)\s+days?\s+from\s+now/);
  if (daysFromNowMatch) {
    const days = parseInt(daysFromNowMatch[1], 10);
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date;
  }
  
  return null;
}

/**
 * Resolve address from either addressLine or separate address fields
 * @param data Object containing address information
 * @returns Formatted address string
 */
export function resolveAddress(data: {
  addressLine?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
}): string {
  // If addressLine exists, use it
  if (data.addressLine) {
    return data.addressLine;
  }
  
  // Otherwise, build address from separate fields
  const parts: string[] = [];
  
  if (data.address) {
    parts.push(data.address);
  }
  
  if (data.city) {
    parts.push(data.city);
  }
  
  if (data.province) {
    parts.push(data.province);
  }
  
  if (data.zipCode) {
    parts.push(data.zipCode);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
}

/**
 * Get individual address components
 * @param data Object containing address information
 * @returns Object with individual address components
 */
export function getAddressComponents(data: {
  addressLine?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
}): {
  address: string;
  city: string;
  province: string;
  zipCode: string;
  addressLine: string;
} {
  return {
    address: data.address || '',
    city: data.city || '',
    province: data.province || '',
    zipCode: data.zipCode || '',
    addressLine: data.addressLine || ''
  };
}

/**
 * Get just the street address (without city, province, zip)
 * @param data Object containing address information
 * @returns Street address string
 */
export function getStreetAddress(data: {
  addressLine?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
}): string {
  // If addressLine exists, try to extract just the street part
  if (data.addressLine) {
    // Split by comma and take the first part (usually the street address)
    const parts = data.addressLine.split(',');
    return parts[0]?.trim() || data.addressLine;
  }
  
  // Otherwise, return the address field
  return data.address || 'Address not available';
}

/**
 * Get location details (city, province, zip) without street address
 * @param data Object containing address information
 * @returns Location string
 */
export function getLocationDetails(data: {
  addressLine?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
}): string {
  // If we have separate fields, use them
  if (data.city || data.province || data.zipCode) {
    const parts: string[] = [];
    if (data.city) parts.push(data.city);
    if (data.province) parts.push(data.province);
    if (data.zipCode) parts.push(data.zipCode);
    return parts.join(', ');
  }
  
  // If we have addressLine, try to extract location part
  if (data.addressLine) {
    const parts = data.addressLine.split(',');
    if (parts.length > 1) {
      // Remove the first part (street address) and join the rest
      return parts.slice(1).join(',').trim();
    }
  }
  
  return 'Location not available';
}

/**
 * Resolve full address with country (Philippines)
 * @param data Object containing address information
 * @returns Formatted address string with country
 */
export function resolveFullAddress(data: {
  addressLine?: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
}): string {
  const baseAddress = resolveAddress(data);
  
  // If it's already a full address (contains Philippines), return as is
  if (baseAddress.toLowerCase().includes('philippines')) {
    return baseAddress;
  }
  
  // Otherwise, append Philippines
  return baseAddress !== 'Address not available' 
    ? `${baseAddress}, Philippines`
    : 'Address not available';
}
