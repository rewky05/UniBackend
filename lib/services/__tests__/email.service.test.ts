import { EmailService } from '../email.service';

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null
      })
    }
  }))
}));

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    // Set up environment variable
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    emailService = new EmailService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendDoctorVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      const emailData = {
        doctorName: 'Dr. John Doe',
        doctorEmail: 'john.doe@example.com',
        verificationDate: '2024-01-15T10:30:00Z',
        adminName: 'admin@unihealth.ph',
        clinicName: 'Test Clinic',
        specialty: 'Cardiology'
      };

      const result = await emailService.sendDoctorVerificationEmail(emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-email-id');
    });

    it('should handle email sending errors', async () => {
      // Mock Resend to return an error
      const mockResend = require('resend');
      mockResend.Resend.mockImplementation(() => ({
        emails: {
          send: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'API Error' }
          })
        }
      }));

      const emailService = new EmailService();
      const emailData = {
        doctorName: 'Dr. John Doe',
        doctorEmail: 'john.doe@example.com',
        verificationDate: '2024-01-15T10:30:00Z',
        adminName: 'admin@unihealth.ph',
        specialty: 'Cardiology'
      };

      const result = await emailService.sendDoctorVerificationEmail(emailData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });
  });

  describe('sendDoctorStatusChangeEmail', () => {
    it('should send status change email successfully', async () => {
      const emailData = {
        doctorName: 'Dr. Jane Smith',
        doctorEmail: 'jane.smith@example.com',
        verificationDate: '2024-01-15T10:30:00Z',
        adminName: 'admin@unihealth.ph',
        specialty: 'Neurology',
        newStatus: 'suspended' as const,
        reason: 'Policy violation'
      };

      const result = await emailService.sendDoctorStatusChangeEmail(emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-email-id');
    });
  });

  describe('testConnection', () => {
    it('should test email service connectivity', async () => {
      const result = await emailService.testConnection();

      expect(result.success).toBe(true);
    });
  });
});
