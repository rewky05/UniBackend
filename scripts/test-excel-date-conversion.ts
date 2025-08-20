/**
 * Test script for Excel date/time conversion
 * This script tests the conversion logic used in the bulk import dialog
 */

// Test Excel date conversion function
function convertExcelDate(excelNumber: number): string {
  // Excel stores dates as days since January 1, 1900
  // JavaScript Date constructor expects milliseconds since January 1, 1970
  const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
  const jsEpoch = new Date(1970, 0, 1); // January 1, 1970
  const epochDiff = excelEpoch.getTime() - jsEpoch.getTime();
  
  // Convert Excel days to milliseconds and adjust for epoch difference
  const milliseconds = (excelNumber - 2) * 24 * 60 * 60 * 1000 + epochDiff;
  const date = new Date(milliseconds);
  
  return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

// Test Excel time conversion function
function convertExcelTime(excelNumber: number): string {
  const hours = excelNumber * 24;
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Test cases
console.log('=== Excel Date Conversion Tests ===');

// Test date conversions
const testDates = [
  { excel: 45890, expected: '2025-08-19' }, // August 19, 2025
  { excel: 44927, expected: '2023-01-01' }, // January 1, 2023
  { excel: 45292, expected: '2024-01-01' }, // January 1, 2024
  { excel: 45658, expected: '2025-01-01' }, // January 1, 2025
];

testDates.forEach(test => {
  const result = convertExcelDate(test.excel);
  const passed = result === test.expected;
  console.log(`Date ${test.excel} -> ${result} ${passed ? '✓' : '✗'} (expected: ${test.expected})`);
});

console.log('\n=== Excel Time Conversion Tests ===');

// Test time conversions
const testTimes = [
  { excel: 0.25, expected: '06:00' },   // 6:00 AM (quarter of a day)
  { excel: 0.5, expected: '12:00' },    // 12:00 PM (half a day)
  { excel: 0.75, expected: '18:00' },   // 6:00 PM (three quarters of a day)
  { excel: 0.083333, expected: '02:00' }, // 2:00 AM (1/12 of a day)
  { excel: 0.166667, expected: '04:00' }, // 4:00 AM (1/6 of a day)
];

testTimes.forEach(test => {
  const result = convertExcelTime(test.excel);
  const passed = result === test.expected;
  console.log(`Time ${test.excel} -> ${result} ${passed ? '✓' : '✗'} (expected: ${test.expected})`);
});

console.log('\n=== Combined Date-Time Tests ===');

// Test combined date-time (Excel stores as date + time fraction)
const testDateTime = [
  { excel: 45890.25, expectedDate: '2025-08-19', expectedTime: '06:00' }, // Aug 19, 2025 6:00 AM
  { excel: 45890.5, expectedDate: '2025-08-19', expectedTime: '12:00' },  // Aug 19, 2025 12:00 PM
];

testDateTime.forEach(test => {
  const datePart = Math.floor(test.excel);
  const timePart = test.excel - datePart;
  
  const resultDate = convertExcelDate(datePart);
  const resultTime = convertExcelTime(timePart);
  
  const datePassed = resultDate === test.expectedDate;
  const timePassed = resultTime === test.expectedTime;
  
  console.log(`DateTime ${test.excel} -> Date: ${resultDate} ${datePassed ? '✓' : '✗'} (${test.expectedDate}), Time: ${resultTime} ${timePassed ? '✓' : '✗'} (${test.expectedTime})`);
});

console.log('\n=== Test Complete ===');
