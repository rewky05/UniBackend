'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationLoadingProps {
  children: React.ReactNode;
  className?: string;
}

export function NavigationLoading({ children, className }: NavigationLoadingProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Reset loading state when pathname changes
    setIsNavigating(false);
    setLoadingPath(null);
  }, [pathname]);

  const handleNavigation = (href: string) => {
    if (href !== pathname) {
      setIsNavigating(true);
      setLoadingPath(href);
      router.push(href);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {loadingPath ? `Navigating to ${loadingPath.split('/').pop() || 'page'}...` : 'Loading...'}
            </p>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

// Hook to provide navigation loading functionality
export function useNavigationLoading() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const navigateWithLoading = (href: string) => {
    if (href !== pathname) {
      setIsNavigating(true);
      setLoadingPath(href);
      router.push(href);
    }
  };

  const resetLoading = () => {
    setIsNavigating(false);
    setLoadingPath(null);
  };

  // Reset loading state when pathname changes
  useEffect(() => {
    resetLoading();
  }, [pathname]);

  return {
    isNavigating,
    loadingPath,
    navigateWithLoading,
    resetLoading
  };
}
