"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LockoutTimerProps {
  lockoutUntil: number;
  onExpired?: () => void;
}

export function LockoutTimer({ lockoutUntil, onExpired }: LockoutTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [initialDuration, setInitialDuration] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const remaining = lockoutUntil - now;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        onExpired?.();
        return;
      }
      
      setTimeLeft(remaining);
    };

    // Set initial duration on first render
    if (initialDuration === 0) {
      setInitialDuration(lockoutUntil - Date.now());
    }

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil, onExpired, initialDuration]);

  if (isExpired) {
    return null;
  }

  // Calculate progress (how much time has elapsed)
  const elapsed = initialDuration - timeLeft;
  const progress = Math.max(0, Math.min(100, (elapsed / initialDuration) * 100));
  
  const minutes = Math.floor(timeLeft / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  const formatTime = () => {
    if (hours > 0) {
      return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${remainingMinutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Account Temporarily Locked
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 mb-6">
            Too many failed login attempts. Please wait before trying again.
          </p>

          {/* Timer Display */}
          <div className="mb-6">
            <div className="text-4xl font-mono font-bold text-red-600 mb-2">
              {formatTime()}
            </div>
            <div className="text-sm text-gray-500">
              Time remaining
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500">
            <p>Your account will be unlocked automatically</p>
            <p>You can try logging in again once the timer expires</p>
          </div>
        </div>
      </div>
    </div>
  );
} 