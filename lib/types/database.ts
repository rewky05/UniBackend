// Types matching your exact Firebase database structure

export interface FeeHistoryEntry {
  fee: number;
  effectiveDate: string;
  status: 'active' | 'inactive';
}

export interface BaseEntity {
  id?: string;
  createdAt?: string;
  lastUpdated?: string;
}

// Doctors from your database - detailed information
export interface Doctor {
  id?: string;
  userId: string;
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  contactNumber: string;
  address?: string;
  addressLine?: string;
  schedules?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  dateOfBirth?: string;
  gender?: string;
  civilStatus?: string;
  specialty: string;
  isSpecialist: boolean;
  isGeneralist: boolean;
  professionalFee?: number; // Professional fee in Philippine pesos
  feeHistory?: FeeHistoryEntry[]; // History of professional fee changes
  status: 'verified' | 'pending' | 'suspended';
  profileImageUrl?: string;
  prcId?: string;
  prcExpiryDate?: string;
  medicalLicenseNumber?: string;
  clinicAffiliations?: string[];
  lastLogin?: string;
  createdAt?: string;
  lastUpdated?: string;
  // Computed fields added by the service
  resolvedAddress?: string;
  resolvedFullAddress?: string;
}

// Clinics from your database
export interface Clinic {
  id?: string;
  name: string;
  address?: string;
  addressLine?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  email: string;
  phone: string;
  type: 'hospital' | 'multi_specialty_clinic' | 'community_clinic' | 'private_clinic';
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  // Computed fields added by the service
  resolvedAddress?: string;
  resolvedFullAddress?: string;
  streetAddress?: string;
  locationDetails?: string;
  addressComponents?: {
    address: string;
    city: string;
    province: string;
    zipCode: string;
    addressLine: string;
  };
}

// Feedback from your database
export interface Feedback {
  id?: string;
  patientId?: string;
  providerId?: string;
  doctorId?: string;
  clinicId?: string;
  practiceLocationName?: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  comments?: string;
  comment?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentType?: string;
  treatmentType?: string;
  clinicAppointmentId?: string;
  referralId?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  submittedBy?: {
    role: string;
    userId: string;
  };
  timestamp?: string;
  date?: string;
  createdAt?: string;
  isAnonymous?: boolean;
  status?: string;
  tags?: string[];
  
  // Resolved fields from enhanced service
  patientName?: string;
  patientEmail?: string;
  patientFirstName?: string;
  patientLastName?: string;
  doctorName?: string;
  doctorFirstName?: string;
  doctorLastName?: string;
  clinicName?: string;
}

// Users from your database - only immutable fields
export interface User {
  id?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  role: 'admin' | 'generalist' | 'specialist' | 'patient';
  patientId?: string; // For patients
  doctorId?: string; // For doctors
  createdAt?: string;
}

// Appointments from your database
export interface Appointment {
  id?: string;
  patientId: string;
  doctorId?: string;
  clinicId: string;
  appointmentDate: string;
  appointmentTime: string;
  type: 'general_consultation' | 'emergency_assessment' | 'lab_booking' | 'walk_in';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  specialty?: string;
  notes?: string;
  patientComplaint?: string[];
  bookedByUserId: string;
  createdAt: string;
  lastUpdated: string;
  sourceSystem: string;
  relatedReferralId?: string;
  // Computed fields added by the service
  patientFirstName?: string;
  patientLastName?: string;
  doctorFirstName?: string;
  doctorLastName?: string;
  clinicName?: string;
  bookedByUserFirstName?: string;
  bookedByUserLastName?: string;
}

// Patients from your database - detailed information
export interface Patient {
  id?: string;
  userId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  email?: string; // Added from users node
  profileImageUrl?: string; // Added from users node
  highestEducationalAttainment?: string;
  address?: string;
  addressLine?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  bloodType?: string;
  allergies?: string[];
  medicalConditions?: string[];
  isActive?: boolean;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  lastUpdated: string;
  // Computed fields added by the service
  resolvedAddress?: string;
  resolvedFullAddress?: string;
  streetAddress?: string;
  locationDetails?: string;
  addressComponents?: {
    address: string;
    city: string;
    province: string;
    zipCode: string;
    addressLine: string;
  };
}

