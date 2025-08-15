/**
 * Test file demonstrating all supported date formats
 * This file shows the various date formats that can now be parsed successfully
 */

import { safeCreateDate, safeGetTimestamp, formatDateToText, formatDateTimeToText } from '../utils';

// Test function to demonstrate date parsing
export function testDateFormats() {
  const testCases = [
    // Standard formats
    '2024-12-25',
    '12/25/2024',
    '25/12/2024',
    '2024/12/25',
    '12-25-2024',
    '25-12-2024',
    
    // Two-digit years
    '12/25/24',
    '25/12/24',
    '12-25-24',
    '25-12-24',
    
    // Month names
    'December 25, 2024',
    'Dec 25, 2024',
    '25 December 2024',
    '25 Dec 2024',
    
    // ISO formats
    '2024-12-25T10:30:00',
    '2024-12-25 10:30:00',
    '2024-12-25T10:30',
    '2024-12-25 10:30',
    
    // Timestamps
    '1703520000000', // Unix timestamp
    1703520000000,   // Number timestamp
    
    // Natural language
    'today',
    'yesterday',
    'tomorrow',
    '5 days ago',
    '3 days from now',
    
    // Edge cases
    '2024-02-29', // Leap year
    '2023-02-28', // Non-leap year
    '2024-04-30', // 30-day month
    '2024-05-31', // 31-day month
    
    // Various separators
    '2024.12.25',
    '2024_12_25',
    '2024 12 25',
    
    // With extra spaces
    '  December  25,  2024  ',
    '  2024-12-25  ',
    
    // Invalid formats (should return null)
    'invalid-date',
    '2024-13-01', // Invalid month
    '2024-12-32', // Invalid day
    '2024-02-30', // Invalid day for February
    '',
    null,
    undefined,
  ];

  console.log('=== Date Format Testing ===\n');
  
  testCases.forEach((testCase, index) => {
    const result = safeCreateDate(testCase);
    const timestamp = safeGetTimestamp(testCase);
    const formatted = formatDateToText(testCase);
    
    console.log(`Test ${index + 1}: "${testCase}"`);
    console.log(`  Type: ${typeof testCase}`);
    console.log(`  Parsed: ${result ? result.toISOString() : 'null'}`);
    console.log(`  Timestamp: ${timestamp}`);
    console.log(`  Formatted: ${formatted}`);
    console.log('---');
  });
}

// Test specific format categories
export function testFormatCategories() {
  console.log('\n=== Format Categories ===\n');
  
  // Numeric formats
  console.log('Numeric Formats:');
  ['2024-12-25', '12/25/2024', '25/12/2024', '12-25-24'].forEach(date => {
    console.log(`  ${date} -> ${formatDateToText(date)}`);
  });
  
  // Month name formats
  console.log('\nMonth Name Formats:');
  ['December 25, 2024', 'Dec 25, 2024', '25 December 2024'].forEach(date => {
    console.log(`  ${date} -> ${formatDateToText(date)}`);
  });
  
  // ISO formats
  console.log('\nISO Formats:');
  ['2024-12-25T10:30:00', '2024-12-25 10:30:00'].forEach(date => {
    console.log(`  ${date} -> ${formatDateTimeToText(date)}`);
  });
  
  // Natural language
  console.log('\nNatural Language:');
  ['today', 'yesterday', 'tomorrow', '5 days ago'].forEach(date => {
    console.log(`  ${date} -> ${formatDateToText(date)}`);
  });
  
  // Timestamps
  console.log('\nTimestamps:');
  ['1703520000000', 1703520000000].forEach(date => {
    console.log(`  ${date} -> ${formatDateToText(date)}`);
  });
}

// Test error handling
export function testErrorHandling() {
  console.log('\n=== Error Handling ===\n');
  
  const invalidDates = [
    'not-a-date',
    '2024-13-01',
    '2024-12-32',
    '2024-02-30',
    '2024-04-31',
    'invalid',
    '',
    null,
    undefined,
    '2024/13/01',
    '2024/12/32',
  ];
  
  invalidDates.forEach(date => {
    const result = safeCreateDate(date);
    const formatted = formatDateToText(date);
    console.log(`"${date}" -> ${result ? 'SUCCESS' : 'FAILED'} (${formatted})`);
  });
}

// Performance test
export function testPerformance() {
  console.log('\n=== Performance Test ===\n');
  
  const testDate = '2024-12-25';
  const iterations = 10000;
  
  console.time('safeCreateDate');
  for (let i = 0; i < iterations; i++) {
    safeCreateDate(testDate);
  }
  console.timeEnd('safeCreateDate');
  
  console.time('safeGetTimestamp');
  for (let i = 0; i < iterations; i++) {
    safeGetTimestamp(testDate);
  }
  console.timeEnd('safeGetTimestamp');
  
  console.time('formatDateToText');
  for (let i = 0; i < iterations; i++) {
    formatDateToText(testDate);
  }
  console.timeEnd('formatDateToText');
}

// Run all tests
export function runAllTests() {
  testDateFormats();
  testFormatCategories();
  testErrorHandling();
  testPerformance();
}

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).testDateFormats = runAllTests;
}
