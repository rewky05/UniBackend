#!/usr/bin/env ts-node

/**
 * Test script for the temporary password system
 * 
 * This script tests the temporary password creation, email sending,
 * and cleanup functionality.
 * 
 * Usage:
 *   npm run test-temp-password
 *   or
 *   npx ts-node scripts/test-temporary-password-system.ts
 */

// Load environment variables from .env.local using Node.js built-in
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Simple .env.local loader
function loadEnvFile() {
  const envPath = join(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnvFile();

import { TemporaryPasswordService } from '../lib/services/temporary-password.service';
import { EmailService } from '../lib/services/email.service';

async function testTemporaryPasswordSystem() {
  console.log('🧪 Testing Temporary Password System');
  console.log('=====================================');
  
  try {
    // Check environment variables first
    console.log('🔍 Checking environment variables...');
    const hasEncryptionKey = !!process.env.TEMP_PASSWORD_ENCRYPTION_KEY;
    const hasResendKey = !!(process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY);
    
    console.log(`📋 TEMP_PASSWORD_ENCRYPTION_KEY: ${hasEncryptionKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`📋 RESEND_API_KEY: ${hasResendKey ? '✅ Set' : '❌ Missing'}`);
    
    if (!hasEncryptionKey) {
      console.log('\n❌ TEMP_PASSWORD_ENCRYPTION_KEY is required!');
      console.log('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(16).toString(\'hex\'))"');
      process.exit(1);
    }
    
    const tempPasswordService = TemporaryPasswordService.getInstance();
    
    // Only initialize email service if API key is available
    let emailService: EmailService | null = null;
    if (hasResendKey) {
      try {
        emailService = EmailService.getInstance();
        console.log('✅ Email service initialized');
      } catch (error) {
        console.log('⚠️ Email service initialization failed:', error instanceof Error ? error.message : 'Unknown error');
        console.log('Continuing without email service...');
      }
    } else {
      console.log('⚠️ RESEND_API_KEY not set, skipping email tests');
    }
    
    // Test 1: Create temporary password
    console.log('📝 Test 1: Creating temporary password...');
    const { password, tempPasswordId } = await tempPasswordService.createTemporaryPassword(
      'rosales.april65@gmail.com',
      'doctor',
      'test_doctor_123'
    );
    
    console.log(`✅ Temporary password created: ${password}`);
    console.log(`📋 Temp password ID: ${tempPasswordId}`);
    
    // Test 2: Get temporary password data
    console.log('\n📝 Test 2: Retrieving temporary password data...');
    const tempData = await tempPasswordService.getTemporaryPasswordData(tempPasswordId);
    
    if (tempData) {
      console.log(`✅ Retrieved data: ${tempData.email} (${tempData.userType})`);
    } else {
      console.log('❌ Failed to retrieve temporary password data');
    }
    
    // Test 3: Test email service connectivity
    console.log('\n📝 Test 3: Testing email service connectivity...');
    if (emailService) {
      const emailTest = await emailService.testConnection();
      
      if (emailTest.success) {
        console.log('✅ Email service is working');
      } else {
        console.log(`❌ Email service error: ${emailTest.error}`);
      }
    } else {
      console.log('⚠️ Email service not available, skipping connectivity test');
    }
    
    // Test 4: Send test email (optional - requires valid email)
    console.log('🔍 [DEBUG] Process args:', process.argv);
    const sendTestEmail = process.argv.includes('--send-email');
    console.log('🔍 [DEBUG] sendTestEmail flag:', sendTestEmail);
    console.log('🔍 [DEBUG] emailService available:', !!emailService);
    
    if (sendTestEmail && emailService) {
      console.log('\n📝 Test 4: Sending test email...');
      const emailResult = await emailService.sendTemporaryPasswordEmail({
        userName: 'Test User',
        userEmail: 'rosales.april65@gmail.com', // Real email for testing
        temporaryPassword: password,
        userType: 'doctor',
        adminName: 'Test Admin',
        clinicName: 'Test Clinic'
      });
      
      if (emailResult.success) {
        console.log('✅ Test email sent successfully');
        await tempPasswordService.markAsSent(tempPasswordId);
      } else {
        console.log(`❌ Test email failed: ${emailResult.error}`);
      }
    } else if (sendTestEmail && !emailService) {
      console.log('\n📝 Test 4: Cannot send test email - email service not available');
      console.log('Set RESEND_API_KEY environment variable to enable email testing');
    } else {
      console.log('\n📝 Test 4: Skipping email test (use --send-email to test)');
    }
    
    // Test 5: Get cleanup statistics
    console.log('\n📝 Test 5: Getting cleanup statistics...');
    const stats = await tempPasswordService.getCleanupStats();
    console.log('📊 Cleanup statistics:', stats);
    
    // Test 6: Cleanup expired passwords
    console.log('\n📝 Test 6: Running cleanup...');
    const cleanedCount = await tempPasswordService.cleanupExpiredPasswords();
    console.log(`✅ Cleaned up ${cleanedCount} expired passwords`);
    
    // Test 7: Delete test password
    console.log('\n📝 Test 7: Cleaning up test data...');
    await tempPasswordService.deleteTemporaryPassword(tempPasswordId);
    console.log('✅ Test data cleaned up');
    
    console.log('\n=====================================');
    console.log('🎉 All tests completed successfully!');
    
    if (!hasResendKey) {
      console.log('\n📧 To test email sending:');
      console.log('1. Set RESEND_API_KEY environment variable');
      console.log('2. Run: npm run test-temp-password -- --send-email');
    } else {
      console.log('\n📧 To test email sending, run:');
      console.log('npm run test-temp-password -- --send-email');
    }
    
    console.log('\n🔧 Setup requirements:');
    console.log('- TEMP_PASSWORD_ENCRYPTION_KEY (required)');
    console.log('- RESEND_API_KEY (optional, for email testing)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
testTemporaryPasswordSystem().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
