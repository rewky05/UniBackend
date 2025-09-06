'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useGlobalLoading } from './useGlobalLoading';

interface UseNavigationLoadingOptions {
  loadingMessage?: string;
  delay?: number;
}

export function useNavigationLoading(options: UseNavigationLoadingOptions = {}) {
  const { loadingMessage = 'Loading...', delay = 800 } = options;
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { showLoading, hideLoading } = useGlobalLoading();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navigateWithLoading = useCallback((href: string, customMessage?: string) => {
    if (href === pathname || isNavigating) return; // Don't navigate if already on the same page or already navigating
    
    setIsNavigating(true);
    setLoadingPath(href);
    showLoading(customMessage || loadingMessage);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Navigate immediately
    router.push(href);
  }, [pathname, isNavigating, router, showLoading, loadingMessage]);

  // Hide loading when pathname changes and we've reached the target
  useEffect(() => {
    if (loadingPath && pathname === loadingPath && isNavigating) {
      // Wait for the page to fully load before hiding loading
      timeoutRef.current = setTimeout(() => {
        setLoadingPath(null);
        setIsNavigating(false);
        hideLoading();
      }, delay);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [pathname, loadingPath, isNavigating, hideLoading, delay]);

  // Fallback to hide loading after timeout
  useEffect(() => {
    if (loadingPath && isNavigating) {
      const fallbackTimeout = setTimeout(() => {
        setLoadingPath(null);
        setIsNavigating(false);
        hideLoading();
      }, 10000); // 10 second timeout

      return () => clearTimeout(fallbackTimeout);
    }
  }, [loadingPath, isNavigating, hideLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isNavigating,
    loadingPath,
    navigateWithLoading,
  };
}
