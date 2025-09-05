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

export type FeeChangeRequestStatus = FeeChangeRequest['status'];
