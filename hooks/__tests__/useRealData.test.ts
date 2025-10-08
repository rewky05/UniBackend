import { renderHook, waitFor } from '@testing-library/react';
import { useRealAppointments, useRealReferrals, useRealSpecialistReferrals } from '../useRealData';
import { realDataService } from '@/lib/services/real-data.service';

// Mock the real data service
jest.mock('@/lib/services/real-data.service', () => ({
  realDataService: {
    subscribeToAppointments: jest.fn(),
    subscribeToReferrals: jest.fn(),
    subscribeToSpecialistReferrals: jest.fn(),
    getAppointmentsByClinic: jest.fn(),
  },
}));

const mockRealDataService = realDataService as jest.Mocked<typeof realDataService>;

describe('useRealData hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useRealAppointments', () => {
    it('should subscribe to real-time appointments updates', () => {
      const mockUnsubscribe = jest.fn();
      mockRealDataService.subscribeToAppointments.mockReturnValue(mockUnsubscribe);

      const { result, unmount } = renderHook(() => useRealAppointments());

      expect(mockRealDataService.subscribeToAppointments).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(result.current.loading).toBe(true);
      expect(result.current.appointments).toEqual([]);

      // Test cleanup
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should update appointments when subscription callback is called', async () => {
      const mockUnsubscribe = jest.fn();
      let subscriptionCallback: (appointments: any[]) => void;
      
      mockRealDataService.subscribeToAppointments.mockImplementation((callback) => {
        subscriptionCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useRealAppointments());

      const mockAppointments = [
        {
          id: '1',
          patientId: 'P001',
          doctorId: 'D001',
          clinicId: 'C001',
          appointmentDate: '2024-01-01',
          appointmentTime: '09:00',
          status: 'completed',
          type: 'general_consultation',
        },
      ];

      // Simulate real-time update
      subscriptionCallback!(mockAppointments);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.appointments).toEqual(mockAppointments);
      });
    });
  });

  describe('useRealReferrals', () => {
    it('should subscribe to real-time referrals updates', () => {
      const mockUnsubscribe = jest.fn();
      mockRealDataService.subscribeToReferrals.mockReturnValue(mockUnsubscribe);

      const { result, unmount } = renderHook(() => useRealReferrals());

      expect(mockRealDataService.subscribeToReferrals).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(result.current.loading).toBe(true);
      expect(result.current.referrals).toEqual([]);

      // Test cleanup
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should update referrals when subscription callback is called', async () => {
      const mockUnsubscribe = jest.fn();
      let subscriptionCallback: (referrals: any[]) => void;
      
      mockRealDataService.subscribeToReferrals.mockImplementation((callback) => {
        subscriptionCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useRealReferrals());

      const mockReferrals = [
        {
          id: '1',
          patientId: 'P001',
          referringGeneralistId: 'D001',
          assignedSpecialistId: 'D002',
          appointmentDate: '2024-01-01',
          appointmentTime: '10:00',
          status: 'completed',
          initialReasonForReferral: 'Cardiac evaluation',
        },
      ];

      // Simulate real-time update
      subscriptionCallback!(mockReferrals);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.referrals).toEqual(mockReferrals);
      });
    });
  });

  describe('useRealSpecialistReferrals', () => {
    it('should subscribe to real-time specialist referrals updates', () => {
      const mockUnsubscribe = jest.fn();
      mockRealDataService.subscribeToSpecialistReferrals.mockReturnValue(mockUnsubscribe);

      const { result, unmount } = renderHook(() => useRealSpecialistReferrals());

      expect(mockRealDataService.subscribeToSpecialistReferrals).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(result.current.loading).toBe(true);
      expect(result.current.specialistReferrals).toEqual([]);

      // Test cleanup
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should update specialist referrals when subscription callback is called', async () => {
      const mockUnsubscribe = jest.fn();
      let subscriptionCallback: (specialistReferrals: any[]) => void;
      
      mockRealDataService.subscribeToSpecialistReferrals.mockImplementation((callback) => {
        subscriptionCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useRealSpecialistReferrals());

      const mockSpecialistReferrals = [
        {
          id: '1',
          patientId: 'P001',
          referringSpecialistId: 'D001',
          assignedSpecialistId: 'D002',
          appointmentDate: '2024-01-01',
          appointmentTime: '11:00',
          status: 'completed',
          initialReasonForReferral: 'Specialist consultation',
        },
      ];

      // Simulate real-time update
      subscriptionCallback!(mockSpecialistReferrals);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.specialistReferrals).toEqual(mockSpecialistReferrals);
      });
    });
  });
});
