import { query, orderByChild, equalTo, get, onValue, off } from 'firebase/database';
import { BaseFirebaseService } from './base.service';
import type { 
  Patient, 
  CreatePatientDto, 
  UpdatePatientDto, 
  PatientFilters,
  ActivityLog,
  CreateActivityLogDto
} from '@/lib/types';

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodType?: string;
  allergies?: string[];
  medicalConditions?: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  address?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {
  lastUpdated?: number;
}

export interface PatientFilters {
  gender?: string;
  bloodType?: string;
  search?: string;
}

export class PatientsService extends BaseFirebaseService<Patient> {
  constructor() {
    super('patients');
  }

  /**
   * Create a new patient with activity logging
   */
  async createPatient(patientData: CreatePatientDto, createdBy?: string): Promise<string> {
    try {
      const patientId = await this.create({
        ...patientData,
        createdAt: Date.now(),
        lastUpdated: Date.now()
      });

      // Log the activity
      if (createdBy) {
        await this.logActivity({
          userId: createdBy,
          userEmail: createdBy,
          action: 'Patient created',
          category: 'profile',
          targetId: patientId,
          targetType: 'patient',
          details: {
            patientName: `${patientData.firstName} ${patientData.lastName}`,
            gender: patientData.gender
          }
        });
      }

      return patientId;
    } catch (error) {
      this.handleError('createPatient', error);
    }
  }

  /**
   * Get patients by gender
   */
  async getPatientsByGender(gender: string): Promise<Patient[]> {
    try {
      const genderQuery = query(
        this.collectionRef,
        orderByChild('gender'),
        equalTo(gender)
      );

      const snapshot = await get(genderQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      return Object.values(snapshot.val()) as Patient[];
    } catch (error) {
      this.handleError('getPatientsByGender', error);
    }
  }

  /**
   * Subscribe to patients by gender (real-time)
   */
  subscribeToPatientsByGender(
    gender: string,
    callback: (patients: Patient[]) => void,
    onError: (error: Error) => void
  ): () => void {
    return this.subscribeByField('gender', gender, callback, onError);
  }

  /**
   * Search patients with multiple filters
   */
  async searchPatients(filters: PatientFilters): Promise<Patient[]> {
    try {
      // Get all patients first (Firebase Realtime DB doesn't support complex queries)
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      let patients = Object.values(snapshot.val()) as Patient[];

      // Apply filters
      if (filters.gender) {
        patients = patients.filter(patient => patient.gender === filters.gender);
      }

      if (filters.bloodType) {
        patients = patients.filter(patient => patient.bloodType === filters.bloodType);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        patients = patients.filter(patient => 
          patient.firstName.toLowerCase().includes(searchTerm) ||
          patient.lastName.toLowerCase().includes(searchTerm) ||
          patient.email.toLowerCase().includes(searchTerm) ||
          patient.phone.toLowerCase().includes(searchTerm)
        );
      }

      return patients;
    } catch (error) {
      this.handleError('searchPatients', error);
    }
  }

  /**
   * Get patient statistics
   */
  async getPatientStats(): Promise<{
    total: number;
    male: number;
    female: number;
    other: number;
    byBloodType: Record<string, number>;
  }> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return {
          total: 0,
          male: 0,
          female: 0,
          other: 0,
          byBloodType: {}
        };
      }

      const patients = Object.values(snapshot.val()) as Patient[];
      const stats = {
        total: patients.length,
        male: 0,
        female: 0,
        other: 0,
        byBloodType: {} as Record<string, number>
      };

      patients.forEach(patient => {
        // Count by gender
        stats[patient.gender as keyof typeof stats]++;

        // Count by blood type
        if (patient.bloodType) {
          if (!stats.byBloodType[patient.bloodType]) {
            stats.byBloodType[patient.bloodType] = 0;
          }
          stats.byBloodType[patient.bloodType]++;
        }
      });

      return stats;
    } catch (error) {
      this.handleError('getPatientStats', error);
    }
  }

  /**
   * Get recently added patients
   */
  async getRecentPatients(limit: number = 10): Promise<Patient[]> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const patients = Object.values(snapshot.val()) as Patient[];
      
      // Sort by createdAt descending and limit
      return patients
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, limit);
    } catch (error) {
      this.handleError('getRecentPatients', error);
    }
  }

  /**
   * Subscribe to recently added patients (real-time)
   */
  subscribeToRecentPatients(
    limit: number = 10,
    callback: (patients: Patient[]) => void,
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

          const patients = Object.values(data) as Patient[];
          const recentPatients = patients
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, limit);
          
          callback(recentPatients);
        } catch (error) {
          onError(new Error(`Failed to process recent patients: ${error.message}`));
        }
      },
      (error) => {
        onError(new Error(`Recent patients subscription failed: ${error.message}`));
      }
    );
    
    return () => off(this.collectionRef, 'value', unsubscribe);
  }

  /**
   * Get patient's full name
   */
  static getFullName(patient: Patient): string {
    const parts = [
      patient.firstName,
      patient.middleName,
      patient.lastName
    ].filter(Boolean);
    
    return parts.join(' ');
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
export const patientsService = new PatientsService(); 