import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { passwordResetService } from '@/lib/services/password-reset.service';
import { ref, set, get } from 'firebase/database';
import { auth, db } from '@/lib/firebase/config';
import { securityService } from '@/lib/services/security.service';
import { captchaService, type CaptchaSolution } from '@/lib/services/captcha.service';
import { sessionService } from '@/lib/services/session.service';
import { SecureSessionStorage, SessionActivityTracker } from '@/lib/utils/session-storage';
import { AUTH_CONFIG } from '@/lib/config/auth';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'superadmin' | 'admin' | 'moderator';
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: number;
  createdAt: number;
  idToken?: string; // Add ID token for session cookie
}

export class AuthService {
  /**
   * Sign in with email, password, and captcha solution
   */
  async signIn(email: string, password: string, captchaSolution?: CaptchaSolution): Promise<AdminUser> {
    try {
      // Clear previous logs
      localStorage.removeItem('signInLogs');
      const logs = [];
      
      logs.push('=== Starting signIn ===');
      logs.push(`SignIn email: ${email}`);
      logs.push(`SignIn password length: ${password.length}`);
      logs.push(`Current auth user before signIn: ${auth.currentUser?.email || 'null'}`);
      logs.push(`Window location: ${typeof window !== 'undefined' ? window.location.href : 'server-side'}`);
      logs.push(`Document ready state: ${typeof document !== 'undefined' ? document.readyState : 'server-side'}`);
      
      console.log('=== Starting signIn ===');
      console.log('SignIn email:', email);
      console.log('SignIn password length:', password.length);
      console.log('Current auth user before signIn:', auth.currentUser);
      console.log('Window location:', typeof window !== 'undefined' ? window.location.href : 'server-side');
      console.log('Document ready state:', typeof document !== 'undefined' ? document.readyState : 'server-side');
      
      logs.push('Setting browser persistence...');
      // Set browser persistence to ensure auth state persists across page reloads
      await setPersistence(auth, browserLocalPersistence);
      
      logs.push('About to call signInWithEmailAndPassword...');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      logs.push(`signInWithEmailAndPassword completed. User: ${user.email}`);
      logs.push(`Current auth user after signInWithEmailAndPassword: ${auth.currentUser?.email || 'null'}`);
      
      console.log('signInWithEmailAndPassword completed. User:', user);
      console.log('Current auth user after signInWithEmailAndPassword:', auth.currentUser);
      
      // Get the ID token for session cookie creation
      logs.push('Getting ID token...');
      const idToken = await user.getIdToken(true);
      logs.push(`ID token obtained: ${idToken ? 'Yes' : 'No'}`);
      
      // Fetch user details from the users node
      const userRef = ref(db, `users/${user.uid}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        throw new Error('User not found in database');
      }
      
      const userData = userSnapshot.val();
      
      logs.push(`User data fetched from database: ${JSON.stringify(userData)}`);
      
      console.log('User data fetched from database:', userData);
      
      const adminUser: AdminUser = {
        uid: user.uid,
        email: user.email || '',
        displayName: userData.displayName || user.displayName || 'Admin User',
        role: userData.role || 'admin',
        permissions: this.getRolePermissions(userData.role || 'admin'),
        isActive: userData.isActive !== false,
        createdAt: userData.createdAt || Date.now(),
        lastLoginAt: Date.now(),
        idToken: idToken // Include ID token for session cookie
      };
      
      logs.push(`Admin user object created: ${JSON.stringify(adminUser)}`);
      logs.push('About to create session...');
      
      console.log('Admin user object created:', adminUser);
      console.log('About to create session...');
      
      // Create session
      const sessionData = {
        sessionId: SecureSessionStorage.getSessionId() || 'N/A',
        userId: adminUser.uid,
        userEmail: adminUser.email,
        userRole: adminUser.role,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        isActive: true
      };
      
      // Store session in localStorage
      SecureSessionStorage.storeSession(sessionData);

      // Track session activity
      SessionActivityTracker.startTracking();
        
      logs.push('Session created and stored successfully');
      logs.push('=== signIn completed successfully ===');
      
      console.log('Session created and stored successfully');
      console.log('=== signIn completed successfully ===');
      
      // Store logs in localStorage
      localStorage.setItem('signInLogs', JSON.stringify(logs));
      
      return adminUser;
    } catch (error: any) {
      const errorLogs = [];
      errorLogs.push('=== Error in signIn ===');
      errorLogs.push(`Error code: ${error.code}`);
      errorLogs.push(`Error message: ${error.message}`);
      errorLogs.push(`Current auth user after error: ${auth.currentUser?.email || 'null'}`);
      errorLogs.push(`Error stack: ${error.stack}`);
      
      console.error('=== Error in signIn ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Current auth user after error:', auth.currentUser);
      console.error('Error stack:', error.stack);
      
      // Store error logs in localStorage
      localStorage.setItem('signInErrorLogs', JSON.stringify(errorLogs));
      
      throw error;
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
      await firebaseSignOut(auth);
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      // await updateProfile(user, { displayName }); // This line was removed from imports

      // Send email verification
      // await sendEmailVerification(user); // This line was removed from imports

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

      await set(ref(db, `users/${user.uid}`), adminUser);

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
      const snapshot = await get(ref(db, `users/${uid}`));
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
      await set(ref(db, `users/${uid}/lastLoginAt`), Date.now());
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
  // REMOVED: This was causing conflicts with useAuth hook
  // onAuthStateChanged(callback: (user: AdminUser | null) => void): () => void {
  //   return onAuthStateChanged(auth, async (firebaseUser) => {
  //     if (firebaseUser) {
  //       const adminUser = await this.getAdminUser(firebaseUser.uid);
  //       callback(adminUser);
  //     } else {
  //       callback(null);
  //     }
  //   });
  // }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Re-authenticate the admin user after creating a new user
   * This method is used when createUserWithEmailAndPassword auto-logs in the new user
   * and we need to restore the admin's session
   */
  async reauthenticateAdmin(adminEmail: string, adminPassword: string): Promise<AdminUser | null> {
    try {
      // Clear previous logs
      localStorage.removeItem('reauthenticateAdminLogs');
      const logs = [];
      
      logs.push('=== Starting reauthenticateAdmin ===');
      logs.push(`Admin email: ${adminEmail}`);
      logs.push(`Admin password length: ${adminPassword.length}`);
      logs.push(`Current auth user before signOut: ${auth.currentUser?.email || 'null'}`);
      
      console.log('=== Starting reauthenticateAdmin ===');
      console.log('Admin email:', adminEmail);
      console.log('Admin password length:', adminPassword.length);
      console.log('Current auth user before signOut:', auth.currentUser);
      
      // Sign out the current user (which is the newly created doctor)
      await firebaseSignOut(auth);
      
      logs.push(`SignOut completed. Current auth user after signOut: ${auth.currentUser?.email || 'null'}`);
      logs.push('About to sign in admin user...');
      
      console.log('SignOut completed. Current auth user after signOut:', auth.currentUser);
      console.log('About to sign in admin user...');
      
      // Sign in the admin user
      const adminUser = await this.signIn(adminEmail, adminPassword);
      
      logs.push(`SignIn completed. Admin user: ${adminUser?.email || 'null'}`);
      logs.push(`Current auth user after signIn: ${auth.currentUser?.email || 'null'}`);
      logs.push('=== reauthenticateAdmin completed successfully ===');
      
      console.log('SignIn completed. Admin user:', adminUser);
      console.log('Current auth user after signIn:', auth.currentUser);
      console.log('=== reauthenticateAdmin completed successfully ===');
      
      // Store logs in localStorage
      localStorage.setItem('reauthenticateAdminLogs', JSON.stringify(logs));
      
      return adminUser;
    } catch (error: any) {
      const errorLogs = [];
      errorLogs.push('=== Error in reauthenticateAdmin ===');
      errorLogs.push(`Error code: ${error.code}`);
      errorLogs.push(`Error message: ${error.message}`);
      errorLogs.push(`Current auth user after error: ${auth.currentUser?.email || 'null'}`);
      
      console.error('=== Error in reauthenticateAdmin ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Current auth user after error:', auth.currentUser);
      
      // Store error logs in localStorage
      localStorage.setItem('reauthenticateAdminErrorLogs', JSON.stringify(errorLogs));
      
      throw error;
    }
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

      await set(ref(db, `users/${uid}`), updatedData);
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
      const snapshot = await get(ref(db, 'users'));
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