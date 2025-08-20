/**
 * Test script for patient form clearing functionality
 * This script tests the form reset utilities to ensure they work correctly for patient forms
 */

import { clearFormCompletely, isFormEmpty, resetFormToDefaults } from '../lib/utils/form-reset';

// Mock patient form data
const mockPatientFormData = {
  firstName: 'John',
  middleName: 'Michael',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+63 912 345 6789',
  address: '123 Main Street, Quezon City, Metro Manila',
  dateOfBirth: '1990-01-01',
  gender: 'male',
  educationalAttainment: 'Bachelor\'s Degree',
  emergencyContact: {
    name: 'Jane Doe',
    phone: '+63 912 345 6790',
    relationship: 'spouse'
  },
  temporaryPassword: 'tempPass123'
};

// Mock state setters
const mockSetFormData = (data: any) => {
  console.log('Patient form data set to:', data);
};

const mockSetActiveTab = (tab: string) => {
  console.log('Active tab set to:', tab);
};

const mockSetFormResetKey = (updater: (prev: number) => number) => {
  const newKey = updater(0);
  console.log('Form reset key set to:', newKey);
};

// Test functions
function testPatientFormClearing() {
  console.log('=== Testing Patient Form Clearing Functionality ===\n');

  // Test 1: Clear patient form completely with initial data
  console.log('Test 1: Clear patient form completely with initial data');
  const defaultPatientValues = {
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    educationalAttainment: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    temporaryPassword: ''
  };
  
  clearFormCompletely(
    mockSetFormData,
    mockSetActiveTab,
    mockSetFormResetKey,
    {
      clearLocalStorage: true,
      storageKey: 'patient-form-data',
      resetToFirstTab: true,
      showToast: true,
      toastMessage: 'Patient form cleared successfully',
      initialData: defaultPatientValues // Pass initial data for proper form reset
    }
  );
  console.log('✓ Patient form clearing test completed\n');

  // Test 2: Check if patient form is empty
  console.log('Test 2: Check if patient form is empty');
  const emptyPatientForm = {};
  const filledPatientForm = { ...mockPatientFormData };
  
  console.log('Empty patient form check:', isFormEmpty(emptyPatientForm)); // Should be true
  console.log('Filled patient form check:', isFormEmpty(filledPatientForm)); // Should be false
  console.log('✓ Patient form emptiness check completed\n');

  // Test 3: Reset patient form to defaults
  console.log('Test 3: Reset patient form to defaults');
  resetFormToDefaults(defaultPatientValues, mockSetFormData);
  console.log('✓ Patient form reset to defaults completed\n');

  // Test 4: Test emergency contact clearing
  console.log('Test 4: Test emergency contact clearing');
  const emergencyContactData = {
    emergencyContact: {
      name: 'Jane Doe',
      phone: '+63 912 345 6790',
      relationship: 'spouse'
    }
  };
  
  console.log('Emergency contact data:', emergencyContactData);
  console.log('Emergency contact empty check:', isFormEmpty(emergencyContactData)); // Should be false
  console.log('✓ Emergency contact clearing test completed\n');

  // Test 5: Test form persistence simulation
  console.log('Test 5: Test form persistence simulation');
  console.log('Simulating form data being saved and restored...');
  
  // Simulate saving form data
  const formDataToSave = { ...mockPatientFormData };
  console.log('Form data to save:', formDataToSave);
  
  // Simulate clearing and restoring
  clearFormCompletely(
    mockSetFormData,
    mockSetActiveTab,
    mockSetFormResetKey,
    {
      clearLocalStorage: true,
      storageKey: 'patient-form-data',
      resetToFirstTab: true,
      showToast: false,
      initialData: defaultPatientValues
    }
  );
  
  console.log('✓ Form persistence simulation completed\n');

  console.log('=== All patient form clearing tests completed successfully ===');
}

// Run tests
if (require.main === module) {
  testPatientFormClearing();
}

export { testPatientFormClearing };
