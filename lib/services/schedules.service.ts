import { query, orderByChild, equalTo, get, onValue, off } from 'firebase/database';
import { BaseFirebaseService } from './base.service';
import type { 
  Schedule, 
  Clinic,
  DoctorClinicAffiliation,
  ClinicSchedule,
  CreateActivityLogDto
} from '@/lib/types';

export class SchedulesService extends BaseFirebaseService<Schedule> {
  constructor() {
    super('schedules');
  }

  /**
   * Create new schedule
   */
  async createSchedule(scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      return await this.create({
        ...scheduleData,
        isActive: true
      });
    } catch (error) {
      this.handleError('createSchedule', error);
    }
  }

  /**
   * Get schedules by doctor ID
   */
  async getSchedulesByDoctor(doctorId: string): Promise<Schedule[]> {
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

      const schedules = Object.values(snapshot.val()) as Schedule[];
      return schedules.filter(s => s.isActive).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    } catch (error) {
      this.handleError('getSchedulesByDoctor', error);
    }
  }

  /**
   * Subscribe to schedules by doctor ID (real-time)
   */
  subscribeToSchedulesByDoctor(
    doctorId: string,
    callback: (schedules: Schedule[]) => void,
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
          const schedules = data ? Object.values(data) as Schedule[] : [];
          const activeSchedules = schedules
            .filter(s => s.isActive)
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
          callback(activeSchedules);
        } catch (error) {
          onError(new Error(`Failed to process doctor schedules: ${error.message}`));
        }
      },
      (error) => {
        onError(new Error(`Doctor schedules subscription failed: ${error.message}`));
      }
    );
    
    return () => off(doctorQuery, 'value', unsubscribe);
  }

  /**
   * Get schedules by clinic ID
   */
  async getSchedulesByClinic(clinicId: string): Promise<Schedule[]> {
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

      const schedules = Object.values(snapshot.val()) as Schedule[];
      return schedules.filter(s => s.isActive).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    } catch (error) {
      this.handleError('getSchedulesByClinic', error);
    }
  }

  /**
   * Update doctor's schedule for a specific clinic
   */
  async updateDoctorClinicSchedule(
    doctorId: string,
    clinicId: string,
    schedules: Omit<Schedule, 'id' | 'doctorId' | 'clinicId' | 'createdAt' | 'updatedAt'>[],
    updatedBy?: string
  ): Promise<void> {
    try {
      // First, deactivate existing schedules for this doctor-clinic combination
      const existingSchedules = await this.getDoctorClinicSchedules(doctorId, clinicId);
      
      for (const schedule of existingSchedules) {
        await this.update(schedule.id, { isActive: false });
      }

      // Create new schedules
      const createPromises = schedules.map(scheduleData => 
        this.create({
          ...scheduleData,
          doctorId,
          clinicId,
          isActive: true
        })
      );

      await Promise.all(createPromises);

      // Log the activity
      if (updatedBy) {
        await this.logActivity({
          userId: updatedBy,
          userEmail: '',
          action: 'Doctor schedule updated',
          category: 'schedule',
          targetId: doctorId,
          targetType: 'doctor',
          details: {
            clinicId,
            scheduleCount: schedules.length
          }
        });
      }
    } catch (error) {
      this.handleError('updateDoctorClinicSchedule', error);
    }
  }

  /**
   * Get doctor's schedule for a specific clinic
   */
  async getDoctorClinicSchedules(doctorId: string, clinicId: string): Promise<Schedule[]> {
    try {
      // Firebase Realtime DB doesn't support compound queries, so we filter in memory
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const schedules = Object.values(snapshot.val()) as Schedule[];
      
      return schedules
        .filter(s => s.doctorId === doctorId && s.clinicId === clinicId && s.isActive)
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    } catch (error) {
      this.handleError('getDoctorClinicSchedules', error);
    }
  }

  /**
   * Get doctor's weekly schedule grouped by clinic
   */
  async getDoctorWeeklySchedule(doctorId: string): Promise<{
    [clinicId: string]: {
      clinic: Clinic;
      schedules: Schedule[];
    };
  }> {
    try {
      const schedules = await this.getSchedulesByDoctor(doctorId);
      const clinicsService = new ClinicsService();
      const groupedSchedules: {
        [clinicId: string]: {
          clinic: Clinic;
          schedules: Schedule[];
        };
      } = {};

      // Group schedules by clinic
      for (const schedule of schedules) {
        if (!groupedSchedules[schedule.clinicId]) {
          const clinic = await clinicsService.getById(schedule.clinicId);
          if (clinic) {
            groupedSchedules[schedule.clinicId] = {
              clinic,
              schedules: []
            };
          }
        }
        
        if (groupedSchedules[schedule.clinicId]) {
          groupedSchedules[schedule.clinicId].schedules.push(schedule);
        }
      }

      return groupedSchedules;
    } catch (error) {
      this.handleError('getDoctorWeeklySchedule', error);
    }
  }

  /**
   * Check for schedule conflicts
   */
  async checkScheduleConflicts(
    doctorId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeScheduleId?: string
  ): Promise<Schedule[]> {
    try {
      const doctorSchedules = await this.getSchedulesByDoctor(doctorId);
      
      return doctorSchedules.filter(schedule => {
        if (excludeScheduleId && schedule.id === excludeScheduleId) {
          return false;
        }
        
        if (schedule.dayOfWeek !== dayOfWeek) {
          return false;
        }

        // Check for time overlap
        const scheduleStart = this.timeToMinutes(schedule.startTime);
        const scheduleEnd = this.timeToMinutes(schedule.endTime);
        const newStart = this.timeToMinutes(startTime);
        const newEnd = this.timeToMinutes(endTime);

        return (newStart < scheduleEnd && newEnd > scheduleStart);
      });
    } catch (error) {
      this.handleError('checkScheduleConflicts', error);
    }
  }

  /**
   * Get available time slots for a doctor on a specific day
   */
  async getAvailableTimeSlots(
    doctorId: string,
    dayOfWeek: number,
    slotDuration: number = 30 // minutes
  ): Promise<{ startTime: string; endTime: string }[]> {
    try {
      const schedules = await this.getSchedulesByDoctor(doctorId);
      const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);

      if (daySchedules.length === 0) {
        return [];
      }

      const availableSlots: { startTime: string; endTime: string }[] = [];

      for (const schedule of daySchedules) {
        const startMinutes = this.timeToMinutes(schedule.startTime);
        const endMinutes = this.timeToMinutes(schedule.endTime);

        for (let time = startMinutes; time + slotDuration <= endMinutes; time += slotDuration) {
          availableSlots.push({
            startTime: this.minutesToTime(time),
            endTime: this.minutesToTime(time + slotDuration)
          });
        }
      }

      return availableSlots;
    } catch (error) {
      this.handleError('getAvailableTimeSlots', error);
    }
  }

  /**
   * Bulk update schedules
   */
  async bulkUpdateSchedules(
    scheduleUpdates: { id: string; updates: Partial<Schedule> }[],
    updatedBy?: string
  ): Promise<void> {
    try {
      const updatePromises = scheduleUpdates.map(({ id, updates }) => 
        this.update(id, updates)
      );

      await Promise.all(updatePromises);

      // Log bulk activity
      if (updatedBy) {
        await this.logActivity({
          userId: updatedBy,
          userEmail: '',
          action: `Bulk updated ${scheduleUpdates.length} schedules`,
          category: 'schedule',
          details: {
            count: scheduleUpdates.length,
            scheduleIds: scheduleUpdates.map(s => s.id)
          }
        });
      }
    } catch (error) {
      this.handleError('bulkUpdateSchedules', error);
    }
  }

  /**
   * Helper method to convert time string to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Helper method to convert minutes to time string
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * Private method to log activities
   */
  private async logActivity(activityData: CreateActivityLogDto): Promise<void> {
    try {
      const { ActivityLogsService } = await import('./activity-logs.service');
      const activityService = new ActivityLogsService();
      await activityService.create(activityData);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }
}

