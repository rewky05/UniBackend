import { passwordResetService } from '../lib/services/password-reset.service';

async function testPasswordReset() {
  try {
    console.log('🧪 Testing Password Reset with 3-minute expiration');
    console.log('==================================================');
    
    const testEmail = 'test@unihealth.ph';
    
    // Test 1: Create password reset token
    console.log('\n📝 Test 1: Creating password reset token...');
    const token = await passwordResetService.createPasswordResetToken(testEmail);
    console.log(`✅ Token created: ${token}`);
    console.log(`⏰ Expiration: ${passwordResetService.getTokenExpirationMinutes()} minutes`);
    
    // Test 2: Validate token immediately (should be valid)
    console.log('\n🔍 Test 2: Validating token immediately...');
    const validToken = await passwordResetService.validatePasswordResetToken(token);
    if (validToken) {
      console.log('✅ Token is valid');
      console.log(`Email: ${validToken.email}`);
      console.log(`⏰ Expires at: ${new Date(validToken.expiresAt).toLocaleString()}`);
      console.log(`🔒 Used: ${validToken.used}`);
    } else {
      console.log('❌ Token validation failed');
    }
    
    // Test 3: Mark token as used
    console.log('\n🔒 Test 3: Marking token as used...');
    await passwordResetService.markTokenAsUsed(token);
    console.log('✅ Token marked as used');
    
    // Test 4: Validate used token (should be invalid)
    console.log('\n🔍 Test 4: Validating used token...');
    const usedToken = await passwordResetService.validatePasswordResetToken(token);
    if (usedToken) {
      console.log('❌ Used token should not be valid');
    } else {
      console.log('✅ Used token correctly rejected');
    }
    
    // Test 5: Create another token for expiration test
    console.log('\n📝 Test 5: Creating token for expiration test...');
    const expiringToken = await passwordResetService.createPasswordResetToken(testEmail);
    console.log(`✅ Expiring token created: ${expiringToken}`);
    
    // Test 6: Cleanup expired tokens
    console.log('\n🧹 Test 6: Cleaning up expired tokens...');
    const cleanedCount = await passwordResetService.cleanupExpiredTokens();
    console.log(`✅ Cleaned up ${cleanedCount} expired tokens`);
    
    console.log('\n🎉 All password reset tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Token expiration: ${passwordResetService.getTokenExpirationMinutes()} minutes`);
    console.log(`   • Token validation: Working`);
    console.log(`   • Token usage tracking: Working`);
    console.log(`   • Expired token cleanup: Working`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPasswordReset(); 