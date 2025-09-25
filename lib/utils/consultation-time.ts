import type { Appointment, Referral, SpecialistReferral } from '@/lib/types/database';

export interface IndividualConsultation {
  id: string;
  type: 'appointment' | 'referral';
  patientName?: string;
  doctorName?: string;
  specialty?: string;
  appointmentDate: string;
  appointmentTime: string;
  consultationTimeMinutes: number;
  status: string;
}

export interface ConsultationTimeStats {
  averageConsultationTimeMinutes: number;
  totalCompletedConsultations: number;
  shortestConsultationMinutes: number;
  longestConsultationMinutes: number;
  averageBySpecialty: Record<string, number>;
  individualConsultations: IndividualConsultation[];
}

/**
 * Calculate the time difference between appointment start and completion
 * @param appointmentDate - The date of the appointment (YYYY-MM-DD)
 * @param appointmentTime - The time of the appointment (HH:MM)
 * @param lastUpdated - The timestamp when the appointment was completed
 * @returns Time difference in minutes
 */
export function calculateConsultationTime(
  appointmentDate: string,
  appointmentTime: string,
  lastUpdated: string
): number {
  try {
    console.log('Calculating consultation time:', {
      appointmentDate,
      appointmentTime,
      lastUpdated,
      lastUpdatedType: typeof lastUpdated,
      lastUpdatedLength: lastUpdated?.length
    });
    
    // Parse appointment time - handle both "09:00" and "09:00 AM" formats
    let hours: number, minutes: number;
    
    if (appointmentTime.includes('AM') || appointmentTime.includes('PM')) {
      // Handle 12-hour format like "09:00 AM" or "02:30 PM"
      const timeMatch = appointmentTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!timeMatch) {
        console.error('Invalid time format:', appointmentTime);
        return 0;
      }
      
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
      const period = timeMatch[3].toUpperCase();
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
    } else {
      // Handle 24-hour format like "09:00"
      const timeParts = appointmentTime.split(':');
      if (timeParts.length !== 2) {
        console.error('Invalid time format:', appointmentTime);
        return 0;
      }
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1], 10);
    }
    
    // Create appointment start datetime (treat as local time)
    const [year, month, day] = appointmentDate.split('-').map(Number);
    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes, 0);
    
    console.log('Parsed time components:', {
      year, month, day, hours, minutes,
      originalTime: appointmentTime
    });
    
    // Create completion datetime
    const completionDateTime = new Date(lastUpdated);
    
    // Convert appointment time to UTC for proper comparison
    const appointmentDateTimeUTC = new Date(appointmentDateTime.getTime() - (appointmentDateTime.getTimezoneOffset() * 60000));
    
    console.log('Parsed dates:', {
      appointmentDateTime: appointmentDateTime.toISOString(),
      appointmentDateTimeUTC: appointmentDateTimeUTC.toISOString(),
      completionDateTime: completionDateTime.toISOString(),
      appointmentDateTimeValid: !isNaN(appointmentDateTime.getTime()),
      completionDateTimeValid: !isNaN(completionDateTime.getTime())
    });
    
    // Check if dates are valid
    if (isNaN(appointmentDateTime.getTime()) || isNaN(completionDateTime.getTime())) {
      console.error('Invalid date detected:', {
        appointmentDateTime: appointmentDateTime.toISOString(),
        completionDateTime: completionDateTime.toISOString()
      });
      return 0;
    }
    
    // Calculate difference in minutes using UTC times
    const timeDiffMs = completionDateTime.getTime() - appointmentDateTimeUTC.getTime();
    const timeDiffMinutes = Math.round(timeDiffMs / (1000 * 60));
    
    console.log('Time calculation:', {
      timeDiffMs,
      timeDiffMinutes,
      usingUTC: true
    });
    
    // Return positive values only (in case of data inconsistencies)
    return Math.max(0, timeDiffMinutes);
  } catch (error) {
    console.error('Error calculating consultation time:', error);
    return 0;
  }
}

/**
 * Calculate average consultation time from appointments and referrals
 * @param appointments - Array of appointments
 * @param referrals - Array of referrals (both regular and specialist referrals)
 * @returns Consultation time statistics
 */
