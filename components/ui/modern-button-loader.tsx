'use client';

import { cn } from '@/lib/utils';

interface ModernButtonLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ModernButtonLoader({ className, size = 'md' }: ModernButtonLoaderProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Blue arc loader - matching the specialist data loader style */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin"></div>
    </div>
  );
}
