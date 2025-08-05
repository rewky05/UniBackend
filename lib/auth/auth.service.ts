import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { passwordResetService } from '@/lib/services/password-reset.service';
import { ref, set, get } from 'firebase/database';
import { auth, db } from '@/lib/firebase/config';
import { securityService } from '@/lib/services/security.service';
import { captchaService, type CaptchaSolution } from '@/lib/services/captcha.service';
import { sessionService } from '@/lib/services/session.service';
import { SecureSessionStorage, SessionActivityTracker } from '@/lib/utils/session-storage';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'superadmin' | 'admin' | 'moderator';
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: number;
  createdAt: number;
}

export class AuthService {
  /**
   * Sign in with email, password, and captcha solution
   */
  async signIn(email: string, password: string, captchaSolution?: CaptchaSolution): Promise<AdminUser> {
    try {
      // Check if account is locked
      const { locked, record } = await securityService.isAccountLocked(email);
      if (locked && record) {
        const remainingTime = record.lockoutUntil! - Date.now();
        const minutes = Math.ceil(remainingTime / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        let timeMessage = '';
        if (hours > 0) {
          timeMessage = `${hours} hour${hours > 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
        } else {
          timeMessage = `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
        
        throw new Error(`Account is locked. Please try again in ${timeMessage}.`);
      }

      // Captcha validation temporarily disabled
      // if (!captchaSolution) {
      //   await securityService.recordFailedAttempt(email);
      //   throw new Error('Security verification is required');
      // }

      // const currentPuzzle = this.getCurrentPuzzle(email);
      // if (!currentPuzzle) {
      //   console.error('No puzzle found for email:', email);
      //   await securityService.recordFailedAttempt(email);
      //   throw new Error('Invalid security verification session. Please refresh and try again.');
      // }

      // const isCaptchaValid = captchaService.validateSolution(currentPuzzle, captchaSolution);
      // if (!isCaptchaValid) {
      //   console.error('Captcha validation failed for email:', email);
      //   await securityService.recordFailedAttempt(email);
      //   throw new Error('Security verification failed. Please try again.');
      // }

      // If captcha is valid, proceed with password authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Record successful login
      await securityService.recordSuccessfulAttempt(email);

      // Update last login time
      await this.updateLastLogin(user.uid);

      // Get admin user details from database
      let adminUser: AdminUser;
      
      try {
        // Try to get user from database first
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          adminUser = {
            uid: user.uid,
            email: user.email!,
            displayName: userData.displayName || user.displayName || 'Admin User',
            role: userData.role || 'admin',
            permissions: this.getRolePermissions(userData.role || 'admin'),
            isActive: userData.isActive !== false,
            createdAt: userData.createdAt || Date.now(),
            lastLoginAt: Date.now()
          };
        } else {
          // Fallback for users not in database
          adminUser = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || 'Admin User',
            role: 'admin', // Default to admin role
            permissions: this.getRolePermissions('admin'),
            isActive: true,
            createdAt: Date.now(),
            lastLoginAt: Date.now()
          };
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        // Fallback for database errors
        adminUser = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || 'Admin User',
          role: 'admin', // Default to admin role
          permissions: this.getRolePermissions('admin'),
          isActive: true,
          createdAt: Date.now(),
          lastLoginAt: Date.now()
        };
      }

      // Create session for the user
      try {
        const sessionData = await sessionService.createSession(
          user.uid,
          user.email!,
          adminUser.role,
          this.getClientIP(),
          navigator.userAgent
        );

        // Store session securely on client
        SecureSessionStorage.storeSession(sessionData);

        // Start activity tracking
        SessionActivityTracker.startTracking();
        
        // Trigger a small delay to ensure session is properly stored
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (sessionError) {
        console.error('Error creating session:', sessionError);
        // Continue with login even if session creation fails
      }
      
      return adminUser;

    } catch (error: any) {
      // Record failed attempt for authentication errors
      const isAuthError = error.code && (
        error.code.includes('wrong-password') || 
        error.code.includes('user-not-found') ||
        error.code.includes('invalid-credential') ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-credential'
      );

      if (isAuthError) {
        await securityService.recordFailedAttempt(email);
      }
      
      // Handle different types of errors
      if (error.message) {
        // If it's already a user-friendly error message, use it
        throw new Error(error.message);
      } else if (error.code) {
        // If it's a Firebase auth error, convert it
        throw new Error(this.getAuthErrorMessage(error.code));
      } else {
        // Fallback for unknown errors
        console.error('Authentication error:', error);
        throw new Error('An authentication error occurred. Please try again.');
      }
    }
  }

  /**
   * Sanitize email for use as storage key
   */
  private sanitizeEmailForStorage(email: string): string {
    return email
      .replace(/\./g, '-')  // Replace dots with hyphens
      .replace(/@/g, '-')   // Replace @ with hyphens
      .replace(/[^a-zA-Z0-9_-]/g, '_'); // Replace any other invalid chars with underscores
  }

  /**
   * Get current puzzle for an email
   */
  private getCurrentPuzzle(email: string): any {
    try {
      const sanitizedEmail = this.sanitizeEmailForStorage(email);
      const storageKey = `captcha_puzzle_${sanitizedEmail}`;
      const puzzleData = sessionStorage.getItem(storageKey);
      return puzzleData ? JSON.parse(puzzleData) : null;
    } catch (error) {
      console.error('Error retrieving puzzle for email:', email, error);
      return null;
    }
  }

  /**
   * Set current puzzle for an email
   */
  setCurrentPuzzle(email: string, puzzle: any): void {
    try {
      const sanitizedEmail = this.sanitizeEmailForStorage(email);
      sessionStorage.setItem(`captcha_puzzle_${sanitizedEmail}`, JSON.stringify(puzzle));
    } catch (error) {
      console.error('Error setting puzzle:', error);
    }
  }

  /**
   * Clear current puzzle for an email
   */
  private clearCurrentPuzzle(email: string): void {
    try {
      const sanitizedEmail = this.sanitizeEmailForStorage(email);
      sessionStorage.removeItem(`captcha_puzzle_${sanitizedEmail}`);
    } catch (error) {
      console.error('Error clearing puzzle:', error);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      // Destroy session
      const sessionId = SecureSessionStorage.getSessionId();
      if (sessionId) {
        await sessionService.destroySession(sessionId);
      }

      // Stop activity tracking
      SessionActivityTracker.stopTracking();

      // Clear session storage
      SecureSessionStorage.clearSession();

      // Firebase sign out
      await signOut(auth);
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  /**
   * Create new admin user
   */
  async createAdminUser(
    email: string, 
    password: string, 
    displayName: string,
    role: AdminUser['role'] = 'admin'
  ): Promise<AdminUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, { displayName });

      // Send email verification
      await sendEmailVerification(user);

      // Create admin user record in database
      const adminUser: AdminUser = {
        uid: user.uid,
        email: user.email!,
        displayName,
        role,
        permissions: this.getRolePermissions(role),
        isActive: true,
        createdAt: Date.now()
      };

      await set(ref(db, `admin-users/${user.uid}`), adminUser);

      return adminUser;
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Get admin user data from database
   */
  async getAdminUser(uid: string): Promise<AdminUser | null> {
    try {
      const snapshot = await get(ref(db, `admin-users/${uid}`));
      return snapshot.exists() ? snapshot.val() as AdminUser : null;
    } catch (error) {
      console.error('Error getting admin user:', error);
      return null;
    }
  }

  /**
   * Update last login time
   */
  private async updateLastLogin(uid: string): Promise<void> {
    try {
      await set(ref(db, `admin-users/${uid}/lastLoginAt`), Date.now());
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Get permissions for a role
   */
  private getRolePermissions(role: AdminUser['role']): string[] {
    const permissions: Record<AdminUser['role'], string[]> = {
      superadmin: [
        'doctors:read',
        'doctors:write',
        'doctors:delete',
        'feedback:read',
        'feedback:write',
        'feedback:delete',
        'schedules:read',
        'schedules:write',
        'schedules:delete',
        'clinics:read',
        'clinics:write',
        'clinics:delete',
        'admin:read',
        'admin:write',
        'admin:delete',
        'system:settings'
      ],
      admin: [
        'doctors:read',
        'doctors:write',
        'feedback:read',
        'feedback:write',
        'schedules:read',
        'schedules:write',
        'clinics:read',
        'clinics:write'
      ],
      moderator: [
        'doctors:read',
        'feedback:read',
        'feedback:write',
        'schedules:read',
        'clinics:read'
      ]
    };

    return permissions[role] || [];
  }

  /**
   * Check if user has permission
   */
  hasPermission(user: AdminUser | null, permission: string): boolean {
    if (!user || !user.isActive) return false;
    return user.permissions.includes(permission);
  }

  /**
   * Send password reset email with 3-minute expiration
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await passwordResetService.sendPasswordResetEmail(email);
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: AdminUser | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const adminUser = await this.getAdminUser(firebaseUser.uid);
        callback(adminUser);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Convert Firebase auth error codes to user-friendly messages
   */
  private getAuthErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/requires-recent-login': 'Please sign in again to complete this action'
    };

    return errorMessages[errorCode] || 'An authentication error occurred';
  }

  /**
   * Get client IP address (simplified for demo)
   * In production, this should get the real IP from headers
   */
  private getClientIP(): string {
    // In a real application, you would get this from request headers
    // For demo purposes, return a placeholder
    return '127.0.0.1';
  }

  /**
   * Update admin user profile
   */
  async updateAdminUser(uid: string, updates: Partial<AdminUser>): Promise<void> {
    try {
      const currentData = await this.getAdminUser(uid);
      if (!currentData) {
        throw new Error('Admin user not found');
      }

      const updatedData = {
        ...currentData,
        ...updates,
        updatedAt: Date.now()
      };

      await set(ref(db, `admin-users/${uid}`), updatedData);
    } catch (error: any) {
      throw new Error('Failed to update admin user');
    }
  }

  /**
   * Deactivate admin user
   */
  async deactivateAdminUser(uid: string): Promise<void> {
    try {
      await this.updateAdminUser(uid, { isActive: false });
    } catch (error: any) {
      throw new Error('Failed to deactivate admin user');
    }
  }

  /**
   * Get all admin users
   */
  async getAllAdminUsers(): Promise<AdminUser[]> {
    try {
      const snapshot = await get(ref(db, 'admin-users'));
      if (!snapshot.exists()) {
        return [];
      }

      return Object.values(snapshot.val()) as AdminUser[];
    } catch (error) {
      console.error('Error getting admin users:', error);
      return [];
    }
  }
}

// Export singleton instance
export const authService = new AuthService();