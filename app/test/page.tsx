'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function TestPage() {
  const { user, loading, isSuperadmin, isAdmin } = useAuth();
  const router = useRouter();

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  const goToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Test Page</CardTitle>
          <CardDescription>Testing authentication state and routing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Loading:</strong> {loading ? 'true' : 'false'}
            </div>
            <div className="text-sm">
              <strong>User:</strong> {user ? user.email : 'null'}
            </div>
            <div className="text-sm">
              <strong>Role:</strong> {user?.role || 'null'}
            </div>
            <div className="text-sm">
              <strong>Authenticated:</strong> {user?.isAuthenticated ? 'true' : 'false'}
            </div>
            <div className="text-sm">
              <strong>Is Admin:</strong> {isAdmin() ? 'true' : 'false'}
            </div>
            <div className="text-sm">
              <strong>Is Superadmin:</strong> {isSuperadmin() ? 'true' : 'false'}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={goToDashboard} disabled={!user}>
              Go to Dashboard
            </Button>
            <Button onClick={goToLogin} variant="outline">
              Go to Login
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>Current path: {typeof window !== 'undefined' ? window.location.pathname : 'server'}</p>
            <p>Firebase user: {typeof window !== 'undefined' && (window as any).firebase?.auth?.currentUser?.email || 'null'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}