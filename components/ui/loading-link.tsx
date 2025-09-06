'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingLinkProps extends React.ComponentProps<typeof Link> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
}

export const LoadingLink = React.forwardRef<HTMLAnchorElement, LoadingLinkProps>(
  ({ loading = false, loadingText, children, className, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === props.href;

    return (
      <Link
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center transition-colors",
          loading && "pointer-events-none opacity-50",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {/* {loadingText || 'Loading...'} */}
          </>
        ) : (
          children
        )}
      </Link>
    );
  }
);

LoadingLink.displayName = 'LoadingLink';

// Hook for managing link loading states
export function useLinkLoading() {
  const [loadingLinks, setLoadingLinks] = React.useState<Set<string>>(new Set());

  const setLinkLoading = (href: string, loading: boolean) => {
    setLoadingLinks(prev => {
      const newSet = new Set(prev);
      if (loading) {
        newSet.add(href);
      } else {
        newSet.delete(href);
      }
      return newSet;
    });
  };

  const isLinkLoading = (href: string) => loadingLinks.has(href);

  return {
    setLinkLoading,
    isLinkLoading,
    loadingLinks
  };
}