// Clinics Service
export class ClinicsService extends BaseFirebaseService<Clinic> {
  constructor() {
    super('clinics');
  }

  /**
   * Create new clinic
   */
  async createClinic(clinicData: Omit<Clinic, 'id' | 'createdAt' | 'updatedAt'>, createdBy?: string): Promise<string> {
    try {
      const now = Date.now();
      return await this.create({
        ...clinicData,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: createdBy || 'system'
      });
    } catch (error) {
      this.handleError('createClinic', error);
    }
  }

  /**
   * Get active clinics
   */
  async getActiveClinics(): Promise<Clinic[]> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const clinics = Object.values(snapshot.val()) as Clinic[];
      return clinics.filter(c => c.isActive).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      this.handleError('getActiveClinics', error);
    }
  }

  /**
   * Subscribe to active clinics (real-time)
   */
  subscribeToActiveClinics(
    callback: (clinics: Clinic[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const unsubscribe = onValue(
      this.collectionRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          const clinics = data ? Object.values(data) as Clinic[] : [];
          const activeClinics = clinics
            .filter(c => c.isActive)
            .sort((a, b) => a.name.localeCompare(b.name));
          callback(activeClinics);
        } catch (error) {
          onError(new Error(`Failed to process active clinics: ${error.message}`));
        }
      },
      (error) => {
        onError(new Error(`Active clinics subscription failed: ${error.message}`));
      }
    );
    
    return () => off(this.collectionRef, 'value', unsubscribe);
  }

  /**
   * Get clinics by type
   */
  async getClinicsByType(type: Clinic['type']): Promise<Clinic[]> {
    try {
      const typeQuery = query(
        this.collectionRef,
        orderByChild('type'),
        equalTo(type)
      );

      const snapshot = await get(typeQuery);
      
      if (!snapshot.exists()) {
        return [];
      }

      const clinics = Object.values(snapshot.val()) as Clinic[];
      return clinics.filter(c => c.isActive).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      this.handleError('getClinicsByType', error);
    }
  }

  /**
   * Search clinics by name or location
   */
  async searchClinics(searchTerm: string): Promise<Clinic[]> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const clinics = Object.values(snapshot.val()) as Clinic[];
      const searchTermLower = searchTerm.toLowerCase();

      return clinics
        .filter(clinic => 
          clinic.isActive && (
            clinic.name.toLowerCase().includes(searchTermLower) ||
            clinic.address.toLowerCase().includes(searchTermLower) ||
            clinic.city.toLowerCase().includes(searchTermLower) ||
            clinic.province.toLowerCase().includes(searchTermLower)
          )
        )
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      this.handleError('searchClinics', error);
    }
  }

  /**
   * Get clinic statistics
   */
  async getClinicStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<Clinic['type'], number>;
    byCity: Record<string, number>;
  }> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return {
          total: 0,
          active: 0,
          inactive: 0,
          byType: {
            hospital: 0,
            multi_specialty_clinic: 0,
            community_clinic: 0,
            private_clinic: 0
          },
          byCity: {}
        };
      }

      const clinics = Object.values(snapshot.val()) as Clinic[];
      const stats = {
        total: clinics.length,
        active: 0,
        inactive: 0,
        byType: {
          hospital: 0,
          multi_specialty_clinic: 0,
          community_clinic: 0,
          private_clinic: 0
        } as Record<Clinic['type'], number>,
        byCity: {} as Record<string, number>
      };

      clinics.forEach(clinic => {
        // Count by status
        if (clinic.isActive) {
          stats.active++;
        } else {
          stats.inactive++;
        }

        // Count by type
        stats.byType[clinic.type]++;

        // Count by city
        if (!stats.byCity[clinic.city]) {
          stats.byCity[clinic.city] = 0;
        }
        stats.byCity[clinic.city]++;
      });

      return stats;
    } catch (error) {
      this.handleError('getClinicStats', error);
    }
  }
}

