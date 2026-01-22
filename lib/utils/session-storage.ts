import { sessionService, type SessionData } from '@/lib/services/session.service';

// Encryption key (in production, this should be stored securely)
const ENCRYPTION_KEY = 'unihealth-session-key-2024';

export interface StoredSession {
  sessionId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  expiresAt: number;
  lastActivity: number;
}

/**
 * Simple encryption/decryption for session data
 * In production, use a proper encryption library
 */
class SessionEncryption {
  private static encode(str: string): string {
    return btoa(encodeURIComponent(str));
  }

  private static decode(str: string): string {
    return decodeURIComponent(atob(str));
  }

  static encrypt(data: string): string {
    // Simple XOR encryption (for demo purposes)
    // In production, use a proper encryption library like crypto-js
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      encrypted += String.fromCharCode(charCode);
    }
    return this.encode(encrypted);
  }

  static decrypt(encryptedData: string): string {
    try {
      const decoded = this.decode(encryptedData);
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
        decrypted += String.fromCharCode(charCode);
      }
      return decrypted;
    } catch (error) {
      console.error('Error decrypting session data:', error);
      return '';
    }
  }
}

/**
 * Secure session storage manager
 */
export class SecureSessionStorage {
  public static readonly SESSION_KEY = 'unihealth_session';
  public static readonly ACTIVITY_KEY = 'unihealth_activity';

