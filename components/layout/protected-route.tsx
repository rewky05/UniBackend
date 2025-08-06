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
    
    if (!loading) {
      if (!user) {
        console.log('No user found, redirecting to login');
        // Add a small delay to prevent race conditions
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      } else if (requireSuperadmin && !isSuperadmin()) {
        console.log('User is not superadmin, redirecting to dashboard');
        window.location.href = '/dashboard';
      } else {
        console.log('User authenticated successfully');
      }
    }
  }, [user, loading, requireSuperadmin, isSuperadmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (requireSuperadmin && !isSuperadmin()) {
    return null; // Will redirect to dashboard
  }

  return <>{children}</>;
} 