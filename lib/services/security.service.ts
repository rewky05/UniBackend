import { ref, get, set, update } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import { SECURITY_CONFIG, calculateLockoutDuration, isAccountLocked } from '@/lib/config/security';

export interface SecurityRecord {
  email: string;
  failedLoginAttempts: number;
  lockoutUntil: number | null;
  consecutiveLockouts: number;
  lastAttemptTime: number;
}

export class SecurityService {
  /**
   * Sanitize email for use as Firebase database key
   * Replaces invalid characters with valid alternatives
   */
  private sanitizeEmailForPath(email: string): string {
    return email
      .replace(/\./g, '-')  // Replace dots with hyphens
      .replace(/@/g, '-')   // Replace @ with hyphens
      .replace(/[^a-zA-Z0-9_-]/g, '_'); // Replace any other invalid chars with underscores
  }

  /**
   * Get security record for an email
   */
  async getSecurityRecord(email: string): Promise<SecurityRecord | null> {
    try {
      const sanitizedEmail = this.sanitizeEmailForPath(email);
      const snapshot = await get(ref(db, `security-records/${sanitizedEmail}`));
      return snapshot.exists() ? snapshot.val() as SecurityRecord : null;
    } catch (error) {
      console.error('Error getting security record:', error);
      return null;
    }
  }

  /**
   * Create or update security record
   */
  async updateSecurityRecord(email: string, updates: Partial<SecurityRecord>): Promise<void> {
    try {
      const sanitizedEmail = this.sanitizeEmailForPath(email);
      await set(ref(db, `security-records/${sanitizedEmail}`), {
        email,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        consecutiveLockouts: 0,
        lastAttemptTime: Date.now(),
        ...updates
      });
    } catch (error) {
      console.error('Error updating security record:', error);
      throw new Error('Failed to update security record');
    }
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedAttempt(email: string): Promise<SecurityRecord> {
    const record = await this.getSecurityRecord(email) || {
      email,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      consecutiveLockouts: 0,
      lastAttemptTime: Date.now()
    };

    const newAttempts = record.failedLoginAttempts + 1;
    const maxAttempts = SECURITY_CONFIG.LOGIN_ATTEMPTS.MAX_ATTEMPTS;

    let lockoutUntil: number | null = null;
    let consecutiveLockouts = record.consecutiveLockouts;

    // Check if account should be locked
    if (newAttempts >= maxAttempts) {
      consecutiveLockouts += 1;
      lockoutUntil = Date.now() + calculateLockoutDuration(consecutiveLockouts);
    }

    const updatedRecord: SecurityRecord = {
      ...record,
      failedLoginAttempts: newAttempts,
      lockoutUntil,
      consecutiveLockouts,
      lastAttemptTime: Date.now()
    };

    await this.updateSecurityRecord(email, updatedRecord);
    return updatedRecord;
  }

  /**
   * Record a successful login attempt
   */
  async recordSuccessfulAttempt(email: string): Promise<void> {
    await this.updateSecurityRecord(email, {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastAttemptTime: Date.now()
    });
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(email: string): Promise<{ locked: boolean; record: SecurityRecord | null }> {
    const record = await this.getSecurityRecord(email);
    
    if (!record) {
      return { locked: false, record: null };
    }

    const locked = isAccountLocked(record.lockoutUntil);
    return { locked, record };
  }

  /**
   * Reset security record (for admin use)
   */
  async resetSecurityRecord(email: string): Promise<void> {
    await this.updateSecurityRecord(email, {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      consecutiveLockouts: 0,
      lastAttemptTime: Date.now()
    });
  }

  /**
   * Get all security records (for admin use)
   */
  async getAllSecurityRecords(): Promise<SecurityRecord[]> {
    try {
      const snapshot = await get(ref(db, 'security-records'));
      if (!snapshot.exists()) {
        return [];
      }
      return Object.values(snapshot.val()) as SecurityRecord[];
    } catch (error) {
      console.error('Error getting security records:', error);
      return [];
    }
  }

  /**
   * Clean up expired lockouts
   */
  async cleanupExpiredLockouts(): Promise<void> {
    try {
      const records = await this.getAllSecurityRecords();
      const now = Date.now();
      
      for (const record of records) {
        if (record.lockoutUntil && record.lockoutUntil < now) {
          await this.updateSecurityRecord(record.email, {
            lockoutUntil: null,
            lastAttemptTime: now
          });
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired lockouts:', error);
    }
  }
}

// Export singleton instance
export const securityService = new SecurityService(); 