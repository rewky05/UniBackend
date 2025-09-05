import { ref, push, set, get, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import { BaseFirebaseService } from './base.service';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'referral' | 'appointment' | 'fee_change' | 'verification' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  timestamp: number;
  expiresAt: number;
  relatedId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: 'referral' | 'appointment' | 'fee_change' | 'verification' | 'system';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  relatedId?: string;
  expiresInDays?: number;
}

export class NotificationsService {
  private collectionName = 'notifications';

  constructor() {
    // No super call needed
  }

  /**
   * Handle errors consistently
   */
  private handleError(operation: string, error: any): void {
    console.error(`❌ [NotificationsService] Error in ${operation}:`, error);
    throw new Error(`Failed to ${operation}: ${error.message || error}`);
  }

  /**
   * Create a new notification for a specific user
   */
  async createNotification(data: CreateNotificationDto): Promise<string> {
    try {
      const now = Date.now();
      const expiresInDays = data.expiresInDays || 30; // Default 30 days
      const expiresAt = now + (expiresInDays * 24 * 60 * 60 * 1000);

      const notificationData: Omit<Notification, 'id'> = {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || 'medium',
        read: false,
        timestamp: now,
        expiresAt,
        ...(data.relatedId && { relatedId: data.relatedId }),
        createdAt: now,
        updatedAt: now
      };

      // Create notification under the user's UID
      const userNotificationsRef = ref(db, `notifications/${data.userId}`);
      const newNotificationRef = push(userNotificationsRef);
      const notificationId = newNotificationRef.key!;

      const notification: Notification = {
        ...notificationData,
        id: notificationId
      };

      await set(newNotificationRef, notification);

      console.log('🔔 [NotificationsService] Notification created:', {
        notificationId,
        userId: data.userId,
        type: data.type,
        title: data.title
      });

      return notificationId;
    } catch (error) {
      this.handleError('createNotification', error);
      throw error;
    }
  }

  /**
   * Create a fee change notification for a doctor
   */
  async createFeeChangeNotification(
    doctorId: string,
    status: 'approved' | 'rejected',
    previousFee: number,
    requestedFee: number,
    reviewNotes?: string
  ): Promise<string> {
    const isApproved = status === 'approved';
    const feeChange = requestedFee - previousFee;
    const feeChangeText = feeChange > 0 ? `increased by ₱${feeChange.toLocaleString()}` : 
                         feeChange < 0 ? `decreased by ₱${Math.abs(feeChange).toLocaleString()}` : 
                         'unchanged';

    const title = isApproved ? 'Fee Change Approved' : 'Fee Change Rejected';
    const message = isApproved 
      ? `Your professional fee change request has been approved. Your fee has been ${feeChangeText} from ₱${previousFee.toLocaleString()} to ₱${requestedFee.toLocaleString()}.`
      : `Your professional fee change request has been rejected. Your fee remains at ₱${previousFee.toLocaleString()}.${reviewNotes ? ` Reason: ${reviewNotes}` : ''}`;

    return this.createNotification({
      userId: doctorId,
      title,
      message,
      type: 'fee_change',
      priority: isApproved ? 'medium' : 'high',
      relatedId: doctorId,
      expiresInDays: 30
    });
  }

  /**
   * Get notifications for a specific user
   */
  async getUserNotifications(userId: string, limit?: number): Promise<Notification[]> {
    try {
      const userNotificationsRef = ref(db, `notifications/${userId}`);
      const snapshot = await get(userNotificationsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const notifications: Notification[] = [];
      snapshot.forEach((childSnapshot) => {
        const notification = childSnapshot.val() as Notification;
        // Only return non-expired notifications
        if (notification.expiresAt > Date.now()) {
          notifications.push(notification);
        }
      });

      // Sort by timestamp (newest first)
      notifications.sort((a, b) => b.timestamp - a.timestamp);

      return limit ? notifications.slice(0, limit) : notifications;
    } catch (error) {
      this.handleError('getUserNotifications', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const notificationRef = ref(db, `notifications/${userId}/${notificationId}`);
      const snapshot = await get(notificationRef);
      
      if (!snapshot.exists()) {
        throw new Error('Notification not found');
      }
      
      const notification = snapshot.val() as Notification;
      const updates = { read: true, updatedAt: Date.now() };
      await set(notificationRef, { ...notification, ...updates });
    } catch (error) {
      this.handleError('markAsRead', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const userNotificationsRef = ref(db, `notifications/${userId}`);
      const snapshot = await get(userNotificationsRef);
      
      if (!snapshot.exists()) {
        return;
      }

      const updates: Record<string, any> = {};
      snapshot.forEach((childSnapshot) => {
        updates[`${childSnapshot.key}/read`] = true;
        updates[`${childSnapshot.key}/updatedAt`] = Date.now();
      });

      await set(userNotificationsRef, updates);
    } catch (error) {
      this.handleError('markAllAsRead', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      const notificationRef = ref(db, `notifications/${userId}/${notificationId}`);
      await set(notificationRef, null);
    } catch (error) {
      this.handleError('deleteNotification', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const notifications = await this.getUserNotifications(userId);
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      this.handleError('getUnreadCount', error);
      throw error;
    }
  }

  /**
   * Subscribe to user notifications
   */
  subscribeToUserNotifications(
    userId: string,
    onUpdate: (notifications: Notification[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const userNotificationsRef = ref(db, `notifications/${userId}`);
    
    const unsubscribe = onValue(
      userNotificationsRef,
      (snapshot) => {
        try {
          if (!snapshot.exists()) {
            onUpdate([]);
            return;
          }

          const notifications: Notification[] = [];
          snapshot.forEach((childSnapshot) => {
            const notification = childSnapshot.val() as Notification;
            // Only include non-expired notifications
            if (notification.expiresAt > Date.now()) {
              notifications.push(notification);
            }
          });

          // Sort by timestamp (newest first)
          notifications.sort((a, b) => b.timestamp - a.timestamp);
          onUpdate(notifications);
        } catch (error) {
          onError(error as Error);
        }
      },
      (error) => {
        onError(error);
      }
    );

    return unsubscribe;
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const notificationsRef = ref(db, 'notifications');
      const snapshot = await get(notificationsRef);
      
      if (!snapshot.exists()) {
        return;
      }

      const now = Date.now();
      const updates: Record<string, any> = {};

      snapshot.forEach((userSnapshot) => {
        userSnapshot.forEach((notificationSnapshot) => {
          const notification = notificationSnapshot.val() as Notification;
          if (notification.expiresAt <= now) {
            updates[`${userSnapshot.key}/${notificationSnapshot.key}`] = null;
          }
        });
      });

      if (Object.keys(updates).length > 0) {
        await set(notificationsRef, updates);
        console.log('🧹 [NotificationsService] Cleaned up expired notifications');
      }
    } catch (error) {
      this.handleError('cleanupExpiredNotifications', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationsService = new NotificationsService();
