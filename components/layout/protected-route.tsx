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
    // Only proceed when loading is complete
    if (!loading) {
      if (!user) {
        console.log('No user found, redirecting to login');
        // Use a longer delay to ensure auth state is stable
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      } else if (requireSuperadmin && !isSuperadmin()) {
        console.log('User is not superadmin, redirecting to dashboard');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      }
    }
  }, [user, loading, requireSuperadmin, isSuperadmin]);

  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user) {
    return null;
  }

  if (requireSuperadmin && !isSuperadmin()) {
    return null;
  }

  return <>{children}</>;
} 