import { query, orderByChild, equalTo, get, onValue, off } from 'firebase/database';
import { BaseFirebaseService } from './base.service';
import type { 
  Feedback, 
  CreateFeedbackDto, 
  UpdateFeedbackDto, 
  FeedbackFilters,
  FeedbackStatus,
  CreateActivityLogDto
} from '@/lib/types';

export class FeedbackService extends BaseFirebaseService<Feedback> {
  constructor() {
    super('feedback');
  }

  /**
   * Create new feedback
   */
  async createFeedback(feedbackData: CreateFeedbackDto): Promise<string> {
    try {
      return await this.create({
        ...feedbackData,
        status: 'pending',
        tags: feedbackData.tags || [],
        isAnonymous: feedbackData.isAnonymous || false
      });
    } catch (error) {
      this.handleError('createFeedback', error);
    }
  }

  /**
   * Update feedback status with review notes
   */
  async updateFeedbackStatus(
    feedbackId: string,
    status: FeedbackStatus,
    reviewedBy?: string,
    reviewNotes?: string
  ): Promise<void> {
    try {
      const updates: UpdateFeedbackDto = {
        status,
        reviewedBy,
        reviewedAt: Date.now(),
        reviewNotes
      };

      await this.update(feedbackId, updates);

      // Log the activity
      if (reviewedBy) {
        await this.logActivity({
          userId: reviewedBy,
          userEmail: '',
          action: `Feedback status changed to ${status}`,
          category: 'feedback',
          targetId: feedbackId,
          targetType: 'feedback',
          details: {
            newStatus: status,
            reviewNotes: reviewNotes || ''
          }
        });
      }
    } catch (error) {
      this.handleError('updateFeedbackStatus', error);
    }
  }