// Referrals from your database
export interface Referral {
  id?: string;
  patientId: string;
  referringGeneralistId: string;
  assignedSpecialistId: string;
  clinicAppointmentId: string;
  initialReasonForReferral: string;
  generalistNotes: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'pending_acceptance' | 'confirmed' | 'completed' | 'cancelled';
  referralTimestamp: string;
  referralType?: 'generalist' | 'specialist';
  lastUpdated: string;
  patientArrivalConfirmed: boolean;
  practiceLocation: {
    clinicId: string;
    roomOrUnit: string;
  };
  referringClinicId: string;
  sourceSystem: string;
  specialistScheduleId: string;
  scheduleSlotPath: string;
  // Computed fields added by the service
  specialistClinicName?: string;
  referringClinicName?: string;
  patientFirstName?: string;
  patientLastName?: string;
  assignedSpecialistFirstName?: string;
  assignedSpecialistLastName?: string;
  referringGeneralistFirstName?: string;
  referringGeneralistLastName?: string;
  referringSpecialistFirstName?: string;
  referringSpecialistLastName?: string;
}

// Specialist Referrals - Additional structure for specialist-to-specialist referrals
export interface SpecialistReferral {
  id?: string;
  additionalNotes?: string;
  appointmentDate: string;
  appointmentTime: string;
  assignedSpecialistId: string;
  clinicAppointmentId: string;
  createdAt: string;
  lastUpdated: string;
  patientId: string;
  practiceLocation: {
    clinicId: string;
    roomOrUnit: string;
  };
  referralConsultationId: string;
  referralTimestamp: string;
  referringClinicId: string;
  referringClinicName: string;
  referringSpecialistFirstName: string;
  referringSpecialistId: string;
  referringSpecialistLastName: string;
  referralType?: 'generalist' | 'specialist';
  sourceSystem: string;
  specialistScheduleId: string;
  status: 'pending' | 'pending_acceptance' | 'confirmed' | 'completed' | 'cancelled';
  updatedAt: string;
  
  // Computed fields added by the service
  specialistClinicName?: string;
  patientFirstName?: string;
  patientLastName?: string;
  assignedSpecialistFirstName?: string;
  assignedSpecialistLastName?: string;
}

// Activity Logs - This will be created automatically by the system
export interface ActivityLog {
  id?: string;
  timestamp: string;
  action: string;
  adminUserId: string;
  adminEmail: string;
  targetType: 'doctor' | 'clinic' | 'feedback' | 'appointment' | 'patient' | 'system';
  targetId: string;
  targetName: string;
  details: Record<string, any>;
}

// Dashboard Stats - Calculated from other data
export interface DashboardStats {
  totalDoctors: number;
  verifiedDoctors: number;
  pendingVerification: number;
  suspendedDoctors: number;
  totalClinics: number;
  activeClinics: number;
  totalFeedback: number;
  averageRating: number;
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  totalPatients: number;
  totalReferrals: number;
  consultationTimeStats?: {
    averageConsultationTimeMinutes: number;
    totalCompletedConsultations: number;
    shortestConsultationMinutes: number;
    longestConsultationMinutes: number;
    averageBySpecialty: Record<string, number>;
  };
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'referral' | 'appointment' | 'fee_change' | 'verification' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  timestamp: number;
  expiresAt: number;
  relatedId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: 'referral' | 'appointment' | 'fee_change' | 'verification' | 'system';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  relatedId?: string;
  expiresInDays?: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Paginated Response wrapper
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Filter interfaces
export interface DoctorFilters {
  specialty?: string;
  status?: string;
  clinic?: string;
  isGeneralist?: boolean;
  isSpecialist?: boolean;
  search?: string;
}

export interface FeedbackFilters {
  rating?: number;
  clinicId?: string;
  providerId?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface AppointmentFilters {
  status?: string;
  type?: string;
  clinicId?: string;
  doctorId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Medical Services Catalogs
export interface MedicalSpecialty {
  id?: string;
  name: string;
  description?: string;
}

export interface LabTest {
  id?: string;
  name: string;
  description: string;
}

export interface ImagingTest {
  id?: string;
  name: string;
  description: string;
}

export interface ConsultationType {
  id?: string;
  name: string;
  description: string;
}

// System Settings
export interface SystemSettings {
  defaultAppointmentDuration: number;
  appointmentDurationUnit: 'minutes' | 'hours';
  lastUpdated?: string;
  updatedBy?: string;
}