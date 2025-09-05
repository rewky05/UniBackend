// Base types
export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

// User types - only immutable fields
export interface User {
  id?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  role: 'admin' | 'generalist' | 'specialist' | 'clinic_staff' | 'lab_technician' | 'billing_clerk' | 'patient';
  patientId?: string; // For patients
  doctorId?: string; // For doctors
  createdAt?: string;
}

// Doctor related types
export interface Doctor extends BaseEntity {
  userId: string;
  // Personal Information
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  contactNumber: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  civilStatus?: string;
  
  // Professional Information
  specialty: string;
  isSpecialist: boolean;
  isGeneralist: boolean;
  professionalFee?: number;
  prcId?: string;
  prcExpiryDate?: string;
  medicalLicenseNumber?: string;
  clinicAffiliations?: string[];
  
  // Status and Verification
  status: 'pending' | 'verified' | 'suspended';
  profileImageUrl?: string;
  
  // System fields
  lastLogin?: string;
  createdAt?: string;
  lastUpdated?: string;
}

export interface CreateDoctorDto {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  civilStatus?: string;
  specialty: string;
  medicalLicense?: string;
  prcId?: string;
  prcExpiry?: string;
  professionalFee?: number;
  schedules?: any[];
}

export interface UpdateDoctorDto extends Partial<CreateDoctorDto> {
  status?: 'pending' | 'verified' | 'suspended' | 'rejected';
  verificationDate?: number;
  verifiedBy?: string;
  lastLoginAt?: number;
  isActive?: boolean;
}

// Clinic related types
export interface Clinic extends BaseEntity {
  name: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;
  phone: string;
  email?: string;
  type: 'hospital' | 'multi_specialty_clinic' | 'community_clinic' | 'private_clinic';
  isActive: boolean;
}

export interface DoctorClinicAffiliation extends BaseEntity {
  doctorId: string;
  clinicId: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

// Schedule related types
export interface Schedule extends BaseEntity {
  doctorId: string;
  clinicId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
  isActive: boolean;
  notes?: string;
}

export interface ScheduleBlock {
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface ClinicSchedule {
  clinicId: string;
  schedules: {
    [dayOfWeek: number]: ScheduleBlock[];
  };
}

// Feedback related types
export interface Feedback extends BaseEntity {
  patientName: string;
  patientEmail?: string;
  doctorId: string;
  clinicId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  tags: string[];
  status: 'pending' | 'reviewed' | 'flagged' | 'archived';
  reviewedBy?: string;
  reviewedAt?: number;
  reviewNotes?: string;
  
  // Metadata
  appointmentDate?: string;
  treatmentType?: string;
  isAnonymous: boolean;
}

export interface CreateFeedbackDto {
  patientName: string;
  patientEmail?: string;
  doctorId: string;
  clinicId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  tags?: string[];
  appointmentDate?: string;
  treatmentType?: string;
  isAnonymous?: boolean;
}

export interface UpdateFeedbackDto {
  status?: 'pending' | 'reviewed' | 'flagged' | 'archived';
  reviewedBy?: string;
  reviewedAt?: number;
  reviewNotes?: string;
  tags?: string[];
}

// Activity Log types
export interface ActivityLog extends BaseEntity {
  userId: string;
  userEmail: string;
  action: string;
  category: 'verification' | 'schedule' | 'document' | 'profile' | 'system' | 'feedback';
  targetId?: string;
  targetType?: 'doctor' | 'clinic' | 'feedback' | 'schedule';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateActivityLogDto {
  userId: string;
  userEmail: string;
  action: string;
  category: 'verification' | 'schedule' | 'document' | 'profile' | 'system' | 'feedback';
  targetId?: string;
  targetType?: 'doctor' | 'clinic' | 'feedback' | 'schedule' | 'patient';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Patient types
export interface Patient extends BaseEntity {
  userId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  highestEducationalAttainment?: string;
  address?: string;
  bloodType?: string;
  allergies?: string[];
  medicalConditions?: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  lastUpdated: string;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  educationalAttainment?: string;
  bloodType?: string;
  allergies?: string[];
  medicalConditions?: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  address?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {
  lastUpdated?: number;
}

export interface PatientFilters {
  gender?: string;
  bloodType?: string;
  search?: string;
}

// Document types
export interface Document extends BaseEntity {
  doctorId: string;
  type: 'prc_license' | 'medical_diploma' | 'specialty_certificate' | 'other';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: number;
  reviewNotes?: string;
}

// Statistics types
export interface DashboardStats {
  totalDoctors: number;
  verifiedDoctors: number;
  pendingVerification: number;
  suspendedDoctors: number;
  totalFeedback: number;
  averageRating: number;
  pendingFeedback: number;
  flaggedFeedback: number;
  totalClinics: number;
  activeClinics: number;
}

// Filter and pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface DoctorFilters {
  specialty?: string;
  status?: 'pending' | 'verified' | 'suspended' | 'rejected';
  clinic?: string;
  search?: string;
}

export interface FeedbackFilters {
  rating?: 1 | 2 | 3 | 4 | 5;
  status?: 'pending' | 'reviewed' | 'flagged' | 'archived';
  doctorId?: string;
  clinicId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ActivityLogFilters {
  category?: 'verification' | 'schedule' | 'document' | 'profile' | 'system' | 'feedback';
  userId?: string;
  targetType?: 'doctor' | 'clinic' | 'feedback' | 'schedule';
  dateRange?: {
    start: string;
    end: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface FirebaseError {
  code: string;
  message: string;
}

// Fee Change Request types
export interface FeeChangeRequest {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  previousFee: number;
  requestedFee: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  lastUpdated: string;
}

export interface CreateFeeChangeRequestDto {
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  previousFee: number;
  requestedFee: number;
  reason?: string;
}

export interface UpdateFeeChangeRequestDto {
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface FeeChangeRequestFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  doctorName?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  feeRange?: {
    min: number;
    max: number;
  };
}

// Utility types
export type DoctorStatus = Doctor['status'];
export type FeedbackStatus = Feedback['status'];
export type ActivityCategory = ActivityLog['category'];
export type ClinicType = Clinic['type'];
export type DocumentType = Document['type'];
export type DocumentStatus = Document['status'];
export type FeeChangeRequestStatus = FeeChangeRequest['status'];