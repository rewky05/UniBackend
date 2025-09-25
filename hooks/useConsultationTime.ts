import { useMemo } from 'react';
import { calculateAverageConsultationTime } from '@/lib/utils/consultation-time';
import type { Appointment, Referral, SpecialistReferral } from '@/lib/types/database';

export function useConsultationTime(appointments: Appointment[], referrals: Referral[], specialistReferrals: SpecialistReferral[] = []) {
  const consultationTimeStats = useMemo(() => {
    // Combine both referral types for consultation time calculation
    const allReferrals = [...referrals, ...specialistReferrals];
    return calculateAverageConsultationTime(appointments, allReferrals);
  }, [appointments, referrals, specialistReferrals]);

  return {
    consultationTimeStats,
    // Helper methods
    getAverageTime: () => consultationTimeStats.averageConsultationTimeMinutes,
    getTotalCompleted: () => consultationTimeStats.totalCompletedConsultations,
    getShortestTime: () => consultationTimeStats.shortestConsultationMinutes,
    getLongestTime: () => consultationTimeStats.longestConsultationMinutes,
    getAverageBySpecialty: () => consultationTimeStats.averageBySpecialty,
  };
}
