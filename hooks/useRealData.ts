import { useState, useEffect, useCallback } from 'react';
import { realDataService } from '@/lib/services/real-data.service';
import type { 
  Doctor, 
  Clinic, 
  Feedback, 
  User, 
  Appointment, 
  Patient, 
  Referral, 
  DashboardStats 
} from '@/lib/types/database';

// Hook for doctors data
export function useRealDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = realDataService.subscribeToDoctors((data) => {
      setDoctors(data);
      setLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, []);

  const searchDoctors = useCallback(async (searchTerm: string) => {
    try {
      setLoading(true);
      const results = await realDataService.searchDoctors(searchTerm);
      return results;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getDoctorsBySpecialty = useCallback(async (specialty: string) => {
    try {
      setLoading(true);
      const results = await realDataService.getDoctorsBySpecialty(specialty);
      return results;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    doctors,
    loading,
    error,
    searchDoctors,
    getDoctorsBySpecialty
  };
}

// Hook for clinics data
export function useRealClinics() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = realDataService.subscribeToClinics((data) => {
      setClinics(data);
      setLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, []);

  return {
    clinics,
    loading,
    error
  };
}

// Hook for feedback data
export function useRealFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = realDataService.subscribeToFeedback((data) => {
      setFeedback(data);
      setLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, []);

  const getFeedbackByDoctor = useCallback(async (doctorId: string) => {
    try {
      const results = await realDataService.getFeedbackByDoctor(doctorId);
      return results;
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  return {
    feedback,
    loading,
    error,
    getFeedbackByDoctor
  };
}

// Hook for dashboard statistics
export function useRealDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [stats, activity] = await Promise.all([
        realDataService.getDashboardStats(),
        realDataService.getRecentActivity(10)
      ]);
      
      setDashboardData(stats);
      setRecentActivity(activity);
      setError(null);
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
    recentActivity,
    loading,
    error,
    refresh: fetchDashboardData
  };
}

// Hook for appointments data
export function useRealAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await realDataService.getAppointments();
      setAppointments(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const getAppointmentsByClinic = useCallback(async (clinicId: string) => {
    try {
      const results = await realDataService.getAppointmentsByClinic(clinicId);
      return results;
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  return {
    appointments,
    loading,
    error,
    refresh: fetchAppointments,
    getAppointmentsByClinic
  };
}

// Hook for patients data
export function useRealPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await realDataService.getPatients();
      setPatients(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return {
    patients,
    loading,
    error,
    refresh: fetchPatients
  };
}

// Hook for referrals data
export function useRealReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await realDataService.getReferrals();
      setReferrals(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  return {
    referrals,
    loading,
    error,
    refresh: fetchReferrals
  };
}

// Hook for users data
export function useRealUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await realDataService.getUsers();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refresh: fetchUsers
  };
}

// Hook for activity logs data
export function useRealActivityLogs() {
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await realDataService.getRecentActivity(50); // Get last 50 activities
      setActivityLogs(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  return {
    activityLogs,
    loading,
    error,
    refresh: fetchActivityLogs
  };
}

// Combined hook for all real data
export function useRealHealthcareData() {
  const doctors = useRealDoctors();
  const clinics = useRealClinics();
  const feedback = useRealFeedback();
  const dashboard = useRealDashboard();
  const appointments = useRealAppointments();
  const patients = useRealPatients();
  const referrals = useRealReferrals();
  const users = useRealUsers();
  const activityLogs = useRealActivityLogs();

  const loading = doctors.loading || clinics.loading || feedback.loading || dashboard.loading;
  const error = doctors.error || clinics.error || feedback.error || dashboard.error;

  return {
    doctors: doctors.doctors,
    clinics: clinics.clinics,
    feedback: feedback.feedback,
    dashboardData: dashboard.dashboardData,
    recentActivity: dashboard.recentActivity,
    appointments: appointments.appointments,
    patients: patients.patients,
    referrals: referrals.referrals,
    users: users.users,
    activityLogs: activityLogs.activityLogs,
    loading,
    error,
    
    // Individual hooks for specific functionality
    doctorsHook: doctors,
    clinicsHook: clinics,
    feedbackHook: feedback,
    dashboardHook: dashboard,
    appointmentsHook: appointments,
    patientsHook: patients,
    referralsHook: referrals,
    usersHook: users,
    activityLogsHook: activityLogs
  };
}