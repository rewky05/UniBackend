'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { useRouter } from 'next/navigation';
import { usePageTransition } from '@/hooks/usePageTransition';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';

export default function TestPage() {
  const { user, loading, isSuperadmin, isAdmin } = useAuth();
  const router = useRouter();
  const { navigateWithTransition, isTransitioning } = usePageTransition({
    loadingMessage: 'Navigating...',
    delay: 500, // Add a small delay to demonstrate loading
  });
  const { isSubmitting, submitForm } = useFormSubmission({
    loadingMessage: 'Processing...',
    successMessage: 'Action completed!',
  });
  const { showLoading, hideLoading } = useGlobalLoading();

  const goToDashboard = () => {
    navigateWithTransition('/dashboard');
  };

  const goToLogin = () => {
    navigateWithTransition('/login');
  };

  const handleTestAction = async () => {
    await submitForm(async () => {
      // Simulate an async operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Test action completed');
    });
  };

  const handleGlobalLoading = () => {
    showLoading('Testing global loading...');
    setTimeout(() => {
      hideLoading();
    }, 3000);
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
          
          <div className="space-y-2">
            <div className="flex space-x-2">
              <LoadingButton 
                onClick={goToDashboard} 
                disabled={!user || isTransitioning}
                loading={isTransitioning}
                loadingText="Navigating..."
              >
                Go to Dashboard
              </LoadingButton>
              <LoadingButton 
                onClick={goToLogin} 
                variant="outline"
                disabled={isTransitioning}
                loading={isTransitioning}
                loadingText="Navigating..."
              >
                Go to Login
              </LoadingButton>
            </div>
            
            <div className="flex space-x-2">
              <LoadingButton 
                onClick={handleTestAction}
                disabled={isSubmitting}
                loading={isSubmitting}
                loadingText="Processing..."
                variant="secondary"
              >
                Test Form Action
              </LoadingButton>
              <Button 
                onClick={handleGlobalLoading}
                variant="outline"
              >
                Test Global Loading
              </Button>
            </div>
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