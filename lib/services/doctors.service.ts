import { query, orderByChild, equalTo, get, onValue, off } from 'firebase/database';
import { BaseFirebaseService } from './base.service';
import type { 
  Doctor, 
  CreateDoctorDto, 
  UpdateDoctorDto, 
  DoctorFilters,
  DoctorStatus,
  ActivityLog,
  CreateActivityLogDto
} from '@/lib/types';

export class DoctorsService extends BaseFirebaseService<Doctor> {
  constructor() {
    super('doctors');
  }

  /**
   * Create a new doctor with activity logging
   */
  async createDoctor(doctorData: CreateDoctorDto, createdBy?: string): Promise<string> {
    try {
      const doctorId = await this.create({
        ...doctorData,
        status: 'pending',
        isActive: true
      });

      // Log the activity
      if (createdBy) {
        await this.logActivity({
          userId: createdBy,
          userEmail: '', // You might want to pass this as well
          action: 'Doctor created',
          category: 'profile',
          targetId: doctorId,
          targetType: 'doctor',
          details: {
            doctorName: `${doctorData.firstName} ${doctorData.lastName}`,
            specialty: doctorData.specialty
          }
        });
      }

      return doctorId;
    } catch (error) {
      this.handleError('createDoctor', error);
    }
  }

  /**
   * Update doctor status with activity logging
   */
  async updateDoctorStatus(
    doctorId: string, 
    status: DoctorStatus, 
    verifiedBy?: string,
    notes?: string
  ): Promise<void> {
    try {
      const updates: UpdateDoctorDto = {
        status,
        verificationDate: status === 'verified' ? Date.now() : undefined,
        verifiedBy: status === 'verified' ? verifiedBy : undefined
      };

      await this.update(doctorId, updates);

      // Log the activity
      if (verifiedBy) {
        await this.logActivity({
          userId: verifiedBy,
          userEmail: verifiedBy, // Using verifiedBy as both userId and userEmail
          action: `Doctor status changed to ${status}`,
          category: 'verification',
          targetId: doctorId,
          targetType: 'doctor',
          details: {
            newStatus: status,
            notes: notes || ''
          }
        });
      }
    } catch (error) {
      this.handleError('updateDoctorStatus', error);
    }
  }

