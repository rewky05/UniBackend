'use client';

import { cn } from '@/lib/utils';

interface ModernSidebarLoaderProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function ModernSidebarLoader({ className, variant = 'light' }: ModernSidebarLoaderProps) {
  const colorClasses = variant === 'light' 
    ? {
        spinner: 'border-t-white'
      }
    : {
        spinner: 'border-t-blue-500'
      };

  return (
    <div className={cn("relative", className)}>
      {/* Blue circular arc loader - matching the specialist data loader style */}
      <div className="relative w-5 h-5">
        {/* Blue spinning arc - no outer ring, just the arc */}
        <div className={cn(
          "absolute inset-0 rounded-full border-2 border-transparent animate-spin",
          colorClasses.spinner
        )}></div>
      </div>
    </div>
  );
}
