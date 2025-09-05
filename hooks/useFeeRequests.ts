import { useState, useEffect, useCallback } from 'react';
import { feeRequestsService } from '@/lib/services/fee-requests.service';
import type { 
  FeeChangeRequest, 
  CreateFeeChangeRequestDto, 
  UpdateFeeChangeRequestDto,
  FeeChangeRequestFilters
} from '@/lib/types';

// Hook for getting all fee change requests with real-time updates
export function useFeeRequests() {
  const [requests, setRequests] = useState<FeeChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 [useFeeRequests] Setting up subscription...');
    
    const unsubscribe = feeRequestsService.subscribeToFeeRequests(
      (requestsData) => {
        console.log('📊 [useFeeRequests] Received requests data:', {
          count: requestsData?.length || 0,
          data: requestsData?.map(req => ({
            id: req.id,
            doctorName: req.doctorName,
            status: req.status,
            previousFee: req.previousFee,
            requestedFee: req.requestedFee
          })) || [],
          allRequests: requestsData?.map(req => ({
            id: req.id,
            doctorName: req.doctorName,
            status: req.status
          })) || []
        });
        
        setRequests(requestsData || []);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('❌ [useFeeRequests] Subscription error:', error);
        setError(error.message || 'Failed to load fee requests');
        setLoading(false);
        setRequests([]);
      }
    );

    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    console.log('🔄 [useFeeRequests] Refreshing data...');
    setLoading(true);
    setError(null);
    // The subscription will handle the update
  }, []);

  return { 
    requests, 
    loading, 
    error, 
    refresh,
    total: requests.length 
  };
}

// Hook for getting pending fee change requests only (real-time)
export function usePendingFeeRequests() {
  const [requests, setRequests] = useState<FeeChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 [usePendingFeeRequests] Setting up real-time subscription...');
    
    const unsubscribe = feeRequestsService.subscribeToFeeRequests(
      (allRequests) => {
        // Filter for pending requests only
        const pendingRequests = allRequests.filter(req => req.status === 'pending');
        
        console.log('📊 [usePendingFeeRequests] Received real-time data:', {
          totalRequests: allRequests?.length || 0,
          pendingCount: pendingRequests?.length || 0,
          allRequests: allRequests?.map(req => ({
            id: req.id,
            doctorName: req.doctorName,
            status: req.status,
            professionalFeeStatus: req.status
          })) || [],
          pendingRequests: pendingRequests?.map(req => ({
            id: req.id,
            doctorName: req.doctorName,
            status: req.status,
            previousFee: req.previousFee,
            requestedFee: req.requestedFee
          })) || []
        });
        
        setRequests(pendingRequests || []);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('❌ [usePendingFeeRequests] Subscription error:', error);
        setError(error.message || 'Failed to load pending requests');
        setLoading(false);
        setRequests([]);
      }
    );

    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    console.log('🔄 [usePendingFeeRequests] Refreshing data...');
    setLoading(true);
    setError(null);
    // The subscription will handle the update
  }, []);

  return { 
    requests, 
    loading, 
    error, 
    refresh,
    count: requests.length 
  };
}

// Hook for fee request actions
export function useFeeRequestActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFeeRequest = useCallback(async (
    requestData: CreateFeeChangeRequestDto, 
    createdBy?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const requestId = await feeRequestsService.createFeeChangeRequest(requestData, createdBy);
      return requestId;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRequestStatus = useCallback(async (
    requestId: string,
    updates: UpdateFeeChangeRequestDto,
    reviewedBy?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      await feeRequestsService.updateFeeRequestStatus(requestId, updates, reviewedBy);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkApproveRequests = useCallback(async (
    requestIds: string[],
    reviewedBy: string,
    reviewNotes?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      await feeRequestsService.bulkApproveRequests(requestIds, reviewedBy, reviewNotes);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkRejectRequests = useCallback(async (
    requestIds: string[],
    reviewedBy: string,
    reviewNotes: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      await feeRequestsService.bulkRejectRequests(requestIds, reviewedBy, reviewNotes);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createFeeRequest,
    updateRequestStatus,
    bulkApproveRequests,
    bulkRejectRequests,
    loading,
    error
  };
}

// Hook for filtered fee requests
export function useFilteredFeeRequests(
  requests: FeeChangeRequest[],
  filters: FeeChangeRequestFilters
) {
  const [filteredRequests, setFilteredRequests] = useState<FeeChangeRequest[]>([]);

  useEffect(() => {
    const filtered = feeRequestsService.filterRequests(requests, filters);
    setFilteredRequests(filtered);
  }, [requests, filters]);

  return filteredRequests;
}