  /**
   * Get feedback by doctor ID
   */
  async getFeedbackByDoctor(doctorId: string): Promise<Feedback[]> {
    try {
      const doctorQuery = query(
        this.collectionRef,
        orderByChild('doctorId'),
        equalTo(doctorId)
      );

      const snapshot = await get(doctorQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const feedback = Object.values(snapshot.val()) as Feedback[];
      return feedback.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      this.handleError('getFeedbackByDoctor', error);
    }
  }

  /**
   * Subscribe to feedback by doctor ID (real-time)
   */
  subscribeToFeedbackByDoctor(
    doctorId: string,
    callback: (feedback: Feedback[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const doctorQuery = query(
      this.collectionRef,
      orderByChild('doctorId'),
      equalTo(doctorId)
    );

    const unsubscribe = onValue(
      doctorQuery,
      (snapshot) => {
        try {
          const data = snapshot.val();
          const feedback = data ? Object.values(data) as Feedback[] : [];
          const sortedFeedback = feedback.sort((a, b) => b.createdAt - a.createdAt);
          callback(sortedFeedback);
        } catch (error) {
          onError(new Error(`Failed to process doctor feedback: ${error.message}`));
        }
      },
      (error) => {
        onError(new Error(`Doctor feedback subscription failed: ${error.message}`));
      }
    );
    
    return () => off(doctorQuery, 'value', unsubscribe);
  }

  /**
   * Get feedback by clinic ID
   */
  async getFeedbackByClinic(clinicId: string): Promise<Feedback[]> {
    try {
      const clinicQuery = query(
        this.collectionRef,
        orderByChild('clinicId'),
        equalTo(clinicId)
      );

      const snapshot = await get(clinicQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const feedback = Object.values(snapshot.val()) as Feedback[];
      return feedback.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      this.handleError('getFeedbackByClinic', error);
    }
  }

  /**
   * Get feedback by status
   */
  async getFeedbackByStatus(status: FeedbackStatus): Promise<Feedback[]> {
    try {
      const statusQuery = query(
        this.collectionRef,
        orderByChild('status'),
        equalTo(status)
      );

      const snapshot = await get(statusQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const feedback = Object.values(snapshot.val()) as Feedback[];
      return feedback.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      this.handleError('getFeedbackByStatus', error);
    }
  }

  /**
   * Subscribe to feedback by status (real-time)
   */
  subscribeToFeedbackByStatus(
    status: FeedbackStatus,
    callback: (feedback: Feedback[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.subscribeByField('status', status, callback, onError);
  }

  /**
   * Get feedback by rating
   */
  async getFeedbackByRating(rating: 1 | 2 | 3 | 4 | 5): Promise<Feedback[]> {
    try {
      const ratingQuery = query(
        this.collectionRef,
        orderByChild('rating'),
        equalTo(rating)
      );

      const snapshot = await get(ratingQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const feedback = Object.values(snapshot.val()) as Feedback[];
      return feedback.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      this.handleError('getFeedbackByRating', error);
    }
  }

  /**
   * Search feedback with multiple filters
   */
  async searchFeedback(filters: FeedbackFilters): Promise<Feedback[]> {
    try {
      // Get all feedback first (Firebase Realtime DB doesn't support complex queries)
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      let feedback = Object.values(snapshot.val()) as Feedback[];

      // Apply filters
      if (filters.status) {
        feedback = feedback.filter(f => f.status === filters.status);
      }

      if (filters.rating) {
        feedback = feedback.filter(f => f.rating === filters.rating);
      }

      if (filters.doctorId) {
        feedback = feedback.filter(f => f.doctorId === filters.doctorId);
      }

      if (filters.clinicId) {
        feedback = feedback.filter(f => f.clinicId === filters.clinicId);
      }

      if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start).getTime();
        const endDate = new Date(filters.dateRange.end).getTime();
        feedback = feedback.filter(f => 
          f.createdAt >= startDate && f.createdAt <= endDate
        );
      }

      return feedback.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      this.handleError('searchFeedback', error);
    }
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(): Promise<{
    total: number;
    pending: number;
    reviewed: number;
    flagged: number;
    archived: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    byStatus: Record<FeedbackStatus, number>;
  }> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return {
          total: 0,
          pending: 0,
          reviewed: 0,
          flagged: 0,
          archived: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          byStatus: { pending: 0, reviewed: 0, flagged: 0, archived: 0 }
        };
      }

      const feedbackList = Object.values(snapshot.val()) as Feedback[];
      const stats = {
        total: feedbackList.length,
        pending: 0,
        reviewed: 0,
        flagged: 0,
        archived: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        byStatus: { pending: 0, reviewed: 0, flagged: 0, archived: 0 } as Record<FeedbackStatus, number>
      };

      let totalRating = 0;

      feedbackList.forEach(feedback => {
        // Count by status
        stats.byStatus[feedback.status]++;
        stats[feedback.status]++;

        // Count by rating
        stats.ratingDistribution[feedback.rating]++;
        totalRating += feedback.rating;
      });

      // Calculate average rating
      stats.averageRating = feedbackList.length > 0 ? totalRating / feedbackList.length : 0;

      return stats;
    } catch (error) {
      this.handleError('getFeedbackStats', error);
    }
  }

  /**
   * Get doctor's average rating
   */
  async getDoctorAverageRating(doctorId: string): Promise<{
    averageRating: number;
    totalFeedback: number;
    ratingDistribution: Record<number, number>;
  }> {
    try {
      const feedback = await this.getFeedbackByDoctor(doctorId);

      if (feedback.length === 0) {
        return {
          averageRating: 0,
          totalFeedback: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRating = 0;

      feedback.forEach(f => {
        ratingDistribution[f.rating]++;
        totalRating += f.rating;
      });

      return {
        averageRating: totalRating / feedback.length,
        totalFeedback: feedback.length,
        ratingDistribution
      };
    } catch (error) {
      this.handleError('getDoctorAverageRating', error);
    }
  }

  /**
   * Get clinic's average rating
   */
  async getClinicAverageRating(clinicId: string): Promise<{
    averageRating: number;
    totalFeedback: number;
    ratingDistribution: Record<number, number>;
  }> {
    try {
      const feedback = await this.getFeedbackByClinic(clinicId);

      if (feedback.length === 0) {
        return {
          averageRating: 0,
          totalFeedback: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRating = 0;

      feedback.forEach(f => {
        ratingDistribution[f.rating]++;
        totalRating += f.rating;
      });

      return {
        averageRating: totalRating / feedback.length,
        totalFeedback: feedback.length,
        ratingDistribution
      };
    } catch (error) {
      this.handleError('getClinicAverageRating', error);
    }
  }

  /**
   * Get all clinics with their average ratings
   */
  async getClinicsWithRatings(): Promise<{
    clinicId: string;
    clinicName: string;
    averageRating: number;
    totalFeedback: number;
  }[]> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const feedback = Object.values(snapshot.val()) as Feedback[];
      
      // Group feedback by clinic
      const clinicGroups = feedback.reduce((acc, f) => {
        if (!acc[f.clinicId]) {
          acc[f.clinicId] = {
            clinicId: f.clinicId,
            clinicName: f.clinicName || 'Unknown Clinic',
            ratings: [],
            totalRating: 0
          };
        }
        acc[f.clinicId].ratings.push(f.rating);
        acc[f.clinicId].totalRating += f.rating;
        return acc;
      }, {} as Record<string, { clinicId: string; clinicName: string; ratings: number[]; totalRating: number }>);

      // Calculate average ratings for each clinic
      return Object.values(clinicGroups).map(clinic => ({
        clinicId: clinic.clinicId,
        clinicName: clinic.clinicName,
        averageRating: clinic.totalRating / clinic.ratings.length,
        totalFeedback: clinic.ratings.length
      }));
    } catch (error) {
      this.handleError('getClinicsWithRatings', error);
    }
  }

  /**
   * Get recent feedback
   */
  async getRecentFeedback(limit: number = 10): Promise<Feedback[]> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const feedback = Object.values(snapshot.val()) as Feedback[];
      
      // Sort by createdAt descending and limit
      return feedback
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
    } catch (error) {
      this.handleError('getRecentFeedback', error);
    }
  }

  /**
   * Subscribe to recent feedback (real-time)
   */
  subscribeToRecentFeedback(
    limit: number = 10,
    callback: (feedback: Feedback[]) => void,
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

          const feedback = Object.values(data) as Feedback[];
          const recentFeedback = feedback
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
          
          callback(recentFeedback);
        } catch (error) {
          onError(new Error(`Failed to process recent feedback: ${error.message}`));
        }
      },
      (error) => {
        onError(new Error(`Recent feedback subscription failed: ${error.message}`));
      }
    );
    
    return () => off(this.collectionRef, 'value', unsubscribe);
  }

  /**
   * Get flagged feedback that needs attention
   */
  async getFlaggedFeedback(): Promise<Feedback[]> {
    return this.getFeedbackByStatus('flagged');
  }

  /**
   * Subscribe to flagged feedback (real-time)
   */
  subscribeToFlaggedFeedback(
    callback: (feedback: Feedback[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.subscribeToFeedbackByStatus('flagged', callback, onError);
  }

  /**
   * Bulk update feedback status
   */
  async bulkUpdateFeedbackStatus(
    feedbackIds: string[],
    status: FeedbackStatus,
    reviewedBy?: string,
    reviewNotes?: string
  ): Promise<void> {
    try {
      const updatePromises = feedbackIds.map(feedbackId => 
        this.updateFeedbackStatus(feedbackId, status, reviewedBy, reviewNotes)
      );

      await Promise.all(updatePromises);

      // Log bulk activity
      if (reviewedBy) {
        await this.logActivity({
          userId: reviewedBy,
          userEmail: '',
          action: `Bulk feedback status update to ${status}`,
          category: 'feedback',
          details: {
            feedbackIds,
            newStatus: status,
            count: feedbackIds.length,
            reviewNotes: reviewNotes || ''
          }
        });
      }
    } catch (error) {
      this.handleError('bulkUpdateFeedbackStatus', error);
    }
  }

  /**
   * Get trending feedback tags
   */
  async getTrendingTags(limit: number = 10): Promise<{ tag: string; count: number }[]> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const feedback = Object.values(snapshot.val()) as Feedback[];
      const tagCounts: Record<string, number> = {};

      // Count all tags
      feedback.forEach(f => {
        f.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      // Sort by count and return top tags
      return Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      this.handleError('getTrendingTags', error);
    }
  }

  /**
   * Archive old feedback
   */
  async archiveOldFeedback(daysOld: number = 365, archivedBy?: string): Promise<number> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return 0;
      }

      const feedback = Object.values(snapshot.val()) as Feedback[];
      const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      
      const oldFeedback = feedback.filter(f => 
        f.createdAt < cutoffDate && f.status !== 'archived'
      );

      if (oldFeedback.length === 0) {
        return 0;
      }

      // Update all old feedback to archived status
      const updatePromises = oldFeedback.map(f => 
        this.update(f.id, { status: 'archived' })
      );

      await Promise.all(updatePromises);

      // Log the bulk archive activity
      if (archivedBy) {
        await this.logActivity({
          userId: archivedBy,
          userEmail: '',
          action: `Bulk archived ${oldFeedback.length} old feedback items`,
          category: 'system',
          details: {
            count: oldFeedback.length,
            daysOld,
            feedbackIds: oldFeedback.map(f => f.id)
          }
        });
      }

      return oldFeedback.length;
    } catch (error) {
      this.handleError('archiveOldFeedback', error);
    }
  }

  /**
   * Private method to log activities
   */
  private async logActivity(activityData: CreateActivityLogDto): Promise<void> {
    try {
      // Import ActivityLogsService to avoid circular dependencies
      const { ActivityLogsService } = await import('./activity-logs.service');
      const activityService = new ActivityLogsService();
      await activityService.create(activityData);
    } catch (error) {
      // Don't throw error for logging failures, just log it
      console.error('Failed to log activity:', error);
    }
  }
}

// Export singleton instance
export const feedbackService = new FeedbackService();