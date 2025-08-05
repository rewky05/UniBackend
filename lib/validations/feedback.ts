import { z } from "zod";

// Base feedback validation schema
export const feedbackSchema = z.object({
  patientName: z.string().min(2, "Patient name must be at least 2 characters").max(100, "Patient name must be less than 100 characters"),
  patientEmail: z.string().email("Please enter a valid email address").optional(),
  doctorId: z.string().min(1, "Please select a doctor"),
  clinicId: z.string().min(1, "Please select a clinic"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z.string().min(10, "Comment must be at least 10 characters").max(1000, "Comment must be less than 1000 characters"),
  tags: z.array(z.string()).optional().default([]),
  appointmentDate: z.string().optional(),
  treatmentType: z.string().max(100, "Treatment type must be less than 100 characters").optional(),
  isAnonymous: z.boolean().optional().default(false),
});

// Create feedback schema
export const createFeedbackSchema = feedbackSchema;

// Update feedback schema
export const updateFeedbackSchema = z.object({
  id: z.string().min(1, "Feedback ID is required"),
  status: z.enum(["pending", "reviewed", "flagged", "archived"], {
    required_error: "Please select a status",
  }),
  reviewedBy: z.string().optional(),
  reviewNotes: z.string().max(500, "Review notes must be less than 500 characters").optional(),
  tags: z.array(z.string()).optional(),
});

// Feedback filters schema
export const feedbackFiltersSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  status: z.enum(["pending", "reviewed", "flagged", "archived"]).optional(),
  doctorId: z.string().optional(),
  clinicId: z.string().optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
});

// Bulk feedback update schema
export const bulkFeedbackUpdateSchema = z.object({
  feedbackIds: z.array(z.string()).min(1, "Please select at least one feedback"),
  status: z.enum(["pending", "reviewed", "flagged", "archived"], {
    required_error: "Please select a status",
  }),
  reviewedBy: z.string().optional(),
  reviewNotes: z.string().max(500, "Review notes must be less than 500 characters").optional(),
});

// Feedback response schema (for admin responses)
export const feedbackResponseSchema = z.object({
  feedbackId: z.string().min(1, "Feedback ID is required"),
  response: z.string().min(10, "Response must be at least 10 characters").max(1000, "Response must be less than 1000 characters"),
  respondedBy: z.string().min(1, "Responder ID is required"),
});

// Export types
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
export type FeedbackFiltersInput = z.infer<typeof feedbackFiltersSchema>;
export type BulkFeedbackUpdateInput = z.infer<typeof bulkFeedbackUpdateSchema>;
export type FeedbackResponseInput = z.infer<typeof feedbackResponseSchema>;