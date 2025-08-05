import { ref, set, get, remove, push, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import { AUTH_CONFIG } from '@/lib/config/auth';

export interface SessionData {
  sessionId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

export interface SessionConfig {
  sessionTimeoutMinutes: number;
  maxConcurrentSessions: number;
  cleanupIntervalMinutes: number;
}

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  sessionTimeoutMinutes: 30, // 30 minutes of inactivity
  maxConcurrentSessions: 1, // Max 1 session per user (prevent multiple sessions)
  cleanupIntervalMinutes: 5, // Cleanup every 5 minutes
};

export class SessionService {
  private config: SessionConfig;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
  }

  /**
   * Create a new session for a user
   */
  async createSession(
    userId: string,
    userEmail: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionData> {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    const expiresAt = now + (this.config.sessionTimeoutMinutes * 60 * 1000);

    const sessionData: SessionData = {
      sessionId,
      userId,
      userEmail,
      userRole,
      createdAt: now,
      lastActivity: now,
      expiresAt,
      ipAddress,
      userAgent,
      isActive: true,
    };

    // Check concurrent sessions limit and cleanup old sessions
    await this.enforceConcurrentSessionsLimit(userId);
    
    // Force cleanup any expired sessions for this user
    await this.cleanupExpiredSessions();

    // Store session in Firebase
    await set(ref(db, `sessions/${sessionId}`), sessionData);

    // Update user's active sessions count
    await this.updateUserSessionCount(userId, 1);

    return sessionData;
  }

  /**
   * Validate and refresh a session
   */
  async validateSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionRef = ref(db, `sessions/${sessionId}`);
      const snapshot = await get(sessionRef);

      if (!snapshot.exists()) {
        return null;
      }

      const sessionData: SessionData = snapshot.val();
      const now = Date.now();

      // Check if session is expired
      if (now > sessionData.expiresAt || !sessionData.isActive) {
        await this.destroySession(sessionId);
        return null;
      }

      // Refresh session activity
      await this.updateSessionActivity(sessionId, now);

      return sessionData;
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  /**
   * Update session activity and extend expiration
   */
  async updateSessionActivity(sessionId: string, timestamp: number = Date.now()): Promise<void> {
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const newExpiresAt = timestamp + (this.config.sessionTimeoutMinutes * 60 * 1000);

    await set(ref(db, `sessions/${sessionId}/lastActivity`), timestamp);
    await set(ref(db, `sessions/${sessionId}/expiresAt`), newExpiresAt);
  }

  /**
   * Destroy a session
   */
  async destroySession(sessionId: string): Promise<void> {
    try {
      const sessionRef = ref(db, `sessions/${sessionId}`);
      const snapshot = await get(sessionRef);

      if (snapshot.exists()) {
        const sessionData: SessionData = snapshot.val();
        
        // Remove session
        await remove(sessionRef);
        
        // Update user's session count
        await this.updateUserSessionCount(sessionData.userId, -1);
        
        // Dispatch session destroyed event for real-time logout
        const event = new CustomEvent('sessionDestroyed', {
          detail: { 
            sessionId, 
            userEmail: sessionData.userEmail,
            userId: sessionData.userId,
            destroyedAt: Date.now()
          }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error destroying session:', error);
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const sessionsRef = ref(db, 'sessions');
      const snapshot = await get(sessionsRef);
      const sessions: SessionData[] = [];

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const sessionData = childSnapshot.val() as SessionData;
          if (sessionData.userId === userId && sessionData.isActive && Date.now() < sessionData.expiresAt) {
            sessions.push(sessionData);
          }
        });
      }

      return sessions;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Get all active sessions (admin function)
   */
  async getAllActiveSessions(): Promise<SessionData[]> {
    try {
      const sessionsRef = ref(db, 'sessions');
      const snapshot = await get(sessionsRef);
      const sessions: SessionData[] = [];

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const sessionData = childSnapshot.val() as SessionData;
          if (sessionData.isActive && Date.now() < sessionData.expiresAt) {
            sessions.push(sessionData);
          }
        });
      }

      return sessions;
    } catch (error) {
      console.error('Error getting all active sessions:', error);
      return [];
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const sessionsRef = ref(db, 'sessions');
      const snapshot = await get(sessionsRef);
      const now = Date.now();
      let cleanedCount = 0;

      if (snapshot.exists()) {
        const cleanupPromises: Promise<void>[] = [];
        const userSessionCounts: { [userId: string]: number } = {};

        snapshot.forEach((childSnapshot) => {
          const sessionData = childSnapshot.val() as SessionData;
          
          if (!sessionData.isActive || now > sessionData.expiresAt) {
            cleanupPromises.push(remove(ref(db, `sessions/${sessionData.sessionId}`)));
            
            // Track session count changes
            if (sessionData.isActive) {
              userSessionCounts[sessionData.userId] = (userSessionCounts[sessionData.userId] || 0) - 1;
            }
            
            // Dispatch session destroyed event for expired sessions
            const event = new CustomEvent('sessionDestroyed', {
              detail: { 
                sessionId: sessionData.sessionId, 
                userEmail: sessionData.userEmail,
                userId: sessionData.userId,
                destroyedAt: Date.now(),
                reason: 'expired'
              }
            });
            window.dispatchEvent(event);
            
            cleanedCount++;
          }
        });

        // Update user session counts
        for (const [userId, countChange] of Object.entries(userSessionCounts)) {
          if (countChange !== 0) {
            await this.updateUserSessionCount(userId, countChange);
          }
        }

        await Promise.all(cleanupPromises);
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Force logout all sessions for a user
   */
  async forceLogoutUser(userId: string): Promise<number> {
    try {
      const userSessions = await this.getUserSessions(userId);
      const logoutPromises = userSessions.map(session => 
        this.destroySession(session.sessionId)
      );

      await Promise.all(logoutPromises);
      return userSessions.length;
    } catch (error) {
      console.error('Error forcing logout for user:', error);
      return 0;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    totalActiveSessions: number;
    uniqueUsers: number;
    averageSessionsPerUser: number;
  }> {
    try {
      const sessions = await this.getAllActiveSessions();
      const uniqueUsers = new Set(sessions.map(s => s.userId)).size;

      return {
        totalActiveSessions: sessions.length,
        uniqueUsers,
        averageSessionsPerUser: uniqueUsers > 0 ? sessions.length / uniqueUsers : 0,
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return {
        totalActiveSessions: 0,
        uniqueUsers: 0,
        averageSessionsPerUser: 0,
      };
    }
  }

  /**
   * Generate a secure session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomPart}`;
  }

  /**
   * Enforce concurrent sessions limit
   */
  private async enforceConcurrentSessionsLimit(userId: string): Promise<void> {
    const userSessions = await this.getUserSessions(userId);
    
    if (userSessions.length >= this.config.maxConcurrentSessions) {
      // Remove oldest session
      const oldestSession = userSessions.sort((a, b) => a.createdAt - b.createdAt)[0];
      await this.destroySession(oldestSession.sessionId);
    }
  }

  /**
   * Update user's session count
   */
  private async updateUserSessionCount(userId: string, change: number): Promise<void> {
    try {
      const userRef = ref(db, `users/${userId}/sessionCount`);
      const snapshot = await get(userRef);
      const currentCount = snapshot.exists() ? snapshot.val() : 0;
      const newCount = Math.max(0, currentCount + change);
      
      await set(userRef, newCount);
    } catch (error) {
      console.error('Error updating user session count:', error);
    }
  }

  /**
   * Start automatic cleanup
   */
  startAutoCleanup(): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        console.error('Error in auto cleanup:', error);
      }
    }, this.config.cleanupIntervalMinutes * 60 * 1000);
  }

  /**
   * Cleanup expired password reset tokens
   */
  async cleanupExpiredPasswordResetTokens(): Promise<number> {
    try {
      // Import here to avoid circular dependency
      const { passwordResetService } = await import('@/lib/services/password-reset.service');
      return await passwordResetService.cleanupExpiredTokens();
    } catch (error) {
      console.error('Error cleaning up expired password reset tokens:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService(); 