'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '@/lib/firebase/config';
import { AUTH_CONFIG } from '@/lib/config/auth';
import { SecureSessionStorage, SessionActivityTracker, SessionValidator } from '@/lib/utils/session-storage';
import { authService } from '@/lib/auth/auth.service';

interface User {
  email: string;
  role: 'superadmin' | 'admin';
  isAuthenticated: boolean;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isSuperadmin: () => boolean;
  isAdmin: () => boolean;
  refreshAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSuperadminAuth = () => {
    const storedRole = localStorage.getItem('userRole');
    const storedEmail = localStorage.getItem('userEmail');
    
    if (storedRole === AUTH_CONFIG.ROLES.SUPERADMIN && storedEmail) {
      return {
        email: storedEmail,
        role: 'superadmin' as const,
        isAuthenticated: true,
        firstName: 'Super',
        lastName: 'Admin',
        displayName: 'Super Admin',
      };
    }
    return null;
  };

  const refreshAuthState = () => {
    const superadminUser = checkSuperadminAuth();
    if (superadminUser) {
      setUser(superadminUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase user authenticated - fetch additional user details first
        try {
          const userRef = ref(db, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);
          
          let userDetails = {
            email: firebaseUser.email || '',
            role: 'admin' as const,
            isAuthenticated: true,
            firstName: '',
            lastName: '',
            displayName: firebaseUser.displayName || '',
          };

          if (snapshot.exists()) {
            const userData = snapshot.val();
            userDetails = {
              ...userDetails,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              role: userData.role || 'admin',
            };
          }

          // Set user first, then validate session
          setUser(userDetails);
          
          // For fresh logins, add a grace period before session validation
          const session = SecureSessionStorage.getSession();
          if (session) {
            // Add a small delay to prevent immediate validation conflicts
            setTimeout(async () => {
              const sessionValid = await SessionValidator.validateSession();
              
              if (!sessionValid) {
                // Session is invalid, clear everything
                setUser(null);
                setLoading(false);
                return;
              }
            }, 1000); // 1 second grace period
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching user details:', error);
          setUser(null);
          setLoading(false);
        }
      } else {
        // No Firebase user - check for superadmin
        const superadminUser = checkSuperadminAuth();
        if (superadminUser) {
          setUser(superadminUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen for localStorage changes (for superadmin login)
  useEffect(() => {
    const handleStorageChange = () => {
      const superadminUser = checkSuperadminAuth();
      if (superadminUser) {
        setUser(superadminUser);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for session destruction events (real-time logout)
  useEffect(() => {
    const handleSessionDestroyed = async (event: any) => {
      const { sessionId } = event.detail;
      const currentSessionId = SecureSessionStorage.getSessionId();
      
      // If the destroyed session is the current user's session, log them out
      if (sessionId === currentSessionId) {
        setUser(null);
        setLoading(false);
        
        // Clear session storage
        SecureSessionStorage.clearSession();
        
        // Redirect to login
        window.location.href = '/login';
      }
    };

    window.addEventListener('sessionDestroyed', handleSessionDestroyed);
    return () => window.removeEventListener('sessionDestroyed', handleSessionDestroyed);
  }, []);

  // Periodic session validation (every 30 seconds) - disabled for now to prevent login issues
  // useEffect(() => {
  //   const validateSessionPeriodically = async () => {
  //     if (user && SecureSessionStorage.isSessionActive()) {
  //       const sessionValid = await SessionValidator.validateSession();
  //       if (!sessionValid) {
  //         setUser(null);
  //         setLoading(false);
  //         SecureSessionStorage.clearSession();
  //         window.location.href = '/login';
  //       }
  //     }
  //   };

  //   const interval = setInterval(validateSessionPeriodically, 30000); // 30 seconds
  //   return () => clearInterval(interval);
  // }, [user]);

  const signOut = async () => {
    try {
      // Use authService to properly destroy session
      await authService.signOut();
      
      // Stop activity tracking
      SessionActivityTracker.stopTracking();
      
      // Clear session storage
      SecureSessionStorage.clearSession();
      
      // Firebase sign out
      await firebaseSignOut(auth);
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isSuperadmin = () => {
    return user?.role === 'superadmin';
  };

  const isAdmin = () => {
    return user?.role === 'admin' || user?.role === 'superadmin';
  };

  const value = {
    user,
    loading,
    signOut,
    isSuperadmin,
    isAdmin,
    refreshAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}