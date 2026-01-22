'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ref, push } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import { realDataService } from '@/lib/services/real-data.service';
import type { Doctor, Clinic, Feedback, ActivityLog } from '@/lib/types';

// Query keys for consistent caching
export const queryKeys = {
  specialists: ['specialists'] as const,
  specialistsBySpecialty: (specialty: string) => ['specialists', 'specialty', specialty] as const,
  clinics: ['clinics'] as const,
  feedback: ['feedback'] as const,
  activityLogs: ['activity-logs'] as const,
  dashboard: ['dashboard'] as const,
} as const;

// Optimized hook for specialists with caching
export function useSpecialists() {
  return useQuery({
    queryKey: queryKeys.specialists,
    queryFn: () => realDataService.getDoctors(),
    select: (doctors) => doctors.filter(d => d.isSpecialist === true),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Optimized hook for specialists by specialty
export function useSpecialistsBySpecialty(specialty: string) {
  return useQuery({
    queryKey: queryKeys.specialistsBySpecialty(specialty),
    queryFn: () => realDataService.getDoctorsBySpecialty(specialty),
    select: (doctors) => doctors.filter(d => d.isSpecialist === true),
    enabled: !!specialty,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Optimized hook for clinics
export function useClinics() {
  return useQuery({
    queryKey: queryKeys.clinics,
    queryFn: () => realDataService.getClinics(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Optimized hook for feedback
export function useFeedback() {
  return useQuery({
    queryKey: queryKeys.feedback,
    queryFn: () => realDataService.getFeedback(),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Optimized hook for activity logs
export function useActivityLogs() {
  return useQuery({
    queryKey: queryKeys.activityLogs,
    queryFn: () => realDataService.getRecentActivity(50),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Optimized hook for dashboard data
export function useDashboardData() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => realDataService.getDashboardStats(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Mutation for updating specialist data
export function useUpdateSpecialist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string; updates: Partial<Doctor> }) =>
      realDataService.updateDoctor(data.id, data.updates),
    onSuccess: () => {
      // Invalidate and refetch specialists
      queryClient.invalidateQueries({ queryKey: queryKeys.specialists });
    },
  });
}

// Mutation for creating specialist
export function useCreateSpecialist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<Doctor, 'id'>) => {
      // createDoctor requires doctorId, temporaryPassword, and tempPasswordId
      // Generate these values
      const doctorId = push(ref(db, 'doctors')).key!;
      const temporaryPassword = Math.random().toString(36).slice(-8);
      const tempPasswordId = push(ref(db, 'tempPasswords')).key!;
      return realDataService.createDoctor(data, doctorId, temporaryPassword, tempPasswordId);
    },
    onSuccess: () => {
      // Invalidate and refetch specialists
      queryClient.invalidateQueries({ queryKey: queryKeys.specialists });
    },
  });
} 