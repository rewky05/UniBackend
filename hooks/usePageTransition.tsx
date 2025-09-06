'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from './useGlobalLoading';

interface UsePageTransitionOptions {
  loadingMessage?: string;
  delay?: number;
}

export function usePageTransition(options: UsePageTransitionOptions = {}) {
  const { loadingMessage = 'Loading...', delay = 0 } = options;
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const router = useRouter();
  const { showLoading, hideLoading } = useGlobalLoading();

  const navigateWithTransition = useCallback(async (path: string) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setTargetPath(path);
    showLoading(loadingMessage);

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      router.push(path);
    } catch (error) {
      console.error('Navigation error:', error);
      setIsTransitioning(false);
      setTargetPath(null);
      hideLoading();
    }
  }, [isTransitioning, loadingMessage, delay, router, showLoading, hideLoading]);

  const resetTransition = useCallback(() => {
    setIsTransitioning(false);
    setTargetPath(null);
    hideLoading();
  }, [hideLoading]);

  return {
    isTransitioning,
    targetPath,
    navigateWithTransition,
    resetTransition,
  };
}
