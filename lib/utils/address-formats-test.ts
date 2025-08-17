import { resolveAddress, resolveFullAddress, getAddressComponents, getStreetAddress, getLocationDetails } from '../utils';

// Test cases for address resolution
export function testAddressResolution() {
  console.log('=== Testing Address Resolution ===');
  
  // Test 1: addressLine format
  const test1 = {
    addressLine: 'Osmeña Blvd, Capitol Site, Cebu City, 6000 Cebu, Philippines'
  };
  console.log('Test 1 (addressLine):', resolveAddress(test1));
  console.log('Test 1 (full):', resolveFullAddress(test1));
  console.log('Test 1 (street):', getStreetAddress(test1));
  console.log('Test 1 (location):', getLocationDetails(test1));
  console.log('Test 1 (components):', getAddressComponents(test1));
  
  // Test 2: separate fields format
  const test2 = {
    address: '456 Lahug Avenue',
    city: 'Cebu City',
    province: 'Cebu',
    zipCode: '6000'
  };
  console.log('Test 2 (separate):', resolveAddress(test2));
  console.log('Test 2 (full):', resolveFullAddress(test2));
  console.log('Test 2 (street):', getStreetAddress(test2));
  console.log('Test 2 (location):', getLocationDetails(test2));
  console.log('Test 2 (components):', getAddressComponents(test2));
  
  // Test 3: mixed format (both addressLine and separate fields)
  const test3 = {
    addressLine: 'Ayala Center Cebu, Archbishop Reyes Ave, Cebu City',
    address: '789 IT Park',
    city: 'Cebu City',
    province: 'Cebu',
    zipCode: '6000'
  };
  console.log('Test 3 (mixed - should use addressLine):', resolveAddress(test3));
  console.log('Test 3 (full):', resolveFullAddress(test3));
  console.log('Test 3 (street):', getStreetAddress(test3));
  console.log('Test 3 (location):', getLocationDetails(test3));
  console.log('Test 3 (components):', getAddressComponents(test3));
  
  // Test 4: incomplete separate fields
  const test4 = {
    address: 'Urgello',
    city: 'Cebu City'
    // missing province and zipCode
  };
  console.log('Test 4 (incomplete):', resolveAddress(test4));
  console.log('Test 4 (full):', resolveFullAddress(test4));
  console.log('Test 4 (street):', getStreetAddress(test4));
  console.log('Test 4 (location):', getLocationDetails(test4));
  console.log('Test 4 (components):', getAddressComponents(test4));
  
  // Test 5: no address data
  const test5 = {};
  console.log('Test 5 (empty):', resolveAddress(test5));
  console.log('Test 5 (full):', resolveFullAddress(test5));
  console.log('Test 5 (street):', getStreetAddress(test5));
  console.log('Test 5 (location):', getLocationDetails(test5));
  console.log('Test 5 (components):', getAddressComponents(test5));
  
  console.log('=== End Testing ===');
}

// Example usage in components
export function getDisplayAddress(clinic: any): string {
  // Use resolved address if available, otherwise fall back to legacy fields
  return clinic.resolvedAddress || 
         clinic.addressLine || 
         resolveAddress(clinic) || 
         'Address not available';
}

export function getFullDisplayAddress(clinic: any): string {
  // Use resolved full address if available, otherwise fall back to legacy fields
  return clinic.resolvedFullAddress || 
         resolveFullAddress(clinic) || 
         'Address not available';
}

// Helper functions for accessing individual address components
export function getClinicStreetAddress(clinic: any): string {
  return clinic.streetAddress || getStreetAddress(clinic) || 'Address not available';
}

export function getClinicLocationDetails(clinic: any): string {
  return clinic.locationDetails || getLocationDetails(clinic) || 'Location not available';
}

export function getClinicAddressComponents(clinic: any): any {
  return clinic.addressComponents || getAddressComponents(clinic);
}

// Helper functions for accessing specific address parts
export function getClinicCity(clinic: any): string {
  const components = getClinicAddressComponents(clinic);
  return components.city || 'City not available';
}

export function getClinicProvince(clinic: any): string {
  const components = getClinicAddressComponents(clinic);
  return components.province || 'Province not available';
}

export function getClinicZipCode(clinic: any): string {
  const components = getClinicAddressComponents(clinic);
  return components.zipCode || 'Zip code not available';
}

export function getClinicAddressLine(clinic: any): string {
  const components = getClinicAddressComponents(clinic);
  return components.addressLine || 'Address line not available';
}
