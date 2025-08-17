import { useState, useEffect, useCallback } from 'react';
import { feedbackService } from '@/lib/services/feedback.service';
import type { 
  Feedback, 
  CreateFeedbackDto, 
  UpdateFeedbackDto, 
  FeedbackFilters,
  FeedbackStatus 
} from '@/lib/types';

// Hook for getting all feedback with real-time updates
export function useFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = feedbackService.subscribeToAll(
      (feedbackData) => {
        setFeedback(feedbackData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { 
    feedback, 
    loading, 
    error, 
    total: feedback.length 
  };
}

// Hook for getting feedback by doctor ID with real-time updates
export function useFeedbackByDoctor(doctorId: string | null) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorId) {
      setFeedback([]);
      setLoading(false);
      return;
    }

    const unsubscribe = feedbackService.subscribeToFeedbackByDoctor(
      doctorId,
      (feedbackData) => {
        setFeedback(feedbackData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [doctorId]);

  return { 
    feedback, 
    loading, 
    error, 
    count: feedback.length 
  };
}

// Hook for getting feedback by status with real-time updates
export function useFeedbackByStatus(status: FeedbackStatus) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = feedbackService.subscribeToFeedbackByStatus(
      status,
      (feedbackData) => {
        setFeedback(feedbackData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [status]);

  return { 
    feedback, 
    loading, 
    error, 
    count: feedback.length 
  };
}

// Hook for recent feedback with real-time updates
export function useRecentFeedback(limit: number = 10) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = feedbackService.subscribeToRecentFeedback(
      limit,
      (feedbackData) => {
        setFeedback(feedbackData);
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
    feedback, 
    loading, 
    error 
  };
}

// Hook for flagged feedback with real-time updates
export function useFlaggedFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = feedbackService.subscribeToFlaggedFeedback(
      (feedbackData) => {
        setFeedback(feedbackData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { 
    feedback, 
    loading, 
    error, 
    count: feedback.length 
  };
}

// Hook for searching feedback with filters
export function useFeedbackSearch() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFeedback = useCallback(async (filters: FeedbackFilters) => {
    setLoading(true);
    setError(null);

    try {
      const results = await feedbackService.searchFeedback(filters);
      setFeedback(results);
    } catch (err: any) {
      setError(err.message);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setFeedback([]);
    setError(null);
  }, []);

  return {
    feedback,
    loading,
    error,
    searchFeedback,
    clearSearch,
    hasResults: feedback.length > 0
  };
}

// Hook for feedback statistics
export function useFeedbackStats() {
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    reviewed: number;
    flagged: number;
    archived: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    byStatus: Record<FeedbackStatus, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const statsData = await feedbackService.getFeedbackStats();
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

// Hook for doctor's average rating
export function useDoctorRating(doctorId: string | null) {
  const [rating, setRating] = useState<{
    averageRating: number;
    totalFeedback: number;
    ratingDistribution: Record<number, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRating = useCallback(async () => {
    if (!doctorId) {
      setRating(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ratingData = await feedbackService.getDoctorAverageRating(doctorId);
      setRating(ratingData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  return {
    rating,
    loading,
    error,
    refresh: fetchRating
  };
}

// Hook for clinic's average rating
export function useClinicRating(clinicId: string | null) {
  const [rating, setRating] = useState<{
    averageRating: number;
    totalFeedback: number;
    ratingDistribution: Record<number, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRating = useCallback(async () => {
    if (!clinicId) {
      setRating(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ratingData = await feedbackService.getClinicAverageRating(clinicId);
      setRating(ratingData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  return {
    rating,
    loading,
    error,
    refresh: fetchRating
  };
}

// Hook for all clinics with ratings
export function useClinicsWithRatings() {
  const [clinics, setClinics] = useState<{
    clinicId: string;
    clinicName: string;
    averageRating: number;
    totalFeedback: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClinics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const clinicsData = await feedbackService.getClinicsWithRatings();
      setClinics(clinicsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  return {
    clinics,
    loading,
    error,
    refresh: fetchClinics
  };
}

// Hook for trending feedback tags
export function useTrendingTags(limit: number = 10) {
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendingTags = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const tagsData = await feedbackService.getTrendingTags(limit);
      setTags(tagsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTrendingTags();
  }, [fetchTrendingTags]);

  return {
    tags,
    loading,
    error,
    refresh: fetchTrendingTags
  };
}

// Hook for feedback CRUD operations
export function useFeedbackActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFeedback = useCallback(async (feedbackData: CreateFeedbackDto) => {
    setLoading(true);
    setError(null);

    try {
      const feedbackId = await feedbackService.createFeedback(feedbackData);
      return feedbackId;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFeedbackStatus = useCallback(async (
    feedbackId: string,
    status: FeedbackStatus,
    reviewedBy?: string,
    reviewedById?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      await feedbackService.updateFeedbackStatus(feedbackId, status, reviewedBy, reviewedById);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateFeedbackStatus = useCallback(async (
    feedbackIds: string[],
    status: FeedbackStatus,
    reviewedBy?: string,
    reviewedById?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      await feedbackService.bulkUpdateFeedbackStatus(feedbackIds, status, reviewedBy, reviewedById);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const archiveOldFeedback = useCallback(async (daysOld: number = 365, archivedBy?: string) => {
    setLoading(true);
    setError(null);

    try {
      const archivedCount = await feedbackService.archiveOldFeedback(daysOld, archivedBy);
      return archivedCount;
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
    createFeedback,
    updateFeedbackStatus,
    bulkUpdateFeedbackStatus,
    archiveOldFeedback,
    loading,
    error,
    clearError
  };
}