import { ref, set, get, remove } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import crypto from 'crypto';

export interface TemporaryPasswordData {
  email: string;
  password: string;
  userType: 'doctor' | 'patient';
  userId: string;
  createdAt: number;
  expiresAt: number;
  sent: boolean;
  encryptedPassword: string; // Encrypted version for storage
}

export class TemporaryPasswordService {
  private static instance: TemporaryPasswordService;
  private readonly ENCRYPTION_KEY: string;
  private readonly EXPIRATION_MINUTES = 10; // 10 minutes expiration
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes cleanup interval

  constructor() {
    // Use environment variable for encryption key or generate a default one
    this.ENCRYPTION_KEY = process.env.TEMP_PASSWORD_ENCRYPTION_KEY || 
      'default-key-change-in-production-32-chars';
    
    if (this.ENCRYPTION_KEY.length !== 32) {
      throw new Error('TEMP_PASSWORD_ENCRYPTION_KEY must be exactly 32 characters long');
    }

    // Start cleanup interval
    this.startCleanupInterval();
  }

  public static getInstance(): TemporaryPasswordService {
    if (!TemporaryPasswordService.instance) {
      TemporaryPasswordService.instance = new TemporaryPasswordService();
    }
    return TemporaryPasswordService.instance;
  }

  /**
   * Generate a secure temporary password that meets Firebase requirements
   */
  private generateSecurePassword(): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    
    // Fill the rest with random characters from all categories
    const allChars = lowercase + uppercase + numbers + specialChars;
    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password to make it more random
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Encrypt password using AES-256-CBC
   */
  private encryptPassword(password: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt password using AES-256-CBC
   */
  private decryptPassword(encryptedPassword: string): string {
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Create a temporary password for a user
   */
  async createTemporaryPassword(
    email: string, 
    userType: 'doctor' | 'patient', 
    userId: string
  ): Promise<{ password: string; tempPasswordId: string }> {
    try {
      const password = this.generateSecurePassword();
      const encryptedPassword = this.encryptPassword(password);
      const now = Date.now();
      const expiresAt = now + (this.EXPIRATION_MINUTES * 60 * 1000);
      
      const tempPasswordId = `temp_${userId}_${now}`;
      
      const tempPasswordData: TemporaryPasswordData = {
        email,
        password, // Keep unencrypted version temporarily for email sending
        userType,
        userId,
        createdAt: now,
        expiresAt,
        sent: false,
        encryptedPassword
      };

      // Store in Firebase with encrypted password
      await set(ref(db, `temporary-passwords/${tempPasswordId}`), {
        ...tempPasswordData,
        password: encryptedPassword // Store encrypted version
      });

      console.log(`Temporary password created for ${email} (${userType}), expires at ${new Date(expiresAt).toLocaleString()}`);

      return { password, tempPasswordId };
    } catch (error) {
      console.error('Error creating temporary password:', error);
      throw new Error('Failed to create temporary password');
    }
  }

  /**
   * Mark temporary password as sent and clean up unencrypted version
   */
  async markAsSent(tempPasswordId: string): Promise<void> {
    try {
      const tempPasswordRef = ref(db, `temporary-passwords/${tempPasswordId}`);
      const snapshot = await get(tempPasswordRef);
      
      if (!snapshot.exists()) {
        throw new Error('Temporary password not found');
      }

      const data = snapshot.val() as TemporaryPasswordData;
      
      // Update to mark as sent and remove unencrypted password
      await set(tempPasswordRef, {
        ...data,
        sent: true,
        password: data.encryptedPassword // Keep only encrypted version
      });

      console.log(`Temporary password ${tempPasswordId} marked as sent`);
    } catch (error) {
      console.error('Error marking temporary password as sent:', error);
      throw new Error('Failed to mark temporary password as sent');
    }
  }

  /**
   * Get temporary password data (for email sending)
   */
  async getTemporaryPasswordData(tempPasswordId: string): Promise<{ email: string; password: string; userType: string; userId: string } | null> {
    try {
      const tempPasswordRef = ref(db, `temporary-passwords/${tempPasswordId}`);
      const snapshot = await get(tempPasswordRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.val() as TemporaryPasswordData;
      
      // Check if expired
      if (Date.now() > data.expiresAt) {
        await this.deleteTemporaryPassword(tempPasswordId);
        return null;
      }

      return {
        email: data.email,
        password: data.password, // This should be the unencrypted version
        userType: data.userType,
        userId: data.userId
      };
    } catch (error) {
      console.error('Error getting temporary password data:', error);
      return null;
    }
  }

  /**
   * Delete temporary password
   */
  async deleteTemporaryPassword(tempPasswordId: string): Promise<void> {
    try {
      await remove(ref(db, `temporary-passwords/${tempPasswordId}`));
      console.log(`Temporary password ${tempPasswordId} deleted`);
    } catch (error) {
      console.error('Error deleting temporary password:', error);
      throw new Error('Failed to delete temporary password');
    }
  }

  /**
   * Clean up expired temporary passwords
   */
  async cleanupExpiredPasswords(): Promise<number> {
    try {
      const tempPasswordsRef = ref(db, 'temporary-passwords');
      const snapshot = await get(tempPasswordsRef);
      
      if (!snapshot.exists()) {
        return 0;
      }

      const tempPasswords = snapshot.val();
      const now = Date.now();
      let cleanedCount = 0;

      for (const [tempPasswordId, data] of Object.entries(tempPasswords)) {
        const tempData = data as TemporaryPasswordData;
        if (now > tempData.expiresAt) {
          await this.deleteTemporaryPassword(tempPasswordId);
          cleanedCount++;
        }
      }

      console.log(`Cleaned up ${cleanedCount} expired temporary passwords`);
      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired temporary passwords:', error);
      return 0;
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredPasswords();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{ total: number; expired: number; sent: number }> {
    try {
      const tempPasswordsRef = ref(db, 'temporary-passwords');
      const snapshot = await get(tempPasswordsRef);
      
      if (!snapshot.exists()) {
        return { total: 0, expired: 0, sent: 0 };
      }

      const tempPasswords = snapshot.val();
      const now = Date.now();
      let total = 0;
      let expired = 0;
      let sent = 0;

      for (const data of Object.values(tempPasswords)) {
        const tempData = data as TemporaryPasswordData;
        total++;
        
        if (now > tempData.expiresAt) {
          expired++;
        }
        
        if (tempData.sent) {
          sent++;
        }
      }

      return { total, expired, sent };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      return { total: 0, expired: 0, sent: 0 };
    }
  }
}
