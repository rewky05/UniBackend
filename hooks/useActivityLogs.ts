import { useState, useEffect, useCallback } from 'react';
import { activityLogsService } from '@/lib/services/activity-logs.service';
import type { 
  ActivityLog, 
  CreateActivityLogDto, 
  ActivityLogFilters,
  ActivityCategory 
} from '@/lib/types';

// Hook for getting recent activity logs with real-time updates
export function useRecentActivityLogs(limit: number = 50) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = activityLogsService.subscribeToRecentActivityLogs(
      limit,
      (logsData) => {
        setLogs(logsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [limit]);

  return { 
    logs, 
    loading, 
    error 
  };
}

// Hook for getting activity logs by user ID with real-time updates
export function useActivityLogsByUser(userId: string | null) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const unsubscribe = activityLogsService.subscribeToActivityLogsByUser(
      userId,
      (logsData) => {
        setLogs(logsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  return { 
    logs, 
    loading, 
    error, 
    count: logs.length 
  };
}

// Hook for getting activity logs by category with real-time updates
export function useActivityLogsByCategory(category: ActivityCategory) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = activityLogsService.subscribeToActivityLogsByCategory(
      category,
      (logsData) => {
        setLogs(logsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [category]);

  return { 
    logs, 
    loading, 
    error, 
    count: logs.length 
  };
}

// Hook for searching activity logs with filters
export function useActivityLogSearch() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchLogs = useCallback(async (filters: ActivityLogFilters) => {
    setLoading(true);
    setError(null);

    try {
      const results = await activityLogsService.searchActivityLogs(filters);
      setLogs(results);
    } catch (err: any) {
      setError(err.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setLogs([]);
    setError(null);
  }, []);

  return {
    logs,
    loading,
    error,
    searchLogs,
    clearSearch,
    hasResults: logs.length > 0
  };
}

// Hook for activity statistics
export function useActivityStats() {
  const [stats, setStats] = useState<{
    total: number;
    byCategory: Record<ActivityCategory, number>;
    byUser: Record<string, number>;
    byTargetType: Record<string, number>;
    todayCount: number;
    weekCount: number;
    monthCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const statsData = await activityLogsService.getActivityStats();
      setStats(statsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  };
}

// Hook for user activity summary
export function useUserActivitySummary(userId: string | null) {
  const [summary, setSummary] = useState<{
    totalActivities: number;
    byCategory: Record<ActivityCategory, number>;
    recentActivities: ActivityLog[];
    firstActivity?: Date;
    lastActivity?: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!userId) {
      setSummary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const summaryData = await activityLogsService.getUserActivitySummary(userId);
      setSummary(summaryData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refresh: fetchSummary
  };
}

// Hook for most active users
export function useMostActiveUsers(limit: number = 10) {
  const [users, setUsers] = useState<{ userEmail: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMostActiveUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const usersData = await activityLogsService.getMostActiveUsers(limit);
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchMostActiveUsers();
  }, [fetchMostActiveUsers]);

  return {
    users,
    loading,
    error,
    refresh: fetchMostActiveUsers
  };
}

// Hook for activity timeline
export function useActivityTimeline() {
  const [timeline, setTimeline] = useState<{ period: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async (
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' = 'day'
  ) => {
    setLoading(true);
    setError(null);

    try {
      const timelineData = await activityLogsService.getActivityTimeline(startDate, endDate, granularity);
      setTimeline(timelineData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearTimeline = useCallback(() => {
    setTimeline([]);
    setError(null);
  }, []);

  return {
    timeline,
    loading,
    error,
    fetchTimeline,
    clearTimeline
  };
}

// Hook for activity logs for a specific target
export function useActivityLogsForTarget(targetId: string | null, targetType: string | null) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogsForTarget = useCallback(async () => {
    if (!targetId || !targetType) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const logsData = await activityLogsService.getActivityLogsForTarget(targetId, targetType);
      setLogs(logsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType]);

  useEffect(() => {
    fetchLogsForTarget();
  }, [fetchLogsForTarget]);

  return {
    logs,
    loading,
    error,
    refresh: fetchLogsForTarget,
    count: logs.length
  };
}

// Hook for activity log CRUD operations
export function useActivityLogActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createActivityLog = useCallback(async (activityData: CreateActivityLogDto) => {
    setLoading(true);
    setError(null);

    try {
      const logId = await activityLogsService.createActivityLog(activityData);
      return logId;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cleanupOldLogs = useCallback(async (daysToKeep: number = 90, cleanedBy?: string) => {
    setLoading(true);
    setError(null);

    try {
      const deletedCount = await activityLogsService.cleanupOldLogs(daysToKeep, cleanedBy);
      return deletedCount;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createActivityLog,
    cleanupOldLogs,
    loading,
    error,
    clearError
  };
}