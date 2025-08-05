'use client';

import { useEffect, useRef } from 'react';

export function usePerformance() {
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    // Monitor component mount time
    const mountTime = Date.now() - startTime.current;
    
    if (mountTime > 1000) {
      console.warn(`Component took ${mountTime}ms to mount`);
    }

    // Monitor memory usage in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
            console.warn('High memory usage detected:', {
              used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
              total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
            });
          }
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, []);

  return {
    measureTime: (name: string) => {
      const time = Date.now() - startTime.current;
      console.log(`${name} took ${time}ms`);
      return time;
    },
  };
} 