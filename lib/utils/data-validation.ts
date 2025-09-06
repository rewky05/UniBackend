import type { Appointment, Referral } from '@/lib/types/database';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AppointmentValidationResult extends ValidationResult {
  hasValidConsultationTime: boolean;
  missingFields: string[];
}

export interface ReferralValidationResult extends ValidationResult {
  hasValidConsultationTime: boolean;
  missingFields: string[];
}

/**
 * Validate an appointment for consultation time calculation
 */
export function validateAppointmentForConsultationTime(appointment: Appointment): AppointmentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Check required fields for consultation time calculation
  if (!appointment.status) {
    missingFields.push('status');
  } else if (appointment.status !== 'completed') {
    warnings.push(`Appointment status is '${appointment.status}', not 'completed'`);
  }

  if (!appointment.appointmentDate) {
    missingFields.push('appointmentDate');
  }

  if (!appointment.appointmentTime) {
    missingFields.push('appointmentTime');
  }

  if (!appointment.lastUpdated) {
    missingFields.push('lastUpdated');
  }

  // Check if appointment is eligible for consultation time calculation
  const hasValidConsultationTime = 
    appointment.status === 'completed' && 
    !!appointment.appointmentDate && 
    !!appointment.appointmentTime && 
    !!appointment.lastUpdated;

  // Validate date format
  if (appointment.appointmentDate) {
    const date = new Date(appointment.appointmentDate);
    if (isNaN(date.getTime())) {
      errors.push('Invalid appointmentDate format');
    }
  }

  // Validate time format
  if (appointment.appointmentTime) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM))?$/i;
    if (!timeRegex.test(appointment.appointmentTime)) {
      errors.push('Invalid appointmentTime format');
    }
  }

  // Validate lastUpdated timestamp
  if (appointment.lastUpdated) {
    const lastUpdated = new Date(appointment.lastUpdated);
    if (isNaN(lastUpdated.getTime())) {
      errors.push('Invalid lastUpdated timestamp format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasValidConsultationTime,
    missingFields
  };
}

/**
 * Validate a referral for consultation time calculation
 */
export function validateReferralForConsultationTime(referral: Referral): ReferralValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Check required fields for consultation time calculation
  if (!referral.status) {
    missingFields.push('status');
  } else if (referral.status !== 'completed') {
    warnings.push(`Referral status is '${referral.status}', not 'completed'`);
  }

  if (!referral.appointmentDate) {
    missingFields.push('appointmentDate');
  }

  if (!referral.appointmentTime) {
    missingFields.push('appointmentTime');
  }

  if (!referral.lastUpdated) {
    missingFields.push('lastUpdated');
  }

  // Check if referral is eligible for consultation time calculation
  const hasValidConsultationTime = 
    referral.status === 'completed' && 
    !!referral.appointmentDate && 
    !!referral.appointmentTime && 
    !!referral.lastUpdated;

  // Validate date format
  if (referral.appointmentDate) {
    const date = new Date(referral.appointmentDate);
    if (isNaN(date.getTime())) {
      errors.push('Invalid appointmentDate format');
    }
  }

  // Validate time format
  if (referral.appointmentTime) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?(AM|PM))?$/i;
    if (!timeRegex.test(referral.appointmentTime)) {
      errors.push('Invalid appointmentTime format');
    }
  }

  // Validate lastUpdated timestamp
  if (referral.lastUpdated) {
    const lastUpdated = new Date(referral.lastUpdated);
    if (isNaN(lastUpdated.getTime())) {
      errors.push('Invalid lastUpdated timestamp format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasValidConsultationTime,
    missingFields
  };
}

/**
 * Get validation summary for a collection of appointments and referrals
 */
export function getValidationSummary(
  appointments: Appointment[],
  referrals: Referral[]
): {
  totalAppointments: number;
  totalReferrals: number;
  validForConsultationTime: number;
  invalidForConsultationTime: number;
  validationErrors: string[];
  validationWarnings: string[];
} {
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];
  let validForConsultationTime = 0;
  let invalidForConsultationTime = 0;

  // Validate appointments
  appointments.forEach((appointment, index) => {
    const validation = validateAppointmentForConsultationTime(appointment);
    if (validation.hasValidConsultationTime) {
      validForConsultationTime++;
    } else {
      invalidForConsultationTime++;
    }
    
    validation.errors.forEach(error => {
      validationErrors.push(`Appointment ${index + 1} (${appointment.id}): ${error}`);
    });
    
    validation.warnings.forEach(warning => {
      validationWarnings.push(`Appointment ${index + 1} (${appointment.id}): ${warning}`);
    });
  });

  // Validate referrals
  referrals.forEach((referral, index) => {
    const validation = validateReferralForConsultationTime(referral);
    if (validation.hasValidConsultationTime) {
      validForConsultationTime++;
    } else {
      invalidForConsultationTime++;
    }
    
    validation.errors.forEach(error => {
      validationErrors.push(`Referral ${index + 1} (${referral.id}): ${error}`);
    });
    
    validation.warnings.forEach(warning => {
      validationWarnings.push(`Referral ${index + 1} (${referral.id}): ${warning}`);
    });
  });

  return {
    totalAppointments: appointments.length,
    totalReferrals: referrals.length,
    validForConsultationTime,
    invalidForConsultationTime,
    validationErrors,
    validationWarnings
  };
}
