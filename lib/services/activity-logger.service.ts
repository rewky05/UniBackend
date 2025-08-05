import { ref, push, set } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import type { ActivityLog } from '@/lib/types/database';

export class ActivityLoggerService {
  private static instance: ActivityLoggerService;

  private constructor() {}

  public static getInstance(): ActivityLoggerService {
    if (!ActivityLoggerService.instance) {
      ActivityLoggerService.instance = new ActivityLoggerService();
    }
    return ActivityLoggerService.instance;
  }

  /**
   * Log an activity to Firebase
   */
  async logActivity(data: {
    action: string;
    adminUserId: string;
    adminEmail: string;
    targetType: 'doctor' | 'clinic' | 'feedback' | 'appointment' | 'patient' | 'system';
    targetId: string;
    targetName: string;
    details: Record<string, any>;
  }): Promise<void> {
    try {
      const activityLog: ActivityLog = {
        timestamp: new Date().toISOString(),
        action: data.action,
        adminUserId: data.adminUserId,
        adminEmail: data.adminEmail,
        targetType: data.targetType,
        targetId: data.targetId,
        targetName: data.targetName,
        details: data.details,
      };

      // Create a new activity log entry in Firebase
      const activityRef = ref(db, 'adminActivityLogs');
      const newActivityRef = push(activityRef);
      await set(newActivityRef, activityLog);

      console.log('Activity logged successfully:', activityLog);
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error to prevent breaking the main operation
    }
  }

  /**
   * Log doctor verification activity
   */
  async logDoctorVerification(
    doctorId: string,
    doctorName: string,
    adminUserId: string,
    adminEmail: string,
    newStatus: string,
    notes?: string
  ): Promise<void> {
    await this.logActivity({
      action: 'doctor_verified',
      adminUserId,
      adminEmail,
      targetType: 'doctor',
      targetId: doctorId,
      targetName: doctorName,
      details: {
        newStatus,
        notes,
        verificationDate: new Date().toISOString(),
      },
    });
  }

  /**
   * Log doctor addition activity
   */
  async logDoctorAdded(
    doctorId: string,
    doctorName: string,
    adminUserId: string,
    adminEmail: string,
    specialty: string
  ): Promise<void> {
    await this.logActivity({
      action: 'doctor_added',
      adminUserId,
      adminEmail,
      targetType: 'doctor',
      targetId: doctorId,
      targetName: doctorName,
      details: {
        specialty,
        isSpecialist: true,
        addedDate: new Date().toISOString(),
      },
    });
  }

  /**
   * Log doctor profile update activity
   */
  async logDoctorUpdated(
    doctorId: string,
    doctorName: string,
    adminUserId: string,
    adminEmail: string,
    updatedFields: string[]
  ): Promise<void> {
    await this.logActivity({
      action: 'doctor_updated',
      adminUserId,
      adminEmail,
      targetType: 'doctor',
      targetId: doctorId,
      targetName: doctorName,
      details: {
        updatedFields,
        updateDate: new Date().toISOString(),
      },
    });
  }

  /**
   * Log feedback review activity
   */
  async logFeedbackReviewed(
    feedbackId: string,
    patientName: string,
    adminUserId: string,
    adminEmail: string,
    action: 'approved' | 'flagged' | 'rejected'
  ): Promise<void> {
    await this.logActivity({
      action: 'feedback_reviewed',
      adminUserId,
      adminEmail,
      targetType: 'feedback',
      targetId: feedbackId,
      targetName: patientName,
      details: {
        reviewAction: action,
        reviewDate: new Date().toISOString(),
      },
    });
  }

  /**
   * Log system settings change activity
   */
  async logSettingsChanged(
    settingName: string,
    adminUserId: string,
    adminEmail: string,
    oldValue: any,
    newValue: any
  ): Promise<void> {
    await this.logActivity({
      action: 'settings_changed',
      adminUserId,
      adminEmail,
      targetType: 'system',
      targetId: 'settings',
      targetName: settingName,
      details: {
        settingName,
        oldValue,
        newValue,
        changeDate: new Date().toISOString(),
      },
    });
  }

  /**
   * Log user role change activity
   */
  async logUserRoleChanged(
    userId: string,
    userName: string,
    adminUserId: string,
    adminEmail: string,
    oldRole: string,
    newRole: string
  ): Promise<void> {
    await this.logActivity({
      action: 'user_role_changed',
      adminUserId,
      adminEmail,
      targetType: 'system',
      targetId: userId,
      targetName: userName,
      details: {
        oldRole,
        newRole,
        changeDate: new Date().toISOString(),
      },
    });
  }
}

// Export singleton instance
export const activityLogger = ActivityLoggerService.getInstance(); 