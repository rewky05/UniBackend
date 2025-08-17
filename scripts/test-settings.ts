import { settingsService } from '../lib/services/settings.service';

async function testSettings() {
  console.log('🧪 Testing Settings Service...\n');

  try {
    // Test 1: Get default settings
    console.log('1. Getting default settings...');
    const defaultSettings = await settingsService.getSettings();
    console.log('✅ Default settings:', defaultSettings);

    // Test 2: Update settings
    console.log('\n2. Updating settings...');
    await settingsService.updateSettings({
      defaultAppointmentDuration: 45,
      appointmentDurationUnit: 'minutes'
    }, 'test-user-123');
    console.log('✅ Settings updated successfully');

    // Test 3: Get updated settings
    console.log('\n3. Getting updated settings...');
    const updatedSettings = await settingsService.getSettings();
    console.log('✅ Updated settings:', updatedSettings);

    // Test 4: Update settings again
    console.log('\n4. Updating settings to hours...');
    await settingsService.updateSettings({
      defaultAppointmentDuration: 1,
      appointmentDurationUnit: 'hours'
    }, 'test-user-456');
    console.log('✅ Settings updated to hours successfully');

    // Test 5: Get final settings
    console.log('\n5. Getting final settings...');
    const finalSettings = await settingsService.getSettings();
    console.log('✅ Final settings:', finalSettings);

    // Test 6: Reset to default
    console.log('\n6. Resetting to default settings...');
    await settingsService.updateSettings({
      defaultAppointmentDuration: 30,
      appointmentDurationUnit: 'minutes'
    }, 'test-user-reset');
    console.log('✅ Settings reset to default');

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSettings();
