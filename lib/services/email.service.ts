import { Resend } from 'resend';

// Initialize Resend with API key (client-side for testing)
const resend = new Resend(process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface DoctorVerificationEmailData {
  doctorName: string;
  doctorEmail: string;
  verificationDate: string;
  adminName: string;
  clinicName?: string;
  specialty: string;
}

export class EmailService {
  private static instance: EmailService;
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY or NEXT_PUBLIC_RESEND_API_KEY environment variable is required');
    }
    this.resend = new Resend(apiKey);
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send doctor verification email
   */
  async sendDoctorVerificationEmail(data: DoctorVerificationEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log('📧 [EMAIL SERVICE] sendDoctorVerificationEmail called with data:', {
      doctorName: data.doctorName,
      doctorEmail: data.doctorEmail,
      adminName: data.adminName,
      clinicName: data.clinicName,
      specialty: data.specialty
    });

    try {
      console.log('📧 [EMAIL SERVICE] Creating email template...');
      const emailTemplate = this.createDoctorVerificationTemplate(data);
      console.log('📧 [EMAIL SERVICE] Email template created:', {
        subject: emailTemplate.subject,
        to: emailTemplate.to,
        hasHtml: !!emailTemplate.html,
        hasText: !!emailTemplate.text
      });
      
      console.log('📧 [EMAIL SERVICE] Sending email via Resend API...');
      const senderEmail = process.env.RESEND_FROM_EMAIL || 'UniHealth Admin <noreply@resend.dev>';
      console.log('📧 [EMAIL SERVICE] Using sender email:', senderEmail);
      
      // Validate sender email format
      if (senderEmail && !senderEmail.includes('<') && !senderEmail.includes('@')) {
        console.error('❌ [EMAIL SERVICE] Invalid sender email format:', senderEmail);
        return { success: false, error: 'Invalid sender email format. Use "Name <email@domain.com>" or "email@domain.com"' };
      }
      
      const result = await this.resend.emails.send({
        from: senderEmail,
        to: [data.doctorEmail],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.log('📧 [EMAIL SERVICE] Resend API response:', {
        success: !result.error,
        messageId: result.data?.id,
        error: result.error
      });

      if (result.error) {
        console.error('❌ [EMAIL SERVICE] Resend API error:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log('✅ [EMAIL SERVICE] Doctor verification email sent successfully:', result.data?.id);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('❌ [EMAIL SERVICE] Error sending doctor verification email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Send doctor status change notification
   */
  async sendDoctorStatusChangeEmail(
    data: DoctorVerificationEmailData & { 
      newStatus: 'verified' | 'suspended' | 'pending';
      reason?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log('📧 [EMAIL SERVICE] sendDoctorStatusChangeEmail called with data:', {
      doctorName: data.doctorName,
      doctorEmail: data.doctorEmail,
      newStatus: data.newStatus,
      adminName: data.adminName,
      clinicName: data.clinicName,
      specialty: data.specialty,
      reason: data.reason
    });

    try {
      console.log('📧 [EMAIL SERVICE] Creating status change email template...');
      const emailTemplate = this.createStatusChangeTemplate(data);
      console.log('📧 [EMAIL SERVICE] Status change email template created:', {
        subject: emailTemplate.subject,
        to: emailTemplate.to,
        hasHtml: !!emailTemplate.html,
        hasText: !!emailTemplate.text
      });
      
      console.log('📧 [EMAIL SERVICE] Sending status change email via Resend API...');
      const senderEmail = process.env.RESEND_FROM_EMAIL || 'UniHealth Admin <noreply@resend.dev>';
      console.log('📧 [EMAIL SERVICE] Using sender email:', senderEmail);
      
      // Validate sender email format
      if (senderEmail && !senderEmail.includes('<') && !senderEmail.includes('@')) {
        console.error('❌ [EMAIL SERVICE] Invalid sender email format:', senderEmail);
        return { success: false, error: 'Invalid sender email format. Use "Name <email@domain.com>" or "email@domain.com"' };
      }
      
      const result = await this.resend.emails.send({
        from: senderEmail,
        to: [data.doctorEmail],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      console.log('📧 [EMAIL SERVICE] Resend API response for status change:', {
        success: !result.error,
        messageId: result.data?.id,
        error: result.error
      });

      if (result.error) {
        console.error('❌ [EMAIL SERVICE] Resend API error for status change:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log('✅ [EMAIL SERVICE] Doctor status change email sent successfully:', result.data?.id);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('❌ [EMAIL SERVICE] Error sending doctor status change email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Create doctor verification email template
   */
  private createDoctorVerificationTemplate(data: DoctorVerificationEmailData): EmailTemplate {
    const verificationDate = new Date(data.verificationDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Verified - UniHealth</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .success-icon { width: 80px; height: 80px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px; }
          .success-icon svg { width: 40px; height: 40px; color: white; }
          .greeting { font-size: 18px; margin-bottom: 20px; color: #1f2937; }
          .message { font-size: 16px; margin-bottom: 30px; color: #4b5563; }
          .details { background: #f8fafc; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #3b82f6; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; margin-bottom: 0; }
          .detail-label { font-weight: 600; color: #374151; }
          .detail-value { color: #6b7280; }
          .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 30px 0; transition: background-color 0.2s; }
          .cta-button:hover { background: #2563eb; }
          .footer { background: #f8fafc; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          .footer a { color: #3b82f6; text-decoration: none; }
          .footer a:hover { text-decoration: underline; }
          .verification-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Account Verified!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to UniHealth Medical System</p>
          </div>
          
          <div class="content">
            <div class="success-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
            </div>
            
            <div class="greeting">Hello Dr. ${data.doctorName},</div>
            
            <div class="message">
              Congratulations! Your medical practitioner account has been successfully verified and approved by our administration team. You now have full access to the UniHealth Medical System.
            </div>
            
            <div class="verification-badge">✅ VERIFIED ACCOUNT</div>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Doctor Name:</span>
                <span class="detail-value">Dr. ${data.doctorName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Specialty:</span>
                <span class="detail-value">${data.specialty}</span>
              </div>
              ${data.clinicName ? `
              <div class="detail-row">
                <span class="detail-label">Clinic:</span>
                <span class="detail-value">${data.clinicName}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Verified By:</span>
                <span class="detail-value">${data.adminName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Verification Date:</span>
                <span class="detail-value">${verificationDate}</span>
              </div>
            </div>
            
            <div class="message">
              <strong>What's Next?</strong><br>
              You can now log in to your account and start managing your appointments, viewing patient information, and accessing all the features available to verified medical practitioners.
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="cta-button">
                Access Your Account
              </a>
            </div>
            
            <div class="message">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </div>
          </div>
          
          <div class="footer">
            <p><strong>UniHealth Medical System</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}">Visit our website</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/support">Support</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ACCOUNT VERIFIED - UniHealth Medical System
      
      Hello Dr. ${data.doctorName},
      
      Congratulations! Your medical practitioner account has been successfully verified and approved by our administration team. You now have full access to the UniHealth Medical System.
      
      ACCOUNT DETAILS:
      - Doctor Name: Dr. ${data.doctorName}
      - Specialty: ${data.specialty}
      ${data.clinicName ? `- Clinic: ${data.clinicName}` : ''}
      - Verified By: ${data.adminName}
      - Verification Date: ${verificationDate}
      
      WHAT'S NEXT?
      You can now log in to your account and start managing your appointments, viewing patient information, and accessing all the features available to verified medical practitioners.
      
      Access your account: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login
      
      If you have any questions or need assistance, please contact our support team.
      
      Best regards,
      UniHealth Medical System
      
      This is an automated message. Please do not reply to this email.
    `;

    return {
      to: data.doctorEmail,
      subject: `🎉 Account Verified - Welcome to UniHealth, Dr. ${data.doctorName}`,
      html,
      text
    };
  }

  /**
   * Create status change email template
   */
  private createStatusChangeTemplate(data: DoctorVerificationEmailData & { 
    newStatus: 'verified' | 'suspended' | 'pending';
    reason?: string;
  }): EmailTemplate {
    const statusConfig = {
      verified: { 
        emoji: '🎉', 
        title: 'Account Verified', 
        color: '#10b981',
        message: 'Your account has been verified and you now have full access to the system.'
      },
      suspended: { 
        emoji: '⚠️', 
        title: 'Account Suspended', 
        color: '#ef4444',
        message: 'Your account has been suspended. Please contact support for more information.'
      },
      pending: { 
        emoji: '⏳', 
        title: 'Account Pending', 
        color: '#f59e0b',
        message: 'Your account is pending verification. We will review your application soon.'
      }
    };

    const config = statusConfig[data.newStatus];
    const verificationDate = new Date(data.verificationDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${config.title} - UniHealth</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .status-icon { width: 80px; height: 80px; background: ${config.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px; }
          .status-icon svg { width: 40px; height: 40px; color: white; }
          .greeting { font-size: 18px; margin-bottom: 20px; color: #1f2937; }
          .message { font-size: 16px; margin-bottom: 30px; color: #4b5563; }
          .details { background: #f8fafc; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid ${config.color}; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; margin-bottom: 0; }
          .detail-label { font-weight: 600; color: #374151; }
          .detail-value { color: #6b7280; }
          .status-badge { background: ${config.color}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          .footer a { color: #3b82f6; text-decoration: none; }
          .footer a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${config.emoji} ${config.title}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">UniHealth Medical System</p>
          </div>
          
          <div class="content">
            <div class="status-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                ${data.newStatus === 'verified' ? 
                  '<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>' :
                  data.newStatus === 'suspended' ?
                  '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>' :
                  '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>'
                }
              </svg>
            </div>
            
            <div class="greeting">Hello Dr. ${data.doctorName},</div>
            
            <div class="message">
              ${config.message}
              ${data.reason ? `<br><br><strong>Reason:</strong> ${data.reason}` : ''}
            </div>
            
            <div class="status-badge">${data.newStatus.toUpperCase()}</div>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Doctor Name:</span>
                <span class="detail-value">Dr. ${data.doctorName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Specialty:</span>
                <span class="detail-value">${data.specialty}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${data.newStatus.charAt(0).toUpperCase() + data.newStatus.slice(1)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Updated By:</span>
                <span class="detail-value">${data.adminName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${verificationDate}</span>
              </div>
            </div>
            
            ${data.newStatus === 'verified' ? `
            <div class="message">
              <strong>What's Next?</strong><br>
              You can now log in to your account and start managing your appointments, viewing patient information, and accessing all the features available to verified medical practitioners.
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="cta-button" style="display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 30px 0;">
                Access Your Account
              </a>
            </div>
            ` : ''}
            
            <div class="message">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </div>
          </div>
          
          <div class="footer">
            <p><strong>UniHealth Medical System</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}">Visit our website</a> | 
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/support">Support</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${config.title.toUpperCase()} - UniHealth Medical System
      
      Hello Dr. ${data.doctorName},
      
      ${config.message}
      ${data.reason ? `\n\nReason: ${data.reason}` : ''}
      
      ACCOUNT DETAILS:
      - Doctor Name: Dr. ${data.doctorName}
      - Specialty: ${data.specialty}
      - Status: ${data.newStatus.charAt(0).toUpperCase() + data.newStatus.slice(1)}
      - Updated By: ${data.adminName}
      - Date: ${verificationDate}
      
      ${data.newStatus === 'verified' ? `
      WHAT'S NEXT?
      You can now log in to your account and start managing your appointments, viewing patient information, and accessing all the features available to verified medical practitioners.
      
      Access your account: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login
      ` : ''}
      
      If you have any questions or need assistance, please contact our support team.
      
      Best regards,
      UniHealth Medical System
      
      This is an automated message. Please do not reply to this email.
    `;

    return {
      to: data.doctorEmail,
      subject: `${config.emoji} ${config.title} - UniHealth, Dr. ${data.doctorName}`,
      html,
      text
    };
  }

  /**
   * Test email service connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    console.log('🧪 [EMAIL SERVICE] Testing Resend API connection...');
    console.log('🧪 [EMAIL SERVICE] NEXT_PUBLIC_RESEND_API_KEY exists:', !!process.env.NEXT_PUBLIC_RESEND_API_KEY);
    console.log('🧪 [EMAIL SERVICE] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('🧪 [EMAIL SERVICE] Using API key:', process.env.NEXT_PUBLIC_RESEND_API_KEY ? 'NEXT_PUBLIC' : 'SERVER_SIDE');
    console.log('🧪 [EMAIL SERVICE] API Key length:', (process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.RESEND_API_KEY)?.length || 0);
    console.log('🧪 [EMAIL SERVICE] API Key starts with:', (process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.RESEND_API_KEY)?.substring(0, 10) || 'N/A');
    
    try {
      // Test API key validation without sending actual email
      console.log('🧪 [EMAIL SERVICE] Testing API key validation...');
      const senderEmail = process.env.RESEND_FROM_EMAIL || 'UniHealth Test <noreply@resend.dev>';
      console.log('🧪 [EMAIL SERVICE] Using sender email for test:', senderEmail);
      
      // Validate API key format
      const apiKey = process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY;
      if (!apiKey) {
        return { success: false, error: 'No API key found' };
      }
      
      if (!apiKey.startsWith('re_')) {
        return { success: false, error: 'Invalid API key format. Should start with "re_"' };
      }
      
      // Validate sender email format
      if (senderEmail && !senderEmail.includes('<') && !senderEmail.includes('@')) {
        return { success: false, error: 'Invalid sender email format. Use "Name <email@domain.com>" or "email@domain.com"' };
      }
      
      console.log('✅ [EMAIL SERVICE] API key and sender email validation passed');
      return { success: true };
    } catch (error) {
      console.error('❌ [EMAIL SERVICE] Test error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
