// Export all services
export * from './base.service';
export * from './doctors.service';
export * from './feedback.service';
export * from './activity-logs.service';
export * from './schedules.service';

// Export service instances
export { doctorsService } from './doctors.service';
export { feedbackService } from './feedback.service';
export { activityLogsService } from './activity-logs.service';
export { schedulesService, clinicsService, doctorClinicAffiliationsService } from './schedules.service';