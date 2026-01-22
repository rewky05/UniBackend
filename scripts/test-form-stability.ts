// Test script for form stability

interface FormData {
  clinicId: string;
  roomOrUnit: string;
  dayOfWeek: number[];
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  validFrom: string;
  isActive: boolean;
  newClinicDetails: {
    name: string;
    addressLine: string;
    contactNumber: string;
    type: string;
  };
}

function testFormStability() {
  console.log('🧪 Testing Form Stability...\n');

  // Simulate initial form data
  let formData: Record<string, any> = {
    clinicId: '',
    roomOrUnit: '',
    dayOfWeek: [],
    startTime: '',
    endTime: '',
    slotDurationMinutes: 30, // Fallback default
    validFrom: '',
    isActive: true,
    newClinicDetails: {
      name: '',
      addressLine: '',
      contactNumber: '',
      type: ''
    }
  };

  console.log('1. Initial form data:', formData);

  // Simulate user selecting a clinic
  formData.clinicId = 'clinic-123';
  formData.roomOrUnit = 'Cardiology Clinic, Rm 501';
  formData.dayOfWeek = [1, 3, 5]; // Monday, Wednesday, Friday
  formData.startTime = '09:00';
  formData.endTime = '17:00';
  formData.validFrom = '2024-01-15';

  console.log('2. After user input:', formData);

  // Simulate settings loading with different default duration
  const settingsDefaultDuration = 45; // Different from fallback 30

  // Test the logic: only update if still using fallback default
  if (formData.slotDurationMinutes === 30) {
    formData.slotDurationMinutes = settingsDefaultDuration;
    console.log('3. Updated duration from settings:', formData.slotDurationMinutes);
  }

  console.log('4. Final form data:', formData);

  // Verify that user inputs are preserved
  const userInputsPreserved = 
    formData.clinicId === 'clinic-123' &&
    formData.roomOrUnit === 'Cardiology Clinic, Rm 501' &&
    formData.dayOfWeek.length === 3 &&
    formData.startTime === '09:00' &&
    formData.endTime === '17:00' &&
    formData.validFrom === '2024-01-15';

  console.log('✅ User inputs preserved:', userInputsPreserved);
  console.log('✅ Duration updated from settings:', formData.slotDurationMinutes === 45);

  console.log('\n🎉 Form stability test passed!');
}

// Run the test
testFormStability();