  /**
   * Get doctors by status
   */
  async getDoctorsByStatus(status: DoctorStatus): Promise<Doctor[]> {
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

      return Object.values(snapshot.val()) as Doctor[];
    } catch (error) {
      this.handleError('getDoctorsByStatus', error);
    }
  }

  /**
   * Subscribe to doctors by status (real-time)
   */
  subscribeToDoctorsByStatus(
    status: DoctorStatus,
    callback: (doctors: Doctor[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.subscribeByField('status', status, callback, onError);
  }

  /**
   * Get doctors by specialty
   */
  async getDoctorsBySpecialty(specialty: string): Promise<Doctor[]> {
    try {
      const specialtyQuery = query(
        this.collectionRef,
        orderByChild('specialty'),
        equalTo(specialty)
      );

      const snapshot = await get(specialtyQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      return Object.values(snapshot.val()) as Doctor[];
    } catch (error) {
      this.handleError('getDoctorsBySpecialty', error);
    }
  }

  /**
   * Subscribe to doctors by specialty (real-time)
   */
  subscribeToDoctorsBySpecialty(
    specialty: string,
    callback: (doctors: Doctor[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.subscribeByField('specialty', specialty, callback, onError);
  }

  /**
   * Search doctors with multiple filters
   */
  async searchDoctors(filters: DoctorFilters): Promise<Doctor[]> {
    try {
      // Get all doctors first (Firebase Realtime DB doesn't support complex queries)
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      let doctors = Object.values(snapshot.val()) as Doctor[];

      // Apply filters
      if (filters.status) {
        doctors = doctors.filter(doctor => doctor.status === filters.status);
      }

      if (filters.specialty) {
        doctors = doctors.filter(doctor => 
          doctor.specialty.toLowerCase().includes(filters.specialty!.toLowerCase())
        );
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        doctors = doctors.filter(doctor => 
          doctor.firstName.toLowerCase().includes(searchTerm) ||
          doctor.lastName.toLowerCase().includes(searchTerm) ||
          doctor.email.toLowerCase().includes(searchTerm) ||
          doctor.prcId.toLowerCase().includes(searchTerm)
        );
      }

      return doctors;
    } catch (error) {
      this.handleError('searchDoctors', error);
    }
  }

  /**
   * Get doctor statistics
   */
  async getDoctorStats(): Promise<{
    total: number;
    verified: number;
    pending: number;
    suspended: number;
    rejected: number;
    bySpecialty: Record<string, number>;
  }> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return {
          total: 0,
          verified: 0,
          pending: 0,
          suspended: 0,
          rejected: 0,
          bySpecialty: {}
        };
      }

      const doctors = Object.values(snapshot.val()) as Doctor[];
      const stats = {
        total: doctors.length,
        verified: 0,
        pending: 0,
        suspended: 0,
        rejected: 0,
        bySpecialty: {} as Record<string, number>
      };

      doctors.forEach(doctor => {
        // Count by status
        stats[doctor.status]++;

        // Count by specialty
        if (!stats.bySpecialty[doctor.specialty]) {
          stats.bySpecialty[doctor.specialty] = 0;
        }
        stats.bySpecialty[doctor.specialty]++;
      });

      return stats;
    } catch (error) {
      this.handleError('getDoctorStats', error);
    }
  }

  /**
   * Get doctors with expiring PRC licenses
   */
  async getDoctorsWithExpiringLicenses(daysThreshold: number = 30): Promise<Doctor[]> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const doctors = Object.values(snapshot.val()) as Doctor[];
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

      return doctors.filter(doctor => {
        const expiryDate = new Date(doctor.prcExpiry);
        return expiryDate <= thresholdDate && expiryDate >= new Date();
      });
    } catch (error) {
      this.handleError('getDoctorsWithExpiringLicenses', error);
    }
  }

  /**
   * Bulk update doctor statuses
   */
  async bulkUpdateStatus(
    doctorIds: string[], 
    status: DoctorStatus, 
    updatedBy?: string
  ): Promise<void> {
    try {
      const updatePromises = doctorIds.map(doctorId => 
        this.updateDoctorStatus(doctorId, status, updatedBy)
      );

      await Promise.all(updatePromises);

      // Log bulk activity
      if (updatedBy) {
        await this.logActivity({
          userId: updatedBy,
          userEmail: '',
          action: `Bulk status update to ${status}`,
          category: 'verification',
          details: {
            doctorIds,
            newStatus: status,
            count: doctorIds.length
          }
        });
      }
    } catch (error) {
      this.handleError('bulkUpdateStatus', error);
    }
  }

  /**
   * Get recently added doctors
   */
  async getRecentDoctors(limit: number = 10): Promise<Doctor[]> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const doctors = Object.values(snapshot.val()) as Doctor[];
      
      // Sort by createdAt descending and limit
      return doctors
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
    } catch (error) {
      this.handleError('getRecentDoctors', error);
    }
  }

  /**
   * Subscribe to recently added doctors (real-time)
   */
  subscribeToRecentDoctors(
    limit: number = 10,
    callback: (doctors: Doctor[]) => void,
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

          const doctors = Object.values(data) as Doctor[];
          const recentDoctors = doctors
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
          
          callback(recentDoctors);
        } catch (error) {
          onError(new Error(`Failed to process recent doctors: ${error.message}`));
        }
      },
      (error) => {
        onError(new Error(`Recent doctors subscription failed: ${error.message}`));
      }
    );
    
    return () => off(this.collectionRef, 'value', unsubscribe);
  }

  /**
   * Deactivate doctor (soft delete)
   */
  async deactivateDoctor(doctorId: string, deactivatedBy?: string): Promise<void> {
    try {
      await this.update(doctorId, { 
        isActive: false,
        status: 'suspended'
      });

      // Log the activity
      if (deactivatedBy) {
        await this.logActivity({
          userId: deactivatedBy,
          userEmail: '',
          action: 'Doctor deactivated',
          category: 'profile',
          targetId: doctorId,
          targetType: 'doctor',
          details: {
            action: 'deactivate'
          }
        });
      }
    } catch (error) {
      this.handleError('deactivateDoctor', error);
    }
  }

  /**
   * Reactivate doctor
   */
  async reactivateDoctor(doctorId: string, reactivatedBy?: string): Promise<void> {
    try {
      await this.update(doctorId, { 
        isActive: true,
        status: 'verified'
      });

      // Log the activity
      if (reactivatedBy) {
        await this.logActivity({
          userId: reactivatedBy,
          userEmail: '',
          action: 'Doctor reactivated',
          category: 'profile',
          targetId: doctorId,
          targetType: 'doctor',
          details: {
            action: 'reactivate'
          }
        });
      }
    } catch (error) {
      this.handleError('reactivateDoctor', error);
    }
  }

  /**
   * Get doctor's full name
   */
  static getFullName(doctor: Doctor): string {
    const parts = [
      doctor.firstName,
      doctor.middleName,
      doctor.lastName,
      doctor.suffix
    ].filter(Boolean);
    
    return parts.join(' ');
  }

  /**
   * Check if doctor's PRC is expiring soon
   */
  static isPrcExpiringSoon(doctor: Doctor, daysThreshold: number = 30): boolean {
    const expiryDate = new Date(doctor.prcExpiry);
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    
    return expiryDate <= thresholdDate && expiryDate >= new Date();
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
export const doctorsService = new DoctorsService();