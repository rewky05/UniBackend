'use client';

import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { ModernLoadingOverlay } from './modern-loading-overlay';

export function GlobalLoadingOverlay() {
  const { isLoading, loadingMessage } = useGlobalLoading();

  return (
    <ModernLoadingOverlay 
      isLoading={isLoading} 
      message={loadingMessage ?? undefined} 
    />
  );
}