  /**
   * Store session data securely
   */
  static storeSession(sessionData: SessionData): void {
    try {
      const storedSession: StoredSession = {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        userEmail: sessionData.userEmail,
        userRole: sessionData.userRole,
        expiresAt: sessionData.expiresAt,
        lastActivity: sessionData.lastActivity,
      };

      const encryptedData = SessionEncryption.encrypt(JSON.stringify(storedSession));
      
      // Store in sessionStorage (cleared when browser closes)
      sessionStorage.setItem(this.SESSION_KEY, encryptedData);
      
      // Store activity timestamp
      sessionStorage.setItem(this.ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  /**
   * Retrieve session data
   */
  static getSession(): StoredSession | null {
    try {
      const encryptedData = sessionStorage.getItem(this.SESSION_KEY);
      if (!encryptedData) return null;

      const decryptedData = SessionEncryption.decrypt(encryptedData);
      const sessionData: StoredSession = JSON.parse(decryptedData);

      // Check if session is expired
      if (Date.now() > sessionData.expiresAt) {
        this.clearSession();
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Error retrieving session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Update session activity
   */
  static updateActivity(): void {
    try {
      const session = this.getSession();
      if (session) {
        session.lastActivity = Date.now();
        session.expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes
        
        const encryptedData = SessionEncryption.encrypt(JSON.stringify(session));
        sessionStorage.setItem(this.SESSION_KEY, encryptedData);
        sessionStorage.setItem(this.ACTIVITY_KEY, Date.now().toString());
      }
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  /**
   * Clear session data
   */
  static clearSession(): void {
    try {
      sessionStorage.removeItem(this.SESSION_KEY);
      sessionStorage.removeItem(this.ACTIVITY_KEY);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Check if session is active
   */
  static isSessionActive(): boolean {
    const session = this.getSession();
    return session !== null && Date.now() < session.expiresAt;
  }

  /**
   * Get session ID
   */
  static getSessionId(): string | null {
    const session = this.getSession();
    return session?.sessionId || null;
  }

  /**
   * Get user role from session
   */
  static getUserRole(): string | null {
    const session = this.getSession();
    return session?.userRole || null;
  }

  /**
   * Get user email from session
   */
  static getUserEmail(): string | null {
    const session = this.getSession();
    return session?.userEmail || null;
  }

  /**
   * Get last activity timestamp
   */
  static getLastActivity(): number | null {
    try {
      const activityStr = sessionStorage.getItem(this.ACTIVITY_KEY);
      return activityStr ? parseInt(activityStr, 10) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user has been inactive for too long
   */
  static isInactive(inactivityMinutes: number = 30): boolean {
    const lastActivity = this.getLastActivity();
    if (!lastActivity) return true;

    const inactiveTime = Date.now() - lastActivity;
    const inactivityThreshold = inactivityMinutes * 60 * 1000;

    return inactiveTime > inactivityThreshold;
  }
}

/**
 * Session activity tracker
 */
export class SessionActivityTracker {
  private static activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'focus',
  ];

  private static isTracking = false;

  /**
   * Start tracking user activity
   */
  static startTracking(): void {
    if (this.isTracking) {
      return;
    }

    this.isTracking = true;
    this.updateActivity();

    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.updateActivity, { passive: true });
    });

    // Periodic activity update disabled - only update on actual user activity
    // setInterval(() => {
    //   if (SecureSessionStorage.isSessionActive()) {
    //     this.updateActivity();
    //   }
    // }, 5 * 60 * 1000);
  }

  /**
   * Stop tracking user activity
   */
  static stopTracking(): void {
    if (!this.isTracking) return;

    this.isTracking = false;
    this.activityEvents.forEach(event => {
      document.removeEventListener(event, this.updateActivity);
    });
  }

  /**
   * Update session activity (async version for server sync)
   */
  private static updateActivityAsync = async (): Promise<void> => {
    if (SecureSessionStorage.isSessionActive()) {
      const sessionId = SecureSessionStorage.getSessionId();
      if (sessionId) {
        try {
          // Update server-side session activity
          await sessionService.updateSessionActivity(sessionId);
          
          // Get the updated session data from server
          const updatedSession = await sessionService.validateSession(sessionId);
          if (updatedSession) {
            // Update client-side session with server data
            const clientSession = SecureSessionStorage.getSession();
            if (clientSession) {
              const oldExpiresAt = clientSession.expiresAt;
              
              clientSession.lastActivity = updatedSession.lastActivity;
              clientSession.expiresAt = updatedSession.expiresAt;
              
              const encryptedData = SessionEncryption.encrypt(JSON.stringify(clientSession));
              sessionStorage.setItem(SecureSessionStorage.SESSION_KEY, encryptedData);
              sessionStorage.setItem(SecureSessionStorage.ACTIVITY_KEY, updatedSession.lastActivity.toString());
              
              // Dispatch custom event to notify UI of session update
              const event = new CustomEvent('sessionActivity', {
                detail: { sessionId, updatedAt: Date.now() }
              });
              window.dispatchEvent(event);
            }
          }
        } catch (error) {
          console.error('❌ Error updating session activity:', error);
          // Fallback to client-side only update
          SecureSessionStorage.updateActivity();
        }
      } else {
        // Fallback to client-side only update
        SecureSessionStorage.updateActivity();
      }
    }
  };

  /**
   * Update session activity (sync wrapper for event listeners)
   */
  private static updateActivity = (): void => {
    // Call async version but don't wait for it
    this.updateActivityAsync().catch(error => {
      console.error('Error in activity update:', error);
    });
  };
}

/**
 * Session validation middleware
 */
export class SessionValidator {
  /**
   * Validate session and redirect if needed
   */
  static async validateSession(): Promise<boolean> {
    try {
      const session = SecureSessionStorage.getSession();
      
      // If no session exists, it's a fresh login - allow it
      if (!session) {
        return true;
      }

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        SecureSessionStorage.clearSession();
        return false;
      }

      // Check if user has been inactive
      if (SecureSessionStorage.isInactive()) {
        SecureSessionStorage.clearSession();
        return false;
      }

      // For fresh logins, be more lenient and skip server validation initially
      // Server validation will happen during the login process
      const timeSinceCreation = Date.now() - session.lastActivity;
      if (timeSinceCreation < 10000) { // Increased to 10 seconds grace period for fresh logins
        return true;
      }

      // Only validate with server for established sessions
      try {
        const serverSession = await sessionService.validateSession(session.sessionId);
        if (!serverSession) {
          SecureSessionStorage.clearSession();
          return false;
        }

        // Update client-side session with server data to keep them in sync
        if (serverSession.lastActivity !== session.lastActivity || serverSession.expiresAt !== session.expiresAt) {
          session.lastActivity = serverSession.lastActivity;
          session.expiresAt = serverSession.expiresAt;
          
          const encryptedData = SessionEncryption.encrypt(JSON.stringify(session));
          sessionStorage.setItem(SecureSessionStorage.SESSION_KEY, encryptedData);
          sessionStorage.setItem(SecureSessionStorage.ACTIVITY_KEY, serverSession.lastActivity.toString());
        }
      } catch (serverError) {
        // If server validation fails, but session is still valid locally, allow it
        // This prevents login issues when server is temporarily unavailable
        console.warn('Server session validation failed, using local session:', serverError);
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      SecureSessionStorage.clearSession();
      return false;
    }
  }

  /**
   * Force logout current session
   */
  static async forceLogout(): Promise<void> {
    try {
      const sessionId = SecureSessionStorage.getSessionId();
      if (sessionId) {
        await sessionService.destroySession(sessionId);
      }
    } catch (error) {
      console.error('Error during force logout:', error);
    } finally {
      SecureSessionStorage.clearSession();
    }
  }
} 