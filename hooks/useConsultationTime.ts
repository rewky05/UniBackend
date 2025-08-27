import { useMemo } from 'react';
import { calculateAverageConsultationTime } from '@/lib/utils/consultation-time';
import type { Appointment, Referral } from '@/lib/types/database';

export function useConsultationTime(appointments: Appointment[], referrals: Referral[]) {
  const consultationTimeStats = useMemo(() => {
    return calculateAverageConsultationTime(appointments, referrals);
  }, [appointments, referrals]);

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
