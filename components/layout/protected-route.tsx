'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-states';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperadmin?: boolean;
}

export function ProtectedRoute({ children, requireSuperadmin = false }: ProtectedRouteProps) {
  const { user, loading, isSuperadmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requireSuperadmin && !isSuperadmin()) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, requireSuperadmin, isSuperadmin, router]);

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