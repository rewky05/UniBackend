import { useState, useEffect, useCallback } from 'react';
import { doctorsService } from '@/lib/services/doctors.service';
import { feedbackService } from '@/lib/services/feedback.service';
import { activityLogsService } from '@/lib/services/activity-logs.service';
import { clinicsService } from '@/lib/services/schedules.service';
import type { 
  Doctor, 
  Feedback, 
  ActivityLog, 
  Clinic,
  DashboardStats 
} from '@/lib/types';

// Comprehensive dashboard hook that provides all dashboard data
export function useDashboard() {
  const [dashboardData, setDashboardData] = useState<{
    stats: DashboardStats;
    recentDoctors: Doctor[];
    recentFeedback: Feedback[];
    recentActivity: ActivityLog[];
    pendingDoctors: Doctor[];
    flaggedFeedback: Feedback[];
    expiringLicenses: Doctor[];
    clinicStats: {
      total: number;
      active: number;
      byType: Record<string, number>;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel for better performance
      const [
        doctorStats,
        feedbackStats,
        activityStats,
        clinicStatsData,
        recentDoctors,
        recentFeedback,
        recentActivity,
        pendingDoctors,
        flaggedFeedback,
        expiringLicenses
      ] = await Promise.all([
        doctorsService.getDoctorStats(),
        feedbackService.getFeedbackStats(),
        activityLogsService.getActivityStats(),
        clinicsService.getClinicStats(),
        doctorsService.getRecentDoctors(5),
        feedbackService.getRecentFeedback(5),
        activityLogsService.getRecentActivityLogs(10),
        doctorsService.getDoctorsByStatus('pending'),
        feedbackService.getFeedbackByStatus('flagged'),
        doctorsService.getDoctorsWithExpiringLicenses(30)
      ]);

      // Combine stats into dashboard format
      const combinedStats: DashboardStats = {
        totalDoctors: doctorStats.total,
        verifiedDoctors: doctorStats.verified,
        pendingVerification: doctorStats.pending,
        suspendedDoctors: doctorStats.suspended,
        totalFeedback: feedbackStats.total,
        averageRating: feedbackStats.averageRating,
        pendingFeedback: feedbackStats.pending,
        flaggedFeedback: feedbackStats.flagged,
        totalClinics: clinicStatsData.total,
        activeClinics: clinicStatsData.active
      };

      setDashboardData({
        stats: combinedStats,
        recentDoctors,
        recentFeedback,
        recentActivity,
        pendingDoctors,
        flaggedFeedback,
        expiringLicenses,
        clinicStats: {
          total: clinicStatsData.total,
          active: clinicStatsData.active,
          byType: clinicStatsData.byType
        }
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    refresh: fetchDashboardData
  };
}

// Hook for real-time dashboard updates (subscribes to key metrics)
export function useRealtimeDashboard() {
  const [realtimeData, setRealtimeData] = useState<{
    recentDoctors: Doctor[];
    recentFeedback: Feedback[];
    recentActivity: ActivityLog[];
    pendingDoctors: Doctor[];
    flaggedFeedback: Feedback[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up real-time subscriptions
    const unsubscribeRecentDoctors = doctorsService.subscribeToRecentDoctors(
      5,
      (doctors) => {
        setRealtimeData(prev => ({
          ...prev!,
          recentDoctors: doctors
        }));
        setLoading(false);
      },
      (err) => setError(err.message)
    );

    const unsubscribeRecentFeedback = feedbackService.subscribeToRecentFeedback(
      5,
      (feedback) => {
        setRealtimeData(prev => ({
          ...prev!,
          recentFeedback: feedback
        }));
      },
      (err) => setError(err.message)
    );

    const unsubscribeRecentActivity = activityLogsService.subscribeToRecentActivityLogs(
      10,
      (logs) => {
        setRealtimeData(prev => ({
          ...prev!,
          recentActivity: logs
        }));
      },
      (err) => setError(err.message)
    );

    const unsubscribePendingDoctors = doctorsService.subscribeToDoctorsByStatus(
      'pending',
      (doctors) => {
        setRealtimeData(prev => ({
          ...prev!,
          pendingDoctors: doctors
        }));
      },
      (err) => setError(err.message)
    );

    const unsubscribeFlaggedFeedback = feedbackService.subscribeToFlaggedFeedback(
      (feedback) => {
        setRealtimeData(prev => ({
          ...prev!,
          flaggedFeedback: feedback
        }));
      },
      (err) => setError(err.message)
    );

    // Initialize with empty data
    setRealtimeData({
      recentDoctors: [],
      recentFeedback: [],
      recentActivity: [],
      pendingDoctors: [],
      flaggedFeedback: []
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeRecentDoctors();
      unsubscribeRecentFeedback();
      unsubscribeRecentActivity();
      unsubscribePendingDoctors();
      unsubscribeFlaggedFeedback();
    };
  }, []);

  return {
    realtimeData,
    loading,
    error
  };
}

// Hook for dashboard statistics with real-time updates
export function useDashboardStats() {
  const [stats, setStats] = useState<{
    doctors: {
      total: number;
      verified: number;
      pending: number;
      suspended: number;
      bySpecialty: Record<string, number>;
    };
    feedback: {
      total: number;
      averageRating: number;
      pending: number;
      flagged: number;
      ratingDistribution: Record<number, number>;
    };
    activity: {
      todayCount: number;
      weekCount: number;
      monthCount: number;
      byCategory: Record<string, number>;
    };
    clinics: {
      total: number;
      active: number;
      byType: Record<string, number>;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [doctorStats, feedbackStats, activityStats, clinicStats] = await Promise.all([
        doctorsService.getDoctorStats(),
        feedbackService.getFeedbackStats(),
        activityLogsService.getActivityStats(),
        clinicsService.getClinicStats()
      ]);

      setStats({
        doctors: doctorStats,
        feedback: feedbackStats,
        activity: activityStats,
        clinics: clinicStats
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  };
}

// Hook for dashboard alerts and notifications
export function useDashboardAlerts() {
  const [alerts, setAlerts] = useState<{
    expiringLicenses: Doctor[];
    pendingVerifications: Doctor[];
    flaggedFeedback: Feedback[];
    systemIssues: string[];
  }>({
    expiringLicenses: [],
    pendingVerifications: [],
    flaggedFeedback: [],
    systemIssues: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [expiringLicenses, pendingVerifications, flaggedFeedback] = await Promise.all([
        doctorsService.getDoctorsWithExpiringLicenses(30),
        doctorsService.getDoctorsByStatus('pending'),
        feedbackService.getFeedbackByStatus('flagged')
      ]);

      // Check for system issues
      const systemIssues: string[] = [];
      
      if (expiringLicenses.length > 0) {
        systemIssues.push(`${expiringLicenses.length} doctor licenses expiring within 30 days`);
      }
      
      if (pendingVerifications.length > 10) {
        systemIssues.push(`${pendingVerifications.length} doctors pending verification`);
      }
      
      if (flaggedFeedback.length > 5) {
        systemIssues.push(`${flaggedFeedback.length} feedback items flagged for review`);
      }

      setAlerts({
        expiringLicenses,
        pendingVerifications,
        flaggedFeedback,
        systemIssues
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    
    // Refresh alerts every 10 minutes
    const interval = setInterval(fetchAlerts, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const dismissAlert = useCallback((alertType: keyof typeof alerts, itemId?: string) => {
    setAlerts(prev => {
      const newAlerts = { ...prev };
      
      if (itemId) {
        // Remove specific item from alert array
        newAlerts[alertType] = (newAlerts[alertType] as any[]).filter(
          (item: any) => item.id !== itemId
        );
      } else {
        // Clear entire alert category
        if (alertType === 'systemIssues') {
          newAlerts.systemIssues = [];
        } else {
          (newAlerts[alertType] as any[]) = [];
        }
      }
      
      return newAlerts;
    });
  }, []);

  return {
    alerts,
    loading,
    error,
    refresh: fetchAlerts,
    dismissAlert,
    totalAlerts: alerts.expiringLicenses.length + 
                 alerts.pendingVerifications.length + 
                 alerts.flaggedFeedback.length + 
                 alerts.systemIssues.length
  };
}

// Hook for dashboard performance metrics
export function useDashboardPerformance() {
  const [performance, setPerformance] = useState<{
    averageResponseTime: number;
    systemLoad: number;
    activeUsers: number;
    errorRate: number;
    uptime: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get activity stats to calculate performance metrics
      const activityStats = await activityLogsService.getActivityStats();
      const mostActiveUsers = await activityLogsService.getMostActiveUsers(10);

      // Calculate mock performance metrics based on activity
      const performance = {
        averageResponseTime: Math.random() * 200 + 50, // 50-250ms
        systemLoad: Math.min(activityStats.todayCount / 100, 1), // 0-1 based on activity
        activeUsers: mostActiveUsers.length,
        errorRate: Math.random() * 0.05, // 0-5% error rate
        uptime: 99.9 // Mock uptime percentage
      };

      setPerformance(performance);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformance();
    
    // Refresh performance metrics every 2 minutes
    const interval = setInterval(fetchPerformance, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchPerformance]);

  return {
    performance,
    loading,
    error,
    refresh: fetchPerformance
  };
}