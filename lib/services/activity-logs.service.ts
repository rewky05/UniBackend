import { query, orderByChild, equalTo, get, onValue, off, limitToLast } from 'firebase/database';
import { BaseFirebaseService } from './base.service';
import { safeGetTimestamp } from '@/lib/utils';
import type { 
  ActivityLog, 
  CreateActivityLogDto, 
  ActivityLogFilters,
  ActivityCategory
} from '@/lib/types';

export class ActivityLogsService extends BaseFirebaseService<ActivityLog> {
  constructor() {
    super('activity-logs');
  }

  /**
   * Create new activity log
   */
  async createActivityLog(activityData: CreateActivityLogDto): Promise<string> {
    try {
      return await this.create(activityData);
    } catch (error) {
      this.handleError('createActivityLog', error);
    }
  }

  /**
   * Get activity logs by user ID
   */
  async getActivityLogsByUser(userId: string): Promise<ActivityLog[]> {
    try {
      const userQuery = query(
        this.collectionRef,
        orderByChild('userId'),
        equalTo(userId)
      );

      const snapshot = await get(userQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const logs = Object.values(snapshot.val()) as ActivityLog[];
      return logs.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      this.handleError('getActivityLogsByUser', error);
    }
  }

  /**
   * Subscribe to activity logs by user ID (real-time)
   */
  subscribeToActivityLogsByUser(
    userId: string,
    callback: (logs: ActivityLog[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const userQuery = query(
      this.collectionRef,
      orderByChild('userId'),
      equalTo(userId)
    );

    const unsubscribe = onValue(
      userQuery,
      (snapshot) => {
        try {
          const data = snapshot.val();
          const logs = data ? Object.values(data) as ActivityLog[] : [];
          const sortedLogs = logs.sort((a, b) => b.createdAt - a.createdAt);
          callback(sortedLogs);
        } catch (error) {
          onError(new Error(`Failed to process user activity logs: ${error.message}`));
        }
      },
      (error) => {
        onError(new Error(`User activity logs subscription failed: ${error.message}`));
      }
    );
    
    return () => off(userQuery, 'value', unsubscribe);
  }

  /**
   * Get activity logs by category
   */
  async getActivityLogsByCategory(category: ActivityCategory): Promise<ActivityLog[]> {
    try {
      const categoryQuery = query(
        this.collectionRef,
        orderByChild('category'),
        equalTo(category)
      );

      const snapshot = await get(categoryQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const logs = Object.values(snapshot.val()) as ActivityLog[];
      return logs.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      this.handleError('getActivityLogsByCategory', error);
    }
  }

  /**
   * Subscribe to activity logs by category (real-time)
   */
  subscribeToActivityLogsByCategory(
    category: ActivityCategory,
    callback: (logs: ActivityLog[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.subscribeByField('category', category, callback, onError);
  }

  /**
   * Get activity logs for a specific target
   */
  async getActivityLogsForTarget(targetId: string, targetType: string): Promise<ActivityLog[]> {
    try {
      // Firebase Realtime DB doesn't support compound queries, so we filter in memory
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const logs = Object.values(snapshot.val()) as ActivityLog[];
      
      return logs
        .filter(log => log.targetId === targetId && log.targetType === targetType)
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      this.handleError('getActivityLogsForTarget', error);
    }
  }

  /**
   * Search activity logs with multiple filters
   */
  async searchActivityLogs(filters: ActivityLogFilters): Promise<ActivityLog[]> {
    try {
      // Get all logs first (Firebase Realtime DB doesn't support complex queries)
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      let logs = Object.values(snapshot.val()) as ActivityLog[];

      // Apply filters
      if (filters.category) {
        logs = logs.filter(log => log.category === filters.category);
      }

      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }

      if (filters.targetType) {
        logs = logs.filter(log => log.targetType === filters.targetType);
      }

      if (filters.dateRange) {
        const startDate = safeGetTimestamp(filters.dateRange.start);
        const endDate = safeGetTimestamp(filters.dateRange.end) || Date.now();
        logs = logs.filter(log => 
          log.createdAt >= startDate && log.createdAt <= endDate
        );
      }

      return logs.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      this.handleError('searchActivityLogs', error);
    }
  }

  /**
   * Get recent activity logs
   */
  async getRecentActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const logs = Object.values(snapshot.val()) as ActivityLog[];
      
      // Sort by createdAt descending and limit
      return logs
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
    } catch (error) {
      this.handleError('getRecentActivityLogs', error);
    }
  }

  /**
   * Subscribe to recent activity logs (real-time)
   */
  subscribeToRecentActivityLogs(
    limit: number = 50,
    callback: (logs: ActivityLog[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const unsubscribe = onValue(
      this.collectionRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          if (!data) {
            callback([]);
            return;
          }

          const logs = Object.values(data) as ActivityLog[];
          const recentLogs = logs
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
          
          callback(recentLogs);
        } catch (error) {
          onError(new Error(`Failed to process recent activity logs: ${error.message}`));
        }
      },
      (error) => {
        onError(new Error(`Recent activity logs subscription failed: ${error.message}`));
      }
    );
    
    return () => off(this.collectionRef, 'value', unsubscribe);
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(): Promise<{
    total: number;
    byCategory: Record<ActivityCategory, number>;
    byUser: Record<string, number>;
    byTargetType: Record<string, number>;
    todayCount: number;
    weekCount: number;
    monthCount: number;
  }> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return {
          total: 0,
          byCategory: {
            verification: 0,
            schedule: 0,
            document: 0,
            profile: 0,
            system: 0,
            feedback: 0
          },
          byUser: {},
          byTargetType: {},
          todayCount: 0,
          weekCount: 0,
          monthCount: 0
        };
      }

      const logs = Object.values(snapshot.val()) as ActivityLog[];
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

      const stats = {
        total: logs.length,
        byCategory: {
          verification: 0,
          schedule: 0,
          document: 0,
          profile: 0,
          system: 0,
          feedback: 0
        } as Record<ActivityCategory, number>,
        byUser: {} as Record<string, number>,
        byTargetType: {} as Record<string, number>,
        todayCount: 0,
        weekCount: 0,
        monthCount: 0
      };

      logs.forEach(log => {
        // Count by category
        stats.byCategory[log.category]++;

        // Count by user
        if (!stats.byUser[log.userEmail]) {
          stats.byUser[log.userEmail] = 0;
        }
        stats.byUser[log.userEmail]++;

        // Count by target type
        if (log.targetType) {
          if (!stats.byTargetType[log.targetType]) {
            stats.byTargetType[log.targetType] = 0;
          }
          stats.byTargetType[log.targetType]++;
        }

        // Count by time periods
        if (log.createdAt >= oneDayAgo) {
          stats.todayCount++;
        }
        if (log.createdAt >= oneWeekAgo) {
          stats.weekCount++;
        }
        if (log.createdAt >= oneMonthAgo) {
          stats.monthCount++;
        }
      });

      return stats;
    } catch (error) {
      this.handleError('getActivityStats', error);
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string): Promise<{
    totalActivities: number;
    byCategory: Record<ActivityCategory, number>;
    recentActivities: ActivityLog[];
    firstActivity?: Date;
    lastActivity?: Date;
  }> {
    try {
      const userLogs = await this.getActivityLogsByUser(userId);

      if (userLogs.length === 0) {
        return {
          totalActivities: 0,
          byCategory: {
            verification: 0,
            schedule: 0,
            document: 0,
            profile: 0,
            system: 0,
            feedback: 0
          },
          recentActivities: []
        };
      }

      const byCategory = {
        verification: 0,
        schedule: 0,
        document: 0,
        profile: 0,
        system: 0,
        feedback: 0
      } as Record<ActivityCategory, number>;

      userLogs.forEach(log => {
        byCategory[log.category]++;
      });

      return {
        totalActivities: userLogs.length,
        byCategory,
        recentActivities: userLogs.slice(0, 10),
        firstActivity: new Date(userLogs[userLogs.length - 1].createdAt),
        lastActivity: new Date(userLogs[0].createdAt)
      };
    } catch (error) {
      this.handleError('getUserActivitySummary', error);
    }
  }

  /**
   * Clean up old activity logs
   */
  async cleanupOldLogs(daysToKeep: number = 90, cleanedBy?: string): Promise<number> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return 0;
      }

      const logs = Object.values(snapshot.val()) as ActivityLog[];
      const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      
      const oldLogs = logs.filter(log => log.createdAt < cutoffDate);

      if (oldLogs.length === 0) {
        return 0;
      }

      // Delete old logs
      const deletePromises = oldLogs.map(log => this.delete(log.id));
      await Promise.all(deletePromises);

      // Log the cleanup activity
      if (cleanedBy) {
        await this.create({
          userId: cleanedBy,
          userEmail: '',
          action: `Cleaned up ${oldLogs.length} old activity logs`,
          category: 'system',
          details: {
            count: oldLogs.length,
            daysToKeep,
            cutoffDate: new Date(cutoffDate).toISOString()
          }
        });
      }

      return oldLogs.length;
    } catch (error) {
      this.handleError('cleanupOldLogs', error);
    }
  }

  /**
   * Get most active users
   */
  async getMostActiveUsers(limit: number = 10): Promise<{ userEmail: string; count: number }[]> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const logs = Object.values(snapshot.val()) as ActivityLog[];
      const userCounts: Record<string, number> = {};

      // Count activities per user
      logs.forEach(log => {
        userCounts[log.userEmail] = (userCounts[log.userEmail] || 0) + 1;
      });

      // Sort by count and return top users
      return Object.entries(userCounts)
        .map(([userEmail, count]) => ({ userEmail, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      this.handleError('getMostActiveUsers', error);
    }
  }

  /**
   * Get activity timeline for a specific period
   */
  async getActivityTimeline(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' = 'day'
  ): Promise<{ period: string; count: number }[]> {
    try {
      const logs = await this.searchActivityLogs({
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      });

      const timeline: Record<string, number> = {};

      logs.forEach(log => {
        const date = new Date(log.createdAt);
        let periodKey: string;

        switch (granularity) {
          case 'hour':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
            break;
          case 'week':
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            periodKey = startOfWeek.toISOString().split('T')[0];
            break;
          case 'day':
          default:
            periodKey = date.toISOString().split('T')[0];
            break;
        }

        timeline[periodKey] = (timeline[periodKey] || 0) + 1;
      });

      return Object.entries(timeline)
        .map(([period, count]) => ({ period, count }))
        .sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      this.handleError('getActivityTimeline', error);
    }
  }
}

// Export singleton instance
export const activityLogsService = new ActivityLogsService();