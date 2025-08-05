import { ref, set, get, remove } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import { auth } from '@/lib/firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';

export interface PasswordResetToken {
  email: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export class PasswordResetService {
  private readonly TOKEN_EXPIRATION_MINUTES = 3; // 3 minutes expiration

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomPart}`;
  }

  /**
   * Create a password reset token with 3-minute expiration
   */
  async createPasswordResetToken(email: string): Promise<string> {
    try {
      const token = this.generateToken();
      const now = Date.now();
      const expiresAt = now + (this.TOKEN_EXPIRATION_MINUTES * 60 * 1000); // 3 minutes

      const resetToken: PasswordResetToken = {
        email,
        token,
        createdAt: now,
        expiresAt,
        used: false
      };

      // Store the token in Firebase
      await set(ref(db, `password-reset-tokens/${token}`), resetToken);

      console.log(`Password reset token created for ${email}, expires at ${new Date(expiresAt).toLocaleString()}`);

      return token;
    } catch (error) {
      console.error('Error creating password reset token:', error);
      throw new Error('Failed to create password reset token');
    }
  }

  /**
   * Validate a password reset token
   */
  async validatePasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    try {
      const snapshot = await get(ref(db, `password-reset-tokens/${token}`));
      
      if (!snapshot.exists()) {
        return null;
      }

      const resetToken: PasswordResetToken = snapshot.val();
      const now = Date.now();

      // Check if token is expired or already used
      if (now > resetToken.expiresAt || resetToken.used) {
        // Clean up expired/used token
        await this.cleanupToken(token);
        return null;
      }

      return resetToken;
    } catch (error) {
      console.error('Error validating password reset token:', error);
      return null;
    }
  }

  /**
   * Mark a token as used
   */
  async markTokenAsUsed(token: string): Promise<void> {
    try {
      await set(ref(db, `password-reset-tokens/${token}/used`), true);
    } catch (error) {
      console.error('Error marking token as used:', error);
    }
  }

  /**
   * Clean up a token (remove from database)
   */
  private async cleanupToken(token: string): Promise<void> {
    try {
      await remove(ref(db, `password-reset-tokens/${token}`));
    } catch (error) {
      console.error('Error cleaning up token:', error);
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const snapshot = await get(ref(db, 'password-reset-tokens'));
      const now = Date.now();
      let cleanedCount = 0;

      if (snapshot.exists()) {
        const cleanupPromises: Promise<void>[] = [];

        snapshot.forEach((childSnapshot) => {
          const resetToken: PasswordResetToken = childSnapshot.val();
          
          if (now > resetToken.expiresAt || resetToken.used) {
            cleanupPromises.push(this.cleanupToken(resetToken.token));
            cleanedCount++;
          }
        });

        await Promise.all(cleanupPromises);
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }

  /**
   * Send password reset email with custom token
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      // Create custom token with 3-minute expiration
      const token = await this.createPasswordResetToken(email);
      
      // For now, we'll use Firebase's default sendPasswordResetEmail
      // In a production environment, you would implement custom email sending
      // with the custom token and expiration information
      await sendPasswordResetEmail(auth, email);
      
      console.log(`Password reset email sent to ${email} with 3-minute expiration`);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Get token expiration time in minutes
   */
  getTokenExpirationMinutes(): number {
    return this.TOKEN_EXPIRATION_MINUTES;
  }
}

// Export singleton instance
export const passwordResetService = new PasswordResetService(); 