import { useState, useEffect, useCallback } from 'react';
import { useRealAppointments } from './useRealData';
import { useRealReferrals } from './useRealData';
import { useSpecialists } from './useOptimizedData';
import { usePendingFeeRequests } from './useFeeRequests';
import { realDataService } from '@/lib/services/real-data.service';

/**
 * Hook to track pending appointments and referrals count
 * Used for the "Appointments Monitoring" sidebar indicator
 */
export function usePendingAppointmentsCount() {
  const { appointments, loading: appointmentsLoading } = useRealAppointments();
  const { referrals, loading: referralsLoading } = useRealReferrals();
  const [pendingCount, setPendingCount] = useState(0);

  const calculatePendingCount = useCallback(() => {
    // Count pending appointments
    const pendingAppointments = appointments.filter(appointment => 
      appointment.status === 'pending' || 
      appointment.status === 'scheduled' || 
      appointment.status === 'confirmed'
    ).length;

    // Count pending referrals
    const pendingReferrals = referrals.filter(referral => 
      referral.status === 'pending' || 
      referral.status === 'pending_acceptance' ||
      referral.status === 'scheduled' || 
      referral.status === 'confirmed'
    ).length;

    return pendingAppointments + pendingReferrals;
  }, [appointments, referrals]);

  useEffect(() => {
    if (!appointmentsLoading && !referralsLoading) {
      setPendingCount(calculatePendingCount());
    }
  }, [appointments, referrals, appointmentsLoading, referralsLoading, calculatePendingCount]);

  // Set up real-time listeners for appointments and referrals
  useEffect(() => {
    const unsubscribeAppointments = realDataService.subscribeToAppointments((updatedAppointments) => {
      const pendingAppointments = updatedAppointments.filter(appointment => 
        appointment.status === 'pending' || 
        appointment.status === 'scheduled' || 
        appointment.status === 'confirmed'
      ).length;
      
      setPendingCount(prev => {
        const currentReferrals = referrals.filter(referral => 
          referral.status === 'pending' || 
          referral.status === 'pending_acceptance' ||
          referral.status === 'scheduled' || 
          referral.status === 'confirmed'
        ).length;
        
        return pendingAppointments + currentReferrals;
      });
    });

    const unsubscribeReferrals = realDataService.subscribeToReferrals((updatedReferrals) => {
      const pendingReferrals = updatedReferrals.filter(referral => 
        referral.status === 'pending' || 
        referral.status === 'pending_acceptance' ||
        referral.status === 'scheduled' || 
        referral.status === 'confirmed'
      ).length;
      
      setPendingCount(prev => {
        const currentAppointments = appointments.filter(appointment => 
          appointment.status === 'pending' || 
          appointment.status === 'scheduled' || 
          appointment.status === 'confirmed'
        ).length;
        
        return currentAppointments + pendingReferrals;
      });
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeReferrals();
    };
  }, [appointments, referrals, calculatePendingCount]);

  return {
    pendingCount,
    loading: appointmentsLoading || referralsLoading,
    refresh: calculatePendingCount
  };
}

/**
 * Hook to track pending specialists count
 * Used for the "Specialist Management" sidebar indicator
 * Includes both pending specialists and pending fee change requests
 */
export function usePendingSpecialistsCount() {
  const { data: specialists = [], isLoading: specialistsLoading } = useSpecialists();
  const { requests: pendingFeeRequests, loading: feeRequestsLoading } = usePendingFeeRequests();
  const [pendingCount, setPendingCount] = useState(0);

  const calculatePendingCount = useCallback(() => {
    const pendingSpecialists = specialists.filter(specialist => 
      specialist.isSpecialist === true && 
      specialist.status === 'pending'
    ).length;
    
    const pendingFeeRequestsCount = pendingFeeRequests.length;
    
    return pendingSpecialists + pendingFeeRequestsCount;
  }, [specialists, pendingFeeRequests]);

  useEffect(() => {
    if (!specialistsLoading && !feeRequestsLoading) {
      setPendingCount(calculatePendingCount());
    }
  }, [specialists, pendingFeeRequests, specialistsLoading, feeRequestsLoading, calculatePendingCount]);

  // Set up real-time listener for specialists
  useEffect(() => {
    const unsubscribeDoctors = realDataService.subscribeToDoctors((updatedDoctors) => {
      const pendingSpecialists = updatedDoctors.filter(doctor => 
        doctor.isSpecialist === true && 
        doctor.status === 'pending'
      ).length;
      
      setPendingCount(prev => {
        // Keep the current fee requests count and update specialists count
        const currentFeeRequestsCount = pendingFeeRequests.length;
        return pendingSpecialists + currentFeeRequestsCount;
      });
    });

    return () => {
      unsubscribeDoctors();
    };
  }, [pendingFeeRequests, calculatePendingCount]);

  return {
    pendingCount,
    loading: specialistsLoading || feeRequestsLoading,
    refresh: calculatePendingCount
  };
}

/**
 * Combined hook for all pending counts
 * Used by the sidebar to get all pending indicators
 */
export function useAllPendingCounts() {
  const appointmentsPending = usePendingAppointmentsCount();
  const specialistsPending = usePendingSpecialistsCount();

  return {
    appointmentsPending: appointmentsPending.pendingCount,
    specialistsPending: specialistsPending.pendingCount,
    loading: appointmentsPending.loading || specialistsPending.loading,
    refresh: () => {
      appointmentsPending.refresh();
      specialistsPending.refresh();
    }
  };
}
