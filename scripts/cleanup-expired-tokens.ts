import { passwordResetService } from '../lib/services/password-reset.service';

async function cleanupExpiredTokens() {
  try {
    console.log('🧹 Starting cleanup of expired password reset tokens...');
    
    const cleanedCount = await passwordResetService.cleanupExpiredTokens();
    
    if (cleanedCount > 0) {
      console.log(`✅ Cleaned up ${cleanedCount} expired password reset tokens`);
    } else {
      console.log('✅ No expired tokens found to clean up');
    }
    
    console.log('🎉 Password reset token cleanup completed!');
  } catch (error) {
    console.error('❌ Error during token cleanup:', error);
  }
}

// Run the cleanup
cleanupExpiredTokens(); 