export function calculateAverageConsultationTime(
  appointments: Appointment[],
  referrals: (Referral | SpecialistReferral)[]
): ConsultationTimeStats {
  console.log('=== CONSULTATION TIME CALCULATION DEBUG ===');
  console.log('Total appointments:', appointments.length);
  console.log('Total referrals:', referrals.length);
  
  const consultationTimes: number[] = [];
  const specialtyTimes: Record<string, number[]> = {};
  const individualConsultations: IndividualConsultation[] = [];
  
  // Process completed appointments with validation
  appointments.forEach((appointment, index) => {
    console.log(`Appointment ${index}:`, {
      id: appointment.id,
      status: appointment.status,
      lastUpdated: appointment.lastUpdated,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      hasLastUpdated: !!appointment.lastUpdated,
      isCompleted: appointment.status === 'completed'
    });
    
    if (appointment.status === 'completed' && appointment.lastUpdated && appointment.appointmentDate && appointment.appointmentTime) {
      const consultationTime = calculateConsultationTime(
        appointment.appointmentDate,
        appointment.appointmentTime,
        appointment.lastUpdated
      );
      
      console.log(`Appointment ${index} consultation time:`, consultationTime);
      
      // Count all completed appointments, even if consultation time is 0 or invalid
      // This ensures consistency with appointment trends counting
      if (consultationTime >= 0) { // Changed from > 0 to >= 0
        if (consultationTime > 0) {
          consultationTimes.push(consultationTime);
        }
        
        // Add to individual consultations (even with 0 consultation time)
        individualConsultations.push({
          id: appointment.id || 'unknown',
          type: 'appointment',
          patientName: appointment.patientFirstName && appointment.patientLastName 
            ? `${appointment.patientFirstName} ${appointment.patientLastName}`
            : 'Unknown Patient',
          doctorName: appointment.doctorFirstName && appointment.doctorLastName
            ? `${appointment.doctorFirstName} ${appointment.doctorLastName}`
            : 'Unknown Doctor',
          specialty: appointment.specialty,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          consultationTimeMinutes: Math.max(0, consultationTime), // Ensure non-negative
          status: appointment.status
        });
        
        // Group by specialty (only for valid consultation times)
        if (appointment.specialty && consultationTime > 0) {
          if (!specialtyTimes[appointment.specialty]) {
            specialtyTimes[appointment.specialty] = [];
          }
          specialtyTimes[appointment.specialty].push(consultationTime);
        }
      }
    }
  });
  
  // Process completed referrals with validation (both regular and specialist referrals)
  referrals.forEach((referral, index) => {
    console.log(`Referral ${index}:`, {
      id: referral.id,
      status: referral.status,
      lastUpdated: referral.lastUpdated,
      appointmentDate: referral.appointmentDate,
      appointmentTime: referral.appointmentTime,
      hasLastUpdated: !!referral.lastUpdated,
      isCompleted: referral.status === 'completed'
    });
    
    if (referral.status === 'completed' && referral.lastUpdated && referral.appointmentDate && referral.appointmentTime) {
      const consultationTime = calculateConsultationTime(
        referral.appointmentDate,
        referral.appointmentTime,
        referral.lastUpdated
      );
      
      console.log(`Referral ${index} consultation time:`, consultationTime);
      
      // Count all completed referrals, even if consultation time is 0 or invalid
      // This ensures consistency with appointment trends counting
      if (consultationTime >= 0) { // Changed from > 0 to >= 0
        if (consultationTime > 0) {
          consultationTimes.push(consultationTime);
        }
        
        // Add to individual consultations (even with 0 consultation time)
        individualConsultations.push({
          id: referral.id || 'unknown',
          type: 'referral',
          patientName: referral.patientFirstName && referral.patientLastName
            ? `${referral.patientFirstName} ${referral.patientLastName}`
            : 'Unknown Patient',
          doctorName: referral.assignedSpecialistFirstName && referral.assignedSpecialistLastName
            ? `${referral.assignedSpecialistFirstName} ${referral.assignedSpecialistLastName}`
            : 'Unknown Specialist',
          specialty: undefined, // Referrals might not have specialty in the same way
          appointmentDate: referral.appointmentDate,
          appointmentTime: referral.appointmentTime,
          consultationTimeMinutes: Math.max(0, consultationTime), // Ensure non-negative
          status: referral.status
        });
      }
    }
  });
  
  // Sort individual consultations by consultation time (longest first)
  individualConsultations.sort((a, b) => b.consultationTimeMinutes - a.consultationTimeMinutes);
  
  // Calculate statistics
  const totalCompletedConsultations = individualConsultations.length; // Use individual consultations count
  const averageConsultationTimeMinutes = consultationTimes.length > 0 
    ? Math.round(consultationTimes.reduce((sum, time) => sum + time, 0) / consultationTimes.length)
    : 0;
  
  const shortestConsultationMinutes = consultationTimes.length > 0 
    ? Math.min(...consultationTimes)
    : 0;
  
  const longestConsultationMinutes = consultationTimes.length > 0 
    ? Math.max(...consultationTimes)
    : 0;
  
  // Calculate average by specialty
  const averageBySpecialty: Record<string, number> = {};
  Object.entries(specialtyTimes).forEach(([specialty, times]) => {
    averageBySpecialty[specialty] = Math.round(
      times.reduce((sum, time) => sum + time, 0) / times.length
    );
  });
  
  console.log('Final results:', {
    totalCompletedConsultations,
    averageConsultationTimeMinutes,
    individualConsultationsCount: individualConsultations.length,
    consultationTimesCount: consultationTimes.length,
    consultationTimes: consultationTimes,
    individualConsultationsDurations: individualConsultations.map(c => c.consultationTimeMinutes)
  });
  
  return {
    averageConsultationTimeMinutes,
    totalCompletedConsultations,
    shortestConsultationMinutes,
    longestConsultationMinutes,
    averageBySpecialty,
    individualConsultations
  };
}

/**
 * Format consultation time for display
 * @param minutes - Time in minutes
 * @returns Formatted time string
 */
export function formatConsultationTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}
