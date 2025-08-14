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
    
    // Only return superadmin user if both role and email are present
    if (storedRole === AUTH_CONFIG.ROLES.SUPERADMIN && storedEmail) {
      console.log('Superadmin auth check: Found stored credentials');
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
    console.log('useAuth: Setting up Firebase auth state listener');
    
    // Ensure Firebase persistence is set to local
    const setupPersistence = async () => {
      try {
        const { setPersistence, browserLocalPersistence } = await import('firebase/auth');
        await setPersistence(auth, browserLocalPersistence);
        console.log('Firebase persistence set to local');
      } catch (error) {
        console.error('Error setting Firebase persistence:', error);
      }
    };
    
    // Test database connection
    const testDatabaseConnection = async () => {
      try {
        const testRef = ref(db, 'test-connection');
        await get(testRef);
        console.log('Firebase database connection test successful');
      } catch (error) {
        console.error('Firebase database connection test failed:', error);
      }
    };
    
    setupPersistence();
    testDatabaseConnection();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        console.log('Firebase auth state changed:', firebaseUser?.email);
        
        if (firebaseUser) {
          // Firebase user authenticated - fetch additional user details
          try {
            console.log('Fetching user data from database for UID:', firebaseUser.uid);
            const userRef = ref(db, `users/${firebaseUser.uid}`);
            console.log('Database reference path:', `users/${firebaseUser.uid}`);
            
            const snapshot = await get(userRef);
            console.log('Database snapshot exists:', snapshot.exists());
            console.log('Database snapshot value:', snapshot.val());
            
            let userDetails = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'admin' as const,
              isAuthenticated: true,
              firstName: '',
              lastName: '',
              displayName: firebaseUser.displayName || '',
            };

            if (snapshot.exists()) {
              const userData = snapshot.val();
              console.log('User data from database:', userData);
              userDetails = {
                ...userDetails,
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                role: userData.role || 'admin',
              };
            } else {
              console.log('No user data found in database, using Firebase defaults');
            }

            console.log('Final user details:', userDetails);
            setUser(userDetails);
            setLoading(false);
          } catch (dbError) {
            console.error('Error fetching user data from database:', dbError);
            // Still set the user with basic info from Firebase
            const userDetails = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'admin' as const,
              isAuthenticated: true,
              firstName: '',
              lastName: '',
              displayName: firebaseUser.displayName || '',
            };
            console.log('Setting user details (fallback):', userDetails);
            setUser(userDetails);
            setLoading(false);
          }
        } else {
          // No Firebase user - check for superadmin (but only if no Firebase user exists)
          console.log('No Firebase user found, checking for superadmin');
          const superadminUser = checkSuperadminAuth();
          if (superadminUser) {
            console.log('Setting superadmin user:', superadminUser);
            setUser(superadminUser);
            setLoading(false);
          } else {
            console.log('No user found, setting null');
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
        setLoading(false);
      }
    });

    // Don't check for superadmin on initial load if we're waiting for Firebase
    // This prevents conflicts between Firebase and superadmin auth
    setLoading(true);

    return () => {
      console.log('useAuth: Cleaning up Firebase auth state listener');
      unsubscribe();
    };
  }, []);

  // Monitor user state changes for debugging
  useEffect(() => {
    console.log('useAuth: User state changed:', user);
    console.log('useAuth: Loading state:', loading);
  }, [user, loading]);

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
      
      // Clear the server session cookie
      try {
        await fetch('/api/signout', { 
          method: 'POST',
          credentials: 'include' // Include cookies
        });
      } catch (cookieError) {
        console.error('Failed to clear session cookie:', cookieError);
      }
      
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