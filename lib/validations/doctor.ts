import { z } from "zod";

// Base doctor validation schema
export const doctorSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name must be less than 50 characters"),
  middleName: z.string().max(50, "Middle name must be less than 50 characters").optional(),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^\+63\s?\d{3}\s?\d{3}\s?\d{4}$/, "Please enter a valid Philippine phone number (+63 XXX XXX XXXX)"),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  civilStatus: z.string().optional(),

  // Professional Information
  specialty: z.string().min(2, "Please select a specialty"),
  medicalLicenseNumber: z.string().optional(),
  prcId: z.string().optional(),
  prcExpiryDate: z.string().optional(),
  professionalFee: z.number().optional(),
  schedules: z.array(z.any()).optional(),
});

// Create doctor schema (for new doctor registration)
export const createDoctorSchema = doctorSchema;

// Update doctor schema (all fields optional except ID)
export const updateDoctorSchema = doctorSchema.partial().extend({
  id: z.string().min(1, "Doctor ID is required"),
});

// Doctor status update schema
export const doctorStatusSchema = z.object({
  id: z.string().min(1, "Doctor ID is required"),
  status: z.enum(["pending", "verified", "suspended", "rejected"], {
    required_error: "Please select a status",
  }),
  verifiedBy: z.string().optional(),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
});

// Bulk status update schema
export const bulkStatusUpdateSchema = z.object({
  doctorIds: z.array(z.string()).min(1, "Please select at least one doctor"),
  status: z.enum(["pending", "verified", "suspended", "rejected"], {
    required_error: "Please select a status",
  }),
  updatedBy: z.string().optional(),
});

// Doctor search/filter schema
export const doctorFiltersSchema = z.object({
  specialty: z.string().optional(),
  status: z.enum(["pending", "verified", "suspended", "rejected"]).optional(),
  clinic: z.string().optional(),
  search: z.string().optional(),
});

// Doctor clinic affiliation schema
export const doctorClinicAffiliationSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  clinicId: z.string().min(1, "Clinic ID is required"),
  startDate: z.string().refine((date) => {
    return new Date(date) <= new Date();
  }, "Start date cannot be in the future"),
  endDate: z.string().optional().refine((date) => {
    if (!date) return true;
    return new Date(date) > new Date();
  }, "End date must be in the future"),
});

// Export types
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type DoctorStatusInput = z.infer<typeof doctorStatusSchema>;
export type BulkStatusUpdateInput = z.infer<typeof bulkStatusUpdateSchema>;
export type DoctorFiltersInput = z.infer<typeof doctorFiltersSchema>;
export type DoctorClinicAffiliationInput = z.infer<typeof doctorClinicAffiliationSchema>;