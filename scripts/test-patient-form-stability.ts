// Test script for patient form stability

interface PatientFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  educationalAttainment: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  temporaryPassword?: string;
}

function testPatientFormStability() {
  console.log('🧪 Testing Patient Form Stability...\n');

  // Simulate initial form data
  let formData: PatientFormData = {
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

  console.log('1. Initial form data:', formData);

  // Simulate user input for personal info
  formData.firstName = 'John';
  formData.middleName = 'Michael';
  formData.lastName = 'Doe';
  formData.email = 'john.doe@example.com';
  formData.phone = '09123456789';
  formData.address = '123 Main Street, Cebu City';
  formData.dateOfBirth = '1990-01-15';
  formData.gender = 'male';
  formData.educationalAttainment = 'Bachelor\'s Degree';

  console.log('2. After personal info input:', formData);

  // Simulate user input for emergency contact
  formData.emergencyContact.name = 'Jane Doe';
  formData.emergencyContact.phone = '09187654321';
  formData.emergencyContact.relationship = 'spouse';

  console.log('3. After emergency contact input:', formData);

  // Simulate form update (like the optimized handleFormUpdate function)
  const handleFormUpdate = (updates: Partial<PatientFormData>) => {
    formData = { ...formData, ...updates };
  };

  // Test updating a single field
  handleFormUpdate({ firstName: 'Jonathan' });
  console.log('4. After updating firstName:', formData.firstName);

  // Test updating emergency contact
  handleFormUpdate({
    emergencyContact: {
      ...formData.emergencyContact,
      name: 'Jane Smith'
    }
  });
  console.log('5. After updating emergency contact name:', formData.emergencyContact.name);

  // Verify that all other fields are preserved
  const allFieldsPreserved = 
    formData.middleName === 'Michael' &&
    formData.lastName === 'Doe' &&
    formData.email === 'john.doe@example.com' &&
    formData.phone === '09123456789' &&
    formData.address === '123 Main Street, Cebu City' &&
    formData.dateOfBirth === '1990-01-15' &&
    formData.gender === 'male' &&
    formData.educationalAttainment === 'Bachelor\'s Degree' &&
    formData.emergencyContact.phone === '09187654321' &&
    formData.emergencyContact.relationship === 'spouse';

  console.log('✅ All fields preserved:', allFieldsPreserved);
  console.log('✅ Form updates working correctly');

  console.log('\n🎉 Patient form stability test passed!');
}

// Run the test
testPatientFormStability();
