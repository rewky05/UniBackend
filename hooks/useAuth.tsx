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
      try {
        console.log('Firebase auth state changed:', firebaseUser?.email);
        
        if (firebaseUser) {
          // Firebase user authenticated - fetch additional user details
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

          console.log('Setting user details:', userDetails);
          setUser(userDetails);
          setLoading(false);
        } else {
          // No Firebase user - check for superadmin
          const superadminUser = checkSuperadminAuth();
          if (superadminUser) {
            console.log('Setting superadmin user:', superadminUser);
            setUser(superadminUser);
          } else {
            console.log('No user found, setting null');
            setUser(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
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