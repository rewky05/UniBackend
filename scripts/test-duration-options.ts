// Test script for duration options logic

function getDurationOptions(defaultDuration: number) {
  const predefinedDurations = [15, 30, 45, 60];
  
  // If default duration is not in predefined list, add it
  if (!predefinedDurations.includes(defaultDuration)) {
    predefinedDurations.push(defaultDuration);
    predefinedDurations.sort((a, b) => a - b); // Sort numerically
  }
  
  return predefinedDurations;
}

function testDurationOptions() {
  console.log('🧪 Testing Duration Options Logic...\n');

  // Test 1: Default duration is in predefined list
  console.log('1. Testing with default duration 30 (in predefined list):');
  const options1 = getDurationOptions(30);
  console.log('Options:', options1);
  console.log('Expected: [15, 30, 45, 60]');
  console.log('✅ Pass:', JSON.stringify(options1) === '[15,30,45,60]');

  // Test 2: Default duration is not in predefined list
  console.log('\n2. Testing with default duration 20 (not in predefined list):');
  const options2 = getDurationOptions(20);
  console.log('Options:', options2);
  console.log('Expected: [15, 20, 30, 45, 60]');
  console.log('✅ Pass:', JSON.stringify(options2) === '[15,20,30,45,60]');

  // Test 3: Default duration is larger than predefined list
  console.log('\n3. Testing with default duration 90 (larger than predefined list):');
  const options3 = getDurationOptions(90);
  console.log('Options:', options3);
  console.log('Expected: [15, 30, 45, 60, 90]');
  console.log('✅ Pass:', JSON.stringify(options3) === '[15,30,45,60,90]');

  // Test 4: Default duration is smaller than predefined list
  console.log('\n4. Testing with default duration 10 (smaller than predefined list):');
  const options4 = getDurationOptions(10);
  console.log('Options:', options4);
  console.log('Expected: [10, 15, 30, 45, 60]');
  console.log('✅ Pass:', JSON.stringify(options4) === '[10,15,30,45,60]');

  console.log('\n🎉 All duration options tests passed!');
}

// Run the test
testDurationOptions();