// Doctor Clinic Affiliations Service
export class DoctorClinicAffiliationsService extends BaseFirebaseService<DoctorClinicAffiliation> {
  constructor() {
    super('doctor-clinic-affiliations');
  }

  /**
   * Create new affiliation
   */
  async createAffiliation(
    affiliationData: Omit<DoctorClinicAffiliation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      return await this.create({
        ...affiliationData,
        isActive: true
      });
    } catch (error) {
      this.handleError('createAffiliation', error);
    }
  }

  /**
   * Get affiliations by doctor ID
   */
  async getAffiliationsByDoctor(doctorId: string): Promise<DoctorClinicAffiliation[]> {
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

      const affiliations = Object.values(snapshot.val()) as DoctorClinicAffiliation[];
      return affiliations.filter(a => a.isActive);
    } catch (error) {
      this.handleError('getAffiliationsByDoctor', error);
    }
  }

  /**
   * Get affiliations by clinic ID
   */
  async getAffiliationsByClinic(clinicId: string): Promise<DoctorClinicAffiliation[]> {
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

      const affiliations = Object.values(snapshot.val()) as DoctorClinicAffiliation[];
      return affiliations.filter(a => a.isActive);
    } catch (error) {
      this.handleError('getAffiliationsByClinic', error);
    }
  }
}

// Export singleton instances
export const schedulesService = new SchedulesService();
export const clinicsService = new ClinicsService();
export const doctorClinicAffiliationsService = new DoctorClinicAffiliationsService();