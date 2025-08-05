import { useState, useEffect, useCallback } from 'react';
import { schedulesService, clinicsService } from '@/lib/services/schedules.service';
import type { 
  Schedule, 
  Clinic,
  ClinicType
} from '@/lib/types';

// Hook for getting schedules by doctor ID with real-time updates
export function useSchedulesByDoctor(doctorId: string | null) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorId) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    const unsubscribe = schedulesService.subscribeToSchedulesByDoctor(
      doctorId,
      (schedulesData) => {
        setSchedules(schedulesData);
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
    schedules, 
    loading, 
    error, 
    count: schedules.length 
  };
}

// Hook for getting doctor's weekly schedule grouped by clinic
export function useDoctorWeeklySchedule(doctorId: string | null) {
  const [weeklySchedule, setWeeklySchedule] = useState<{
    [clinicId: string]: {
      clinic: Clinic;
      schedules: Schedule[];
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklySchedule = useCallback(async () => {
    if (!doctorId) {
      setWeeklySchedule(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scheduleData = await schedulesService.getDoctorWeeklySchedule(doctorId);
      setWeeklySchedule(scheduleData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchWeeklySchedule();
  }, [fetchWeeklySchedule]);

  return {
    weeklySchedule,
    loading,
    error,
    refresh: fetchWeeklySchedule
  };
}

// Hook for checking schedule conflicts
export function useScheduleConflicts() {
  const [conflicts, setConflicts] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConflicts = useCallback(async (
    doctorId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeScheduleId?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const conflictingSchedules = await schedulesService.checkScheduleConflicts(
        doctorId,
        dayOfWeek,
        startTime,
        endTime,
        excludeScheduleId
      );
      setConflicts(conflictingSchedules);
      return conflictingSchedules;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearConflicts = useCallback(() => {
    setConflicts([]);
    setError(null);
  }, []);

  return {
    conflicts,
    loading,
    error,
    checkConflicts,
    clearConflicts,
    hasConflicts: conflicts.length > 0
  };
}

// Hook for getting available time slots
export function useAvailableTimeSlots() {
  const [timeSlots, setTimeSlots] = useState<{ startTime: string; endTime: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAvailableSlots = useCallback(async (
    doctorId: string,
    dayOfWeek: number,
    slotDuration: number = 30
  ) => {
    setLoading(true);
    setError(null);

    try {
      const slots = await schedulesService.getAvailableTimeSlots(doctorId, dayOfWeek, slotDuration);
      setTimeSlots(slots);
      return slots;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSlots = useCallback(() => {
    setTimeSlots([]);
    setError(null);
  }, []);

  return {
    timeSlots,
    loading,
    error,
    getAvailableSlots,
    clearSlots
  };
}

// Hook for schedule CRUD operations
export function useScheduleActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSchedule = useCallback(async (
    scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const scheduleId = await schedulesService.createSchedule(scheduleData);
      return scheduleId;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDoctorClinicSchedule = useCallback(async (
    doctorId: string,
    clinicId: string,
    schedules: Omit<Schedule, 'id' | 'doctorId' | 'clinicId' | 'createdAt' | 'updatedAt'>[],
    updatedBy?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      await schedulesService.updateDoctorClinicSchedule(doctorId, clinicId, schedules, updatedBy);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateSchedules = useCallback(async (
    scheduleUpdates: { id: string; updates: Partial<Schedule> }[],
    updatedBy?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      await schedulesService.bulkUpdateSchedules(scheduleUpdates, updatedBy);
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
    createSchedule,
    updateDoctorClinicSchedule,
    bulkUpdateSchedules,
    loading,
    error,
    clearError
  };
}

// Hook for getting all clinics with real-time updates
export function useClinics() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = clinicsService.subscribeToActiveClinics(
      (clinicsData) => {
        setClinics(clinicsData);
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
    clinics, 
    loading, 
    error, 
    total: clinics.length 
  };
}

// Hook for getting clinics by type
export function useClinicsByType(type: ClinicType | null) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClinicsByType = useCallback(async () => {
    if (!type) {
      setClinics([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const clinicsData = await clinicsService.getClinicsByType(type);
      setClinics(clinicsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchClinicsByType();
  }, [fetchClinicsByType]);

  return {
    clinics,
    loading,
    error,
    refresh: fetchClinicsByType,
    count: clinics.length
  };
}

// Hook for searching clinics
export function useClinicSearch() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchClinics = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setClinics([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await clinicsService.searchClinics(searchTerm);
      setClinics(results);
    } catch (err: any) {
      setError(err.message);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setClinics([]);
    setError(null);
  }, []);

  return {
    clinics,
    loading,
    error,
    searchClinics,
    clearSearch,
    hasResults: clinics.length > 0
  };
}

// Hook for clinic statistics
export function useClinicStats() {
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<ClinicType, number>;
    byCity: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const statsData = await clinicsService.getClinicStats();
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

// Hook for clinic CRUD operations
export function useClinicActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createClinic = useCallback(async (
    clinicData: Omit<Clinic, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const clinicId = await clinicsService.createClinic(clinicData);
      return clinicId;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateClinic = useCallback(async (
    id: string, 
    updates: Partial<Omit<Clinic, 'id' | 'createdAt'>>
  ) => {
    setLoading(true);
    setError(null);

    try {
      await clinicsService.update(id, updates);
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
    createClinic,
    updateClinic,
    loading,
    error,
    clearError
  };
}