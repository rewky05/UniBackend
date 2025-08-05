// Security Configuration for Login Attempt Limiting and Captcha
export const SECURITY_CONFIG = {
  // Login Attempt Limiting
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: 3,
    LOCKOUT_DURATIONS: [1, 10, 30, 60, 1440], // Minutes: 1min, 10min, 30min, 1hr, 24hr
    MAX_CONSECUTIVE_LOCKOUTS: 5,
  },
  
  // Captcha Configuration
  CAPTCHA: {
    ENABLED: true,
    TYPE: 'drag-drop', // Future: 'text', 'image', 'audio'
    DIFFICULTY: 'medium', // 'easy', 'medium', 'hard'
    PUZZLE_SIZE: 3, // 3x3 grid
    MIN_DRAG_DISTANCE: 50, // pixels
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
} as const;

// Helper functions for lockout calculations
export const calculateLockoutDuration = (lockoutCount: number): number => {
  const { LOCKOUT_DURATIONS, MAX_CONSECUTIVE_LOCKOUTS } = SECURITY_CONFIG.LOGIN_ATTEMPTS;
  
  // Use the last duration for any lockout count beyond the array length
  const durationIndex = Math.min(lockoutCount - 1, LOCKOUT_DURATIONS.length - 1);
  const durationMinutes = LOCKOUT_DURATIONS[durationIndex];
  
  return durationMinutes * 60 * 1000; // Convert minutes to milliseconds
};

export const isAccountLocked = (lockoutUntil: number | null): boolean => {
  if (!lockoutUntil) return false;
  return Date.now() < lockoutUntil;
};

export const getRemainingLockoutTime = (lockoutUntil: number | null): number => {
  if (!lockoutUntil) return 0;
  return Math.max(0, lockoutUntil - Date.now());
}; 