import { useMemo } from 'react';
import type { Appointment, Referral } from '@/lib/types/database';

export interface UnifiedAppointmentData {
  // Raw counts
  totalAppointments: number;
  totalReferrals: number;
  totalAppointmentsAndReferrals: number;
  
  // Status breakdowns
  completedAppointments: number;
  cancelledAppointments: number;
  pendingAppointments: number;
  
  completedReferrals: number;
  cancelledReferrals: number;
  pendingReferrals: number;
  
  // Combined counts (treating referrals as appointments)
  totalCompleted: number;
  totalCancelled: number;
  totalPending: number;
  
  // Consultation time eligible (has lastUpdated)
  consultationTimeEligibleAppointments: number;
  consultationTimeEligibleReferrals: number;
  totalConsultationTimeEligible: number;
  
  // Filtered data for specific time ranges
  getFilteredData: (timeRangeDays: number, clinicFilter?: string) => {
    appointments: Appointment[];
    referrals: Referral[];
    totalCount: number;
    completedCount: number;
    cancelledCount: number;
    consultationTimeEligibleCount: number;
  };
}

export function useUnifiedAppointmentData(
  appointments: Appointment[],
  referrals: Referral[]
): UnifiedAppointmentData {
  return useMemo(() => {
    // Raw counts
    const totalAppointments = appointments.length;
    const totalReferrals = referrals.length;
    const totalAppointmentsAndReferrals = totalAppointments + totalReferrals;
    
    // Appointment status breakdowns
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
    const pendingAppointments = appointments.filter(a => 
      a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'pending'
    ).length;
    
    // Referral status breakdowns
    const completedReferrals = referrals.filter(r => r.status === 'completed').length;
    const cancelledReferrals = referrals.filter(r => r.status === 'cancelled').length;
    const pendingReferrals = referrals.filter(r => 
      r.status === 'scheduled' || r.status === 'confirmed' || r.status === 'pending'
    ).length;
    
    // Combined counts (treating referrals as appointments)
    const totalCompleted = completedAppointments + completedReferrals;
    const totalCancelled = cancelledAppointments + cancelledReferrals;
    const totalPending = pendingAppointments + pendingReferrals;
    
    // Consultation time eligible (has lastUpdated timestamp)
    const consultationTimeEligibleAppointments = appointments.filter(a => 
      a.status === 'completed' && a.lastUpdated && a.appointmentDate
    ).length;
    
    const consultationTimeEligibleReferrals = referrals.filter(r => 
      r.status === 'completed' && r.lastUpdated && r.appointmentDate
    ).length;
    
    const totalConsultationTimeEligible = consultationTimeEligibleAppointments + consultationTimeEligibleReferrals;
    
    // Filtered data function
    const getFilteredData = (timeRangeDays: number, clinicFilter?: string) => {
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - timeRangeDays * 24 * 60 * 60 * 1000);
      
      const filteredAppointments = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.appointmentDate);
        const matchesDate = appointmentDate >= cutoffDate;
        const matchesClinic = !clinicFilter || clinicFilter === 'all' || appointment.clinicName === clinicFilter;
        return matchesDate && matchesClinic;
      });
      
      const filteredReferrals = referrals.filter(referral => {
        const appointmentDate = new Date(referral.appointmentDate);
        const matchesDate = appointmentDate >= cutoffDate;
        const matchesClinic = !clinicFilter || clinicFilter === 'all' || 
          referral.specialistClinicName === clinicFilter || 
          referral.referringClinicName === clinicFilter;
        return matchesDate && matchesClinic;
      });
      
      const totalCount = filteredAppointments.length + filteredReferrals.length;
      const completedCount = filteredAppointments.filter(a => a.status === 'completed').length + 
                           filteredReferrals.filter(r => r.status === 'completed').length;
      const cancelledCount = filteredAppointments.filter(a => a.status === 'cancelled').length + 
                            filteredReferrals.filter(r => r.status === 'cancelled').length;
      const consultationTimeEligibleCount = filteredAppointments.filter(a => 
        a.status === 'completed' && a.lastUpdated && a.appointmentDate
      ).length + filteredReferrals.filter(r => 
        r.status === 'completed' && r.lastUpdated && r.appointmentDate
      ).length;
      
      return {
        appointments: filteredAppointments,
        referrals: filteredReferrals,
        totalCount,
        completedCount,
        cancelledCount,
        consultationTimeEligibleCount
      };
    };
    
    return {
      // Raw counts
      totalAppointments,
      totalReferrals,
      totalAppointmentsAndReferrals,
      
      // Status breakdowns
      completedAppointments,
      cancelledAppointments,
      pendingAppointments,
      
      completedReferrals,
      cancelledReferrals,
      pendingReferrals,
      
      // Combined counts
      totalCompleted,
      totalCancelled,
      totalPending,
      
      // Consultation time eligible
      consultationTimeEligibleAppointments,
      consultationTimeEligibleReferrals,
      totalConsultationTimeEligible,
      
      // Filtered data function
      getFilteredData
    };
  }, [appointments, referrals]);
}
