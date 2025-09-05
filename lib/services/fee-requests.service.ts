import { query, orderByChild, equalTo, get, onValue, off, ref, set } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import { BaseFirebaseService } from './base.service';
import { activityLogsService } from './activity-logs.service';
import { notificationsService } from './notifications.service';
import type { 
  FeeChangeRequest, 
  CreateFeeChangeRequestDto, 
  UpdateFeeChangeRequestDto,
  FeeChangeRequestFilters,
  CreateActivityLogDto
} from '@/lib/types';

export class FeeRequestsService extends BaseFirebaseService<FeeChangeRequest> {
  private doctorsRef;

  constructor() {
    super('feeChangeRequests'); // Keep for compatibility but we'll use doctors collection
    this.doctorsRef = ref(db, 'doctors');
  }

  /**
   * Get the collection reference
   */
  get ref() {
    return this.collectionRef;
  }

  /**
   * Create a new fee change request
   */
  async createFeeChangeRequest(
    requestData: CreateFeeChangeRequestDto, 
    createdBy?: string
  ): Promise<string> {
    try {
      const requestId = await this.create({
        ...requestData,
        requestDate: new Date().toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });

      // Log the activity
      if (createdBy) {
        await activityLogsService.createActivityLog({
          userId: createdBy,
          userEmail: createdBy,
          action: 'Fee change request submitted',
          category: 'fee_management',
          targetId: requestId,
          targetType: 'fee_request',
          details: {
            doctorId: requestData.doctorId,
            previousFee: requestData.previousFee,
            requestedFee: requestData.requestedFee,
            reason: requestData.reason || ''
          }
        });
      }

      return requestId;
    } catch (error) {
      this.handleError('createFeeChangeRequest', error);
      throw error;
    }
  }

  /**
   * Update fee change request status
   */
  async updateFeeRequestStatus(
    requestId: string,
    updates: UpdateFeeChangeRequestDto,
    reviewedBy?: string
  ): Promise<void> {
    try {
      console.log('🔍 [FeeRequestsService] Updating fee change request status:', {
        requestId,
        updates,
        reviewedBy
      });

      // Update the doctor's record in the doctors collection
      const doctorRef = ref(db, `doctors/${requestId}`);
      const snapshot = await get(doctorRef);
      
      if (!snapshot.exists()) {
        throw new Error('Doctor not found');
      }

      const doctor = snapshot.val();
      // Determine the new professional fee based on approval/rejection
      let newProfessionalFee = doctor.professionalFee;
      if (updates.status === 'approved') {
        // If approved, set to requested fee
        newProfessionalFee = doctor.feeChangeRequest?.requestedFee || doctor.professionalFee;
      } else if (updates.status === 'rejected') {
        // If rejected, set to previous fee (revert to original)
        newProfessionalFee = doctor.feeChangeRequest?.previousFee || doctor.previousFee || doctor.professionalFee;
      }

      const updateData = {
        professionalFeeStatus: updates.status === 'approved' ? 'approved' : updates.status === 'rejected' ? 'rejected' : 'pending',
        professionalFee: newProfessionalFee,
        lastUpdated: new Date().toISOString()
      };

      // Update feeChangeRequest with review information
      if (updates.status === 'approved' || updates.status === 'rejected') {
        updateData.feeChangeRequest = {
          ...doctor.feeChangeRequest,
          reviewedBy: reviewedBy || '',
          reviewedAt: new Date().toISOString(),
          reviewNotes: updates.reviewNotes || ''
        };
      }

      console.log('📝 [FeeRequestsService] Updating doctor record:', {
        doctorId: requestId,
        updateData
      });

      await set(doctorRef, { ...doctor, ...updateData });

      // Log the activity
      if (reviewedBy) {
        await activityLogsService.createActivityLog({
          userId: reviewedBy,
          userEmail: reviewedBy,
          action: `Fee change request ${updates.status}`,
          category: 'fee_management',
          targetId: requestId,
          targetType: 'doctor',
          details: {
            newStatus: updates.status,
            reviewNotes: updates.reviewNotes || '',
            reviewedBy,
            previousFee: doctor.previousFee || doctor.professionalFee,
            newFee: updates.status === 'approved' ? doctor.feeChangeRequest?.requestedFee : doctor.professionalFee
          }
        });
      }

      // Create notification for the doctor
      if (updates.status === 'approved' || updates.status === 'rejected') {
        try {
          const previousFee = doctor.feeChangeRequest?.previousFee || doctor.previousFee || doctor.professionalFee;
          const requestedFee = doctor.feeChangeRequest?.requestedFee || doctor.professionalFee;
          
          await notificationsService.createFeeChangeNotification(
            requestId, // doctorId
            updates.status,
            previousFee,
            requestedFee,
            updates.reviewNotes
          );
          
          console.log('🔔 [FeeRequestsService] Notification created for doctor:', requestId);
        } catch (notificationError) {
          console.error('❌ [FeeRequestsService] Failed to create notification:', notificationError);
          // Don't throw error to prevent breaking the main operation
        }
      }

      console.log('✅ [FeeRequestsService] Fee change request status updated successfully');
    } catch (error) {
      console.error('❌ [FeeRequestsService] Error updating fee request status:', error);
      this.handleError('updateFeeRequestStatus', error);
      throw error;
    }
  }

