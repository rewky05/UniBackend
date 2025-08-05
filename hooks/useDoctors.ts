import { useState, useEffect, useCallback } from 'react';
import { doctorsService } from '@/lib/services/doctors.service';
import type { 
  Doctor, 
  CreateDoctorDto, 
  UpdateDoctorDto, 
  DoctorFilters,
  DoctorStatus 
} from '@/lib/types';

// Hook for getting all doctors with real-time updates
export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = doctorsService.subscribeToAll(
      (doctorsData) => {
        setDoctors(doctorsData);
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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    // The subscription will handle the update
  }, []);

  return { 
    doctors, 
    loading, 
    error, 
    refresh,
    total: doctors.length 
  };
}

// Hook for getting a single doctor by ID
export function useDoctor(id: string | null) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setDoctor(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    doctorsService.getById(id)
      .then(doctorData => {
        setDoctor(doctorData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const refresh = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);

    try {
      const doctorData = await doctorsService.getById(id);
      setDoctor(doctorData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { 
    doctor, 
    loading, 
    error, 
    refresh 
  };
}

// Hook for doctors by status with real-time updates
export function useDoctorsByStatus(status: DoctorStatus) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = doctorsService.subscribeToDoctorsByStatus(
      status,
      (doctorsData) => {
        setDoctors(doctorsData);
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
    doctors, 
    loading, 
    error, 
    count: doctors.length 
  };
}

// Hook for doctors by specialty with real-time updates
export function useDoctorsBySpecialty(specialty: string) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!specialty) {
      setDoctors([]);
      setLoading(false);
      return;
    }

    const unsubscribe = doctorsService.subscribeToDoctorsBySpecialty(
      specialty,
      (doctorsData) => {
        setDoctors(doctorsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [specialty]);

  return { 
    doctors, 
    loading, 
    error, 
    count: doctors.length 
  };
}

// Hook for searching doctors with filters
export function useDoctorSearch() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchDoctors = useCallback(async (filters: DoctorFilters) => {
    setLoading(true);
    setError(null);

    try {
      const results = await doctorsService.searchDoctors(filters);
      setDoctors(results);
    } catch (err: any) {
      setError(err.message);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setDoctors([]);
    setError(null);
  }, []);

  return {
    doctors,
    loading,
    error,
    searchDoctors,
    clearSearch,
    hasResults: doctors.length > 0
  };
}

// Hook for doctor statistics
export function useDoctorStats() {
  const [stats, setStats] = useState<{
    total: number;
    verified: number;
    pending: number;
    suspended: number;
    rejected: number;
    bySpecialty: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const statsData = await doctorsService.getDoctorStats();
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

// Hook for recent doctors with real-time updates
export function useRecentDoctors(limit: number = 10) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = doctorsService.subscribeToRecentDoctors(
      limit,
      (doctorsData) => {
        setDoctors(doctorsData);
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
    doctors, 
    loading, 
    error 
  };
}

// Hook for doctors with expiring licenses
export function useDoctorsWithExpiringLicenses(daysThreshold: number = 30) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpiringDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const expiringDoctors = await doctorsService.getDoctorsWithExpiringLicenses(daysThreshold);
      setDoctors(expiringDoctors);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [daysThreshold]);

  useEffect(() => {
    fetchExpiringDoctors();
  }, [fetchExpiringDoctors]);

  return {
    doctors,
    loading,
    error,
    refresh: fetchExpiringDoctors,
    count: doctors.length
  };
}

// Hook for doctor CRUD operations
export function useDoctorActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDoctor = useCallback(async (doctorData: CreateDoctorDto, createdBy?: string) => {
    setLoading(true);
    setError(null);

    try {
      const doctorId = await doctorsService.createDoctor(doctorData, createdBy);
      return doctorId;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDoctor = useCallback(async (id: string, updates: UpdateDoctorDto) => {
    setLoading(true);
    setError(null);

    try {
      await doctorsService.update(id, updates);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDoctorStatus = useCallback(async (
    doctorId: string, 
    status: DoctorStatus, 
    verifiedBy?: string,
    notes?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      await doctorsService.updateDoctorStatus(doctorId, status, verifiedBy, notes);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateStatus = useCallback(async (
    doctorIds: string[], 
    status: DoctorStatus, 
    updatedBy?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      await doctorsService.bulkUpdateStatus(doctorIds, status, updatedBy);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deactivateDoctor = useCallback(async (doctorId: string, deactivatedBy?: string) => {
    setLoading(true);
    setError(null);

    try {
      await doctorsService.deactivateDoctor(doctorId, deactivatedBy);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reactivateDoctor = useCallback(async (doctorId: string, reactivatedBy?: string) => {
    setLoading(true);
    setError(null);

    try {
      await doctorsService.reactivateDoctor(doctorId, reactivatedBy);
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
    createDoctor,
    updateDoctor,
    updateDoctorStatus,
    bulkUpdateStatus,
    deactivateDoctor,
    reactivateDoctor,
    loading,
    error,
    clearError
  };
}