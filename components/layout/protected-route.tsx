'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-states';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperadmin?: boolean;
}

export function ProtectedRoute({ children, requireSuperadmin = false }: ProtectedRouteProps) {
  const { user, loading, isSuperadmin } = useAuth();

  useEffect(() => {
    console.log('ProtectedRoute - loading:', loading, 'user:', user?.email, 'requireSuperadmin:', requireSuperadmin);
    
    // Only proceed when loading is complete
    if (!loading) {
      if (!user) {
        console.log('No user found, redirecting to login');
        // Use a longer delay to ensure auth state is stable
        setTimeout(() => {
          console.log('Executing redirect to login');
          window.location.href = '/login';
        }, 500);
      } else if (requireSuperadmin && !isSuperadmin()) {
        console.log('User is not superadmin, redirecting to dashboard');
        setTimeout(() => {
          console.log('Executing redirect to dashboard (not superadmin)');
          window.location.href = '/dashboard';
        }, 500);
      } else {
        console.log('User authenticated successfully, allowing access');
      }
    } else {
      console.log('ProtectedRoute - still loading, waiting...');
    }
  }, [user, loading, requireSuperadmin, isSuperadmin]);

  // Show loading state while authentication is being determined
  if (loading) {
    console.log('ProtectedRoute - showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user) {
    console.log('ProtectedRoute - no user, not rendering (will redirect)');
    return null;
  }

  if (requireSuperadmin && !isSuperadmin()) {
    console.log('ProtectedRoute - user not superadmin, not rendering (will redirect)');
    return null;
  }

  console.log('ProtectedRoute - user authenticated, rendering children');
  return <>{children}</>;
} 