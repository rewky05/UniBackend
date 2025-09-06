'use client';

import { cn } from '@/lib/utils';

interface ModernLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export function ModernLoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  className 
}: ModernLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-white/80 backdrop-blur-sm",
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        {/* Simple blue circular arc loader - no card */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"></div>
        </div>
        
        {/* Loading Text - only show if message is provided */}
        {message && (
          <p className="text-gray-600 text-sm font-medium text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

// Compact version for smaller overlays
export function CompactModernLoading({ 
  isLoading, 
  message = 'Loading...', 
  className 
}: ModernLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-white/80 backdrop-blur-sm",
      className
    )}>
      <div className="flex items-center space-x-3">
        {/* Compact Spinner - Blue arc style */}
        <div className="relative">
          <div className="w-6 h-6 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"></div>
        </div>
        
        {/* Loading Text - only show if message is provided */}
        {message && (
          <p className="text-gray-600 text-sm font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