  /**
   * Get pending fee change requests
   */
  async getPendingFeeRequests(): Promise<FeeChangeRequest[]> {
    try {
      console.log('🔍 [FeeRequestsService] Fetching pending fee change requests from doctors collection...');
      
      // Get all doctors and filter for specialists with pending fee change requests
      const snapshot = await get(this.doctorsRef);
      console.log('📊 [FeeRequestsService] Doctors snapshot:', {
        exists: snapshot.exists ? snapshot.exists() : false,
        hasChildren: snapshot.hasChildren ? snapshot.hasChildren() : 'N/A',
        numChildren: snapshot.numChildren ? snapshot.numChildren() : 'N/A',
        snapshotType: typeof snapshot
      });
      
      const requests: FeeChangeRequest[] = [];
      
      if (snapshot.exists && snapshot.exists()) {
        console.log('📋 [FeeRequestsService] Processing doctors for pending fee change requests...');
        
        try {
          const snapshotData = snapshot.val();
          console.log('📊 [FeeRequestsService] Snapshot data:', {
            dataType: typeof snapshotData,
            isObject: snapshotData && typeof snapshotData === 'object',
            keys: snapshotData ? Object.keys(snapshotData) : []
          });

          if (snapshotData && typeof snapshotData === 'object') {
            console.log('🔍 [FeeRequestsService] Processing doctors data. Total doctors found:', Object.keys(snapshotData).length);
            
            // Process each doctor in the snapshot data
            Object.keys(snapshotData).forEach((doctorId) => {
              const doctor = snapshotData[doctorId];
              
              // Special logging for the specific doctor we know has a request
              if (doctorId === 'J0zVFWQlgQcyqkPNBvtVAGOu6U62') {
                console.log('🎯 [FeeRequestsService] FOUND TARGET DOCTOR (getPendingFeeRequests):', {
                  id: doctorId,
                  firstName: doctor?.firstName,
                  lastName: doctor?.lastName,
                  isSpecialist: doctor?.isSpecialist,
                  professionalFeeStatus: doctor?.professionalFeeStatus,
                  feeChangeRequest: doctor?.feeChangeRequest,
                  allFields: Object.keys(doctor || {}),
                  rawDoctor: doctor
                });
              }
              
              console.log('👨‍⚕️ [FeeRequestsService] Checking doctor:', {
                id: doctorId,
                firstName: doctor?.firstName,
                lastName: doctor?.lastName,
                isSpecialist: doctor?.isSpecialist,
                professionalChangeRequest: doctor?.professionalChangeRequest,
                professionalFeeStatus: doctor?.professionalFeeStatus,
                professionalFee: doctor?.professionalFee,
                feeChangeRequest: doctor?.feeChangeRequest,
                // Log all available fields to see what's actually there
                allFields: Object.keys(doctor || {}),
                // Check for alternative field names
                hasFeeChangeRequest: doctor?.feeChangeRequest,
                hasProfessionalFeeStatus: doctor?.professionalFeeStatus,
                hasRequestedFee: doctor?.requestedFee,
                hasPreviousFee: doctor?.previousFee
              });
              
              // Check if doctor has pending fee change request (not yet processed)
              const hasPendingRequest = 
                doctor?.professionalFeeStatus === 'pending' ||
                doctor?.professionalChangeRequest === 'pending' ||
                doctor?.feeChangeRequest === 'pending';
              
              const isSpecialist = doctor?.isSpecialist === true;
              
              console.log('🔍 [FeeRequestsService] Doctor evaluation:', {
                doctorId,
                isSpecialist,
                hasPendingRequest,
                professionalChangeRequest: doctor?.professionalChangeRequest,
                professionalFeeStatus: doctor?.professionalFeeStatus,
                feeChangeRequest: doctor?.feeChangeRequest
              });
              
              // Check if doctor is specialist and has pending fee change request
              if (doctor && 
                  typeof doctor === 'object' && 
                  isSpecialist && 
                  hasPendingRequest) {
                
                const request: FeeChangeRequest = {
                  id: doctorId,
                  doctorId: doctorId,
                  doctorName: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
                  doctorEmail: doctor.email || '',
                  previousFee: doctor.feeChangeRequest?.previousFee || doctor.previousFee || doctor.professionalFee || 0,
                  requestedFee: doctor.feeChangeRequest?.requestedFee || doctor.requestedFee || doctor.professionalFee || 0,
                  requestDate: doctor.feeChangeRequest?.requestDate || doctor.requestDate || doctor.lastUpdated || new Date().toISOString(),
                  status: doctor.professionalFeeStatus || 'pending',
                  reason: doctor.feeChangeRequest?.reason || doctor.reason || '',
                  createdAt: doctor.createdAt || new Date().toISOString(),
                  lastUpdated: doctor.lastUpdated || new Date().toISOString()
                };
                
                requests.push(request);
                console.log('✅ [FeeRequestsService] Added pending fee change request:', request);
              } else {
                console.log('❌ [FeeRequestsService] Doctor does not meet criteria:', {
                  doctorId,
                  isSpecialist,
                  hasPendingRequest,
                  reason: !isSpecialist ? 'Not a specialist' : 'No pending fee change request'
                });
              }
            });
          } else {
            console.log('📭 [FeeRequestsService] No valid data found in snapshot');
          }
        } catch (dataError) {
          console.error('❌ [FeeRequestsService] Error processing snapshot data:', dataError);
          throw new Error('Failed to process snapshot data');
        }
      } else {
        console.log('📭 [FeeRequestsService] No doctors data found');
      }
      
      const sortedRequests = requests.sort((a, b) => {
        const dateA = new Date(a.requestDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.requestDate || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      console.log('📈 [FeeRequestsService] Final pending fee change requests:', {
        totalCount: sortedRequests.length,
        requests: sortedRequests.map(req => ({
          id: req.id,
          doctorName: req.doctorName,
          status: req.status,
          previousFee: req.previousFee,
          requestedFee: req.requestedFee,
          requestDate: req.requestDate
        }))
      });
      
      return sortedRequests;
    } catch (error) {
      console.error('❌ [FeeRequestsService] Error fetching pending requests:', error);
      this.handleError('getPendingFeeRequests', error);
      throw error;
    }
  }

  /**
   * Get fee change requests by doctor ID
   */
  async getFeeRequestsByDoctor(doctorId: string): Promise<FeeChangeRequest[]> {
    try {
      console.log('🔍 [FeeRequestsService] Fetching fee change requests for doctor:', doctorId);
      
      // Get specific doctor and check if they have a fee change request
      const doctorRef = ref(db, `doctors/${doctorId}`);
      const snapshot = await get(doctorRef);
      
      const requests: FeeChangeRequest[] = [];
      
      if (snapshot.exists()) {
        const doctor = snapshot.val();
        console.log('👨‍⚕️ [FeeRequestsService] Doctor found:', {
          id: doctorId,
          firstName: doctor?.firstName,
          lastName: doctor?.lastName,
          isSpecialist: doctor?.isSpecialist,
          professionalChangeRequest: doctor?.professionalChangeRequest,
          professionalFee: doctor?.professionalFee
        });
        
        // Check if doctor is specialist and has pending fee change request (not yet processed)
        const hasPendingRequest = 
          doctor?.professionalFeeStatus === 'pending' ||
          doctor?.professionalChangeRequest === 'pending' ||
          doctor?.feeChangeRequest === 'pending';
        
        if (doctor && 
            typeof doctor === 'object' && 
            doctor.isSpecialist === true && 
            hasPendingRequest) {
          
          const request: FeeChangeRequest = {
            id: doctorId,
            doctorId: doctorId,
            doctorName: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
            doctorEmail: doctor.email || '',
            previousFee: doctor.previousFee || doctor.professionalFee || 0,
            requestedFee: doctor.requestedFee || doctor.professionalFee || 0,
            requestDate: doctor.requestDate || doctor.lastUpdated || new Date().toISOString(),
            status: doctor.professionalFeeStatus || 'pending',
            reason: doctor.reason || '',
            createdAt: doctor.createdAt || new Date().toISOString(),
            lastUpdated: doctor.lastUpdated || new Date().toISOString()
          };
          
          requests.push(request);
          console.log('✅ [FeeRequestsService] Added fee change request for doctor:', request);
        } else {
          console.log('ℹ️ [FeeRequestsService] Doctor does not have pending fee change request');
        }
      } else {
        console.log('❌ [FeeRequestsService] Doctor not found:', doctorId);
      }
      
      return requests.sort((a, b) => {
        const dateA = new Date(a.requestDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.requestDate || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      console.error('❌ [FeeRequestsService] Error fetching fee requests for doctor:', error);
      this.handleError('getFeeRequestsByDoctor', error);
      throw error;
    }
  }

  /**
   * Get all fee change requests with real-time updates
   */
  subscribeToFeeRequests(
    onUpdate: (requests: FeeChangeRequest[]) => void,
    onError: (error: Error) => void
  ): () => void {
    console.log('🔍 [FeeRequestsService] Starting subscription to fee change requests from doctors collection...');
    
    // Subscribe to doctors collection to find fee change requests
    const unsubscribe = onValue(
      this.doctorsRef,
      (snapshot) => {
        try {
          // Check if snapshot is valid
          if (!snapshot || typeof snapshot !== 'object') {
            console.error('❌ [FeeRequestsService] Invalid snapshot received:', snapshot);
            onError(new Error('Invalid snapshot received from Firebase'));
            return;
          }

          console.log('📊 [FeeRequestsService] Doctors snapshot received:', {
            exists: snapshot.exists ? snapshot.exists() : false,
            hasChildren: snapshot.hasChildren ? snapshot.hasChildren() : 'N/A',
            numChildren: snapshot.numChildren ? snapshot.numChildren() : 'N/A',
            key: snapshot.key,
            snapshotType: typeof snapshot,
            snapshotKeys: Object.keys(snapshot)
          });

          const requests: FeeChangeRequest[] = [];
          
          if (snapshot.exists && snapshot.exists()) {
            console.log('📋 [FeeRequestsService] Processing doctors data for fee change requests...');
            
            // Try to process the snapshot data
            try {
              const snapshotData = snapshot.val();
              console.log('📊 [FeeRequestsService] Snapshot data:', {
                dataType: typeof snapshotData,
                isObject: snapshotData && typeof snapshotData === 'object',
                keys: snapshotData ? Object.keys(snapshotData) : []
              });

              if (snapshotData && typeof snapshotData === 'object') {
                console.log('🔍 [FeeRequestsService] Processing doctors data. Total doctors found:', Object.keys(snapshotData).length);
                
                // Process each doctor in the snapshot data
                Object.keys(snapshotData).forEach((doctorId) => {
                  const doctor = snapshotData[doctorId];
                  
                  // Special logging for the specific doctor we know has a request
                  if (doctorId === 'J0zVFWQlgQcyqkPNBvtVAGOu6U62') {
                    console.log('🎯 [FeeRequestsService] FOUND TARGET DOCTOR:', {
                      id: doctorId,
                      firstName: doctor?.firstName,
                      lastName: doctor?.lastName,
                      isSpecialist: doctor?.isSpecialist,
                      professionalFeeStatus: doctor?.professionalFeeStatus,
                      feeChangeRequest: doctor?.feeChangeRequest,
                      allFields: Object.keys(doctor || {}),
                      rawDoctor: doctor
                    });
                  }
                  
                  console.log('👨‍⚕️ [FeeRequestsService] Checking doctor:', {
                    id: doctorId,
                    firstName: doctor?.firstName,
                    lastName: doctor?.lastName,
                    isSpecialist: doctor?.isSpecialist,
                    professionalChangeRequest: doctor?.professionalChangeRequest,
                    professionalFeeStatus: doctor?.professionalFeeStatus,
                    professionalFee: doctor?.professionalFee,
                    feeChangeRequest: doctor?.feeChangeRequest,
                    // Log all available fields to see what's actually there
                    allFields: Object.keys(doctor || {}),
                    // Check for alternative field names
                    hasFeeChangeRequest: doctor?.feeChangeRequest,
                    hasProfessionalFeeStatus: doctor?.professionalFeeStatus,
                    hasRequestedFee: doctor?.requestedFee,
                    hasPreviousFee: doctor?.previousFee
                  });
                  
                  // Check if doctor has pending fee change request (not yet processed)
                  const hasPendingRequest = 
                    doctor?.professionalFeeStatus === 'pending' ||
                    doctor?.professionalChangeRequest === 'pending' ||
                    doctor?.feeChangeRequest === 'pending';
                  
                  const isSpecialist = doctor?.isSpecialist === true;
                  
                  console.log('🔍 [FeeRequestsService] Doctor evaluation:', {
                    doctorId,
                    isSpecialist,
                    hasPendingRequest,
                    professionalChangeRequest: doctor?.professionalChangeRequest,
                    professionalFeeStatus: doctor?.professionalFeeStatus,
                    feeChangeRequest: doctor?.feeChangeRequest
                  });
                  
                  // Check if doctor is specialist and has pending fee change request
                  if (doctor && 
                      typeof doctor === 'object' && 
                      isSpecialist && 
                      hasPendingRequest) {
                    
                    const request: FeeChangeRequest = {
                      id: doctorId,
                      doctorId: doctorId,
                      doctorName: `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim(),
                      doctorEmail: doctor.email || '',
                      previousFee: doctor.feeChangeRequest?.previousFee || doctor.previousFee || doctor.professionalFee || 0,
                      requestedFee: doctor.feeChangeRequest?.requestedFee || doctor.requestedFee || doctor.professionalFee || 0,
                      requestDate: doctor.feeChangeRequest?.requestDate || doctor.requestDate || doctor.lastUpdated || new Date().toISOString(),
                      status: doctor.professionalFeeStatus || 'pending',
                      reason: doctor.feeChangeRequest?.reason || doctor.reason || '',
                      createdAt: doctor.createdAt || new Date().toISOString(),
                      lastUpdated: doctor.lastUpdated || new Date().toISOString()
                    };
                    
                    requests.push(request);
                    console.log('✅ [FeeRequestsService] Added fee change request:', request);
                  } else {
                    console.log('❌ [FeeRequestsService] Doctor does not meet criteria:', {
                      doctorId,
                      isSpecialist,
                      hasPendingRequest,
                      reason: !isSpecialist ? 'Not a specialist' : 'No pending fee change request'
                    });
                  }
                });
              } else {
                console.log('📭 [FeeRequestsService] No valid data found in snapshot');
              }
            } catch (dataError) {
              console.error('❌ [FeeRequestsService] Error processing snapshot data:', dataError);
              onError(new Error('Failed to process snapshot data'));
              return;
            }
          } else {
            console.log('📭 [FeeRequestsService] No doctors data found');
          }
          
          // Sort by request date (newest first) in memory
          const sortedRequests = requests.sort((a, b) => {
            const dateA = new Date(a.requestDate || a.createdAt || 0).getTime();
            const dateB = new Date(b.requestDate || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
          
          console.log('📈 [FeeRequestsService] Final fee change requests:', {
            totalCount: sortedRequests.length,
            requests: sortedRequests.map(req => ({
              id: req.id,
              doctorName: req.doctorName,
              status: req.status,
              previousFee: req.previousFee,
              requestedFee: req.requestedFee,
              requestDate: req.requestDate
            })),
            pendingCount: sortedRequests.filter(req => req.status === 'pending').length,
            approvedCount: sortedRequests.filter(req => req.status === 'approved').length,
            rejectedCount: sortedRequests.filter(req => req.status === 'rejected').length
          });
          
          onUpdate(sortedRequests);
        } catch (error) {
          console.error('❌ [FeeRequestsService] Error processing doctors snapshot:', error);
          onError(error as Error);
        }
      },
      (error) => {
        console.error('❌ [FeeRequestsService] Doctors subscription error:', error);
        onError(error);
      }
    );

    return unsubscribe;
  }

  /**
   * Bulk approve fee change requests
   */
  async bulkApproveRequests(
    requestIds: string[],
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<void> {
    try {
      const promises = requestIds.map(requestId =>
        this.updateFeeRequestStatus(
          requestId,
          {
            status: 'approved',
            reviewedBy,
            reviewNotes
          },
          reviewedBy
        )
      );

      await Promise.all(promises);

      // Log bulk activity
      await activityLogsService.createActivityLog({
        userId: reviewedBy,
        userEmail: reviewedBy,
        action: 'Bulk approved fee change requests',
        category: 'fee_management',
        targetId: 'bulk',
        targetType: 'fee_request',
        details: {
          requestCount: requestIds.length,
          requestIds,
          reviewNotes: reviewNotes || ''
        }
      });
    } catch (error) {
      this.handleError('bulkApproveRequests', error);
      throw error;
    }
  }

  /**
   * Bulk reject fee change requests
   */
  async bulkRejectRequests(
    requestIds: string[],
    reviewedBy: string,
    reviewNotes: string
  ): Promise<void> {
    try {
      const promises = requestIds.map(requestId =>
        this.updateFeeRequestStatus(
          requestId,
          {
            status: 'rejected',
            reviewedBy,
            reviewNotes
          },
          reviewedBy
        )
      );

      await Promise.all(promises);

      // Log bulk activity
      await activityLogsService.createActivityLog({
        userId: reviewedBy,
        userEmail: reviewedBy,
        action: 'Bulk rejected fee change requests',
        category: 'fee_management',
        targetId: 'bulk',
        targetType: 'fee_request',
        details: {
          requestCount: requestIds.length,
          requestIds,
          reviewNotes
        }
      });
    } catch (error) {
      this.handleError('bulkRejectRequests', error);
      throw error;
    }
  }

  /**
   * Filter fee change requests
   */
  filterRequests(
    requests: FeeChangeRequest[],
    filters: FeeChangeRequestFilters
  ): FeeChangeRequest[] {
    return requests.filter(request => {
      // Status filter
      if (filters.status && filters.status !== 'all' && request.status !== filters.status) {
        return false;
      }

      // Doctor name filter
      if (filters.doctorName && 
          !request.doctorName.toLowerCase().includes(filters.doctorName.toLowerCase())) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const requestDate = new Date(request.requestDate);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        if (requestDate < startDate || requestDate > endDate) {
          return false;
        }
      }

      // Fee range filter
      if (filters.feeRange) {
        if (request.requestedFee < filters.feeRange.min || 
            request.requestedFee > filters.feeRange.max) {
          return false;
        }
      }

      return true;
    });
  }
}

export const feeRequestsService = new FeeRequestsService();
