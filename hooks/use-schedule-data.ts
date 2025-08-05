'use client';

import { useState, useEffect } from 'react';
import { ref, get, set, push, remove, onValue } from 'firebase/database';
import { db } from '@/lib/firebase/config';

// Schedule structure matching the actual specialistSchedules structure
export interface SpecialistSchedule {
  id?: string;
  specialistId: string;
  createdAt?: string;
  isActive: boolean;
  lastUpdated?: string;
  practiceLocation: {
    clinicId: string;
    roomOrUnit: string;
  };
  recurrence: {
    dayOfWeek: number[];
    type: string;
  };
  scheduleType: string;
  slotTemplate: {
    [timeSlot: string]: {
      defaultStatus: string;
      durationMinutes: number;
    };
  };
  validFrom: string;
}

// Clinic structure based on add doctor page
export interface ClinicAffiliation {
  id?: string;
  clinicId?: string; // For existing clinics
  name: string;
  since: string;
  schedules: SpecialistSchedule[];
  newClinicDetails?: {
    name: string;
    addressLine: string;
    contactNumber: string;
    type: string;
  };
}

export function useScheduleData(doctorId?: string) {
  const [schedules, setSchedules] = useState<SpecialistSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load schedules for the doctor
  useEffect(() => {
    if (!doctorId) return;

    setLoading(true);
    setError(null);

    // Listen to specialistSchedules
    const schedulesRef = ref(db, `specialistSchedules/${doctorId}`);
    const schedulesUnsubscribe = onValue(schedulesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const schedulesList = Object.keys(data).map(id => ({
          id,
          ...data[id]
        }));
        setSchedules(schedulesList);
      } else {
        setSchedules([]);
      }
    }, (error) => {
      console.error('Error loading specialist schedules:', error);
      setError('Failed to load schedules');
    });

    setLoading(false);

    return () => {
      schedulesUnsubscribe();
    };
  }, [doctorId]);

  const handleScheduleAdd = async (scheduleData: Omit<SpecialistSchedule, 'id'>) => {
    if (!doctorId) return;

    try {
      const schedulesRef = ref(db, `specialistSchedules/${doctorId}`);
      const newScheduleRef = push(schedulesRef);
      await set(newScheduleRef, {
        ...scheduleData,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding schedule:', error);
      setError('Failed to add schedule');
    }
  };

  const handleScheduleEdit = async (updatedSchedule: SpecialistSchedule) => {
    if (!doctorId) return;

    try {
      const scheduleRef = ref(db, `specialistSchedules/${doctorId}/${updatedSchedule.id}`);
      await set(scheduleRef, {
        ...updatedSchedule,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      setError('Failed to update schedule');
    }
  };

  const handleScheduleDelete = async (scheduleId: string) => {
    if (!doctorId) return;

    try {
      const scheduleRef = ref(db, `specialistSchedules/${doctorId}/${scheduleId}`);
      await remove(scheduleRef);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setError('Failed to delete schedule');
    }
  };

  return {
    schedules,
    loading,
    error,
    handleScheduleAdd,
    handleScheduleEdit,
    handleScheduleDelete,
  };
}
