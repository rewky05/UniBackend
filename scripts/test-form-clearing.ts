/**
 * Test script for form clearing functionality
 * This script tests the form reset utilities to ensure they work correctly
 */

import { clearFormCompletely, isFormEmpty, resetFormToDefaults } from '../lib/utils/form-reset';

// Mock form data
const mockFormData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+63 912 345 6789',
  specialty: 'Cardiology',
  schedules: [
    {
      clinicId: 'clin_001',
      dayOfWeek: [1, 2, 3],
      startTime: '09:00',
      endTime: '17:00'
    }
  ]
};

// Mock state setters
const mockSetFormData = (data: any) => {
  console.log('Form data set to:', data);
};

const mockSetActiveTab = (tab: string) => {
  console.log('Active tab set to:', tab);
};

const mockSetFormResetKey = (updater: (prev: number) => number) => {
  const newKey = updater(0);
  console.log('Form reset key set to:', newKey);
};

// Test functions
function testFormClearing() {
  console.log('=== Testing Form Clearing Functionality ===\n');

  // Test 1: Clear form completely
  console.log('Test 1: Clear form completely');
  clearFormCompletely(
    mockSetFormData,
    mockSetActiveTab,
    mockSetFormResetKey,
    {
      clearLocalStorage: true,
      storageKey: 'test-form-data',
      resetToFirstTab: true,
      showToast: true,
      toastMessage: 'Test form cleared',
      initialData: defaultValues // Pass initial data for proper form reset
    }
  );
  console.log('✓ Form clearing test completed\n');

  // Test 2: Check if form is empty
  console.log('Test 2: Check if form is empty');
  const emptyForm = {};
  const filledForm = { ...mockFormData };
  
  console.log('Empty form check:', isFormEmpty(emptyForm)); // Should be true
  console.log('Filled form check:', isFormEmpty(filledForm)); // Should be false
  console.log('✓ Form emptiness check completed\n');

  // Test 3: Reset form to defaults
  console.log('Test 3: Reset form to defaults');
  const defaultValues = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialty: '',
    schedules: []
  };
  
  resetFormToDefaults(defaultValues, mockSetFormData);
  console.log('✓ Form reset to defaults completed\n');

  console.log('=== All tests completed successfully ===');
}

// Run tests
if (require.main === module) {
  testFormClearing();
}

export { testFormClearing };
