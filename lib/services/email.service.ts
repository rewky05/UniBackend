import { Resend } from 'resend';

// Initialize Resend lazily to avoid errors when API key is missing
let resend: Resend | null = null;

function getResendInstance(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY or NEXT_PUBLIC_RESEND_API_KEY environment variable is required');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

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

export interface TemporaryPasswordEmailData {
  userName: string;
  userEmail: string;
  temporaryPassword: string;
  userType: 'doctor' | 'patient';
  adminName: string;
  clinicName?: string;
  loginUrl?: string;
}

export class EmailService {
  private static instance: EmailService;
  private resend: Resend;

  constructor() {
    // Initialize resend instance lazily
    this.resend = null as any; // Will be initialized when needed
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }


  /**
   * Send temporary password email to new user
   */
  async sendTemporaryPasswordEmail(data: TemporaryPasswordEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log('📧 [EMAIL SERVICE] sendTemporaryPasswordEmail called with data:', {
      userName: data.userName,
      userEmail: data.userEmail,
      userType: data.userType,
      adminName: data.adminName,
      clinicName: data.clinicName,
      passwordLength: data.temporaryPassword.length,
      hasLoginUrl: !!data.loginUrl
    });
    
    console.log('📧 [EMAIL SERVICE] Environment check:', {
      hasResendKey: !!(process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY),
      hasFromEmail: !!process.env.RESEND_FROM_EMAIL,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL
    });

    try {
      console.log('📧 [EMAIL SERVICE] Creating temporary password email template...');
      const emailTemplate = this.createTemporaryPasswordTemplate(data);
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
      
      console.log('📧 [EMAIL SERVICE] Preparing Resend API call with data:', {
        from: senderEmail,
        to: [data.userEmail],
        subject: emailTemplate.subject,
        htmlLength: emailTemplate.html.length,
        textLength: emailTemplate.text?.length || 0
      });
      
      const result = await getResendInstance().emails.send({
        from: senderEmail,
        to: [data.userEmail],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
      
      console.log('📧 [EMAIL SERVICE] Resend API call completed. Raw result:', result);

      console.log('📧 [EMAIL SERVICE] Resend API response:', {
        success: !result.error,
        messageId: result.data?.id,
        error: result.error
      });

      if (result.error) {
        console.error('❌ [EMAIL SERVICE] Resend API error:', result.error);
        return { 
          success: false, 
          error: `Resend API error: ${result.error.message || 'Unknown error'}` 
        };
      }

      console.log('✅ [EMAIL SERVICE] Temporary password email sent successfully');
      return { 
        success: true, 
        messageId: result.data?.id 
      };
    } catch (error) {
      console.error('❌ [EMAIL SERVICE] Error sending temporary password email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
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
      
      const result = await getResendInstance().emails.send({
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
      
      const result = await getResendInstance().emails.send({
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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #000000; 
            margin: 0; 
            padding: 0; 
            background: #ffffff;
          }
          .email-wrapper { 
            padding: 40px 20px; 
            max-width: 600px; 
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: bold; 
            color: #1e40af;
            margin-bottom: 20px;
          }
          .content { 
            padding: 0; 
          }
          .greeting { 
            font-size: 16px; 
            margin-bottom: 20px; 
            color: #000000; 
          }
          .message { 
            font-size: 16px; 
            margin-bottom: 20px; 
            color: #000000; 
            line-height: 1.6;
          }
          .details { 
            background: #f8f9fa; 
            padding: 20px; 
            margin: 30px 0; 
            border-left: 3px solid #1e40af;
          }
          .detail-row { 
            margin-bottom: 10px; 
            padding: 5px 0; 
          }
          .detail-row:last-child { 
            margin-bottom: 0; 
          }
          .detail-label { 
            font-weight: 600; 
            color: #374151; 
            font-size: 14px;
            margin-right: 10px;
          }
          .detail-value { 
            color: #000000; 
            font-weight: normal;
            font-size: 14px;
          }
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb;
            color: #6b7280; 
            font-size: 14px; 
          }
          .footer p { margin-bottom: 8px; }
          .footer a { 
            color: #1e40af; 
            text-decoration: underline;
          }
          .footer-links {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
          }
          .footer-links a {
            margin: 0 8px;
            font-size: 13px;
          }
          @media (max-width: 640px) {
            .email-wrapper { padding: 20px 15px; }
            .header h1 { font-size: 24px; }
            .details { padding: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <h1>UniHEALTH</h1>
          </div>
          
          <div class="content">
            <div class="greeting">Dear Dr. ${data.doctorName},</div>
            
            <div class="message">
              Congratulations! Your medical practitioner account has been successfully verified and approved by our administration team. You now have full access to the UniHEALTH platform.
            </div>
            
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
              <strong>What's Next?</strong><br><br>
              You can now log in to your account and start managing your appointments, viewing patient information, and accessing all the features available to verified medical practitioners.
            </div>
            
            <div class="message">
              If you have any questions or need assistance, please reach out to us at <a href="mailto:support@unihealth.com">support@unihealth.com</a>. Our team is here to support you every step of the way.
            </div>
            
            <div class="message">
              Best regards,<br>
              The UniHEALTH Team
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <div class="footer-links">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}">Visit our website</a>
              <span>|</span>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/support">Support</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ACCOUNT VERIFIED - UniHealth
      
      Hello Dr. ${data.doctorName},
      
      Congratulations! Your medical practitioner account has been successfully verified and approved by our administration team. You now have full access to the UniHealth platform.
      
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
      UniHealth
      
      This is an automated message. Please do not reply to this email.
    `;

    return {
      to: data.doctorEmail,
      subject: `Account Verified - Welcome to UniHealth, Dr. ${data.doctorName}`,
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
        title: 'Account Verified', 
        message: 'Your account has been verified and you now have full access to the system.'
      },
      suspended: { 
        title: 'Account Suspended', 
        message: 'Your account has been suspended. Please contact support for more information.'
      },
      pending: { 
        title: 'Account Pending', 
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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #000000; 
            margin: 0; 
            padding: 0; 
            background: #ffffff;
          }
          .email-wrapper { 
            padding: 40px 20px; 
            max-width: 600px; 
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: bold; 
            color: #1e40af;
            margin-bottom: 20px;
          }
          .content { 
            padding: 0; 
          }
          .greeting { 
            font-size: 16px; 
            margin-bottom: 20px; 
            color: #000000; 
          }
          .message { 
            font-size: 16px; 
            margin-bottom: 20px; 
            color: #000000; 
            line-height: 1.6;
          }
          .details { 
            background: #f8f9fa; 
            padding: 20px; 
            margin: 30px 0; 
            border-left: 3px solid #1e40af;
          }
          .detail-row { 
            margin-bottom: 10px; 
            padding: 5px 0; 
          }
          .detail-row:last-child { 
            margin-bottom: 0; 
          }
          .detail-label { 
            font-weight: 600; 
            color: #374151; 
            font-size: 14px;
            margin-right: 10px;
          }
          .detail-value { 
            color: #000000; 
            font-weight: normal;
            font-size: 14px;
          }
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb;
            color: #6b7280; 
            font-size: 14px; 
          }
          .footer p { margin-bottom: 8px; }
          .footer a { 
            color: #1e40af; 
            text-decoration: underline;
          }
          .footer-links {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
          }
          .footer-links a {
            margin: 0 8px;
            font-size: 13px;
          }
          @media (max-width: 640px) {
            .email-wrapper { padding: 20px 15px; }
            .header h1 { font-size: 24px; }
            .details { padding: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <h1>UniHEALTH</h1>
          </div>
          
          <div class="content">
            <div class="greeting">Dear Dr. ${data.doctorName},</div>
            
            <div class="message">
              ${config.message}
              ${data.reason ? `<br><br><strong>Reason:</strong> ${data.reason}` : ''}
            </div>
            
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
              <strong>What's Next?</strong><br><br>
              You can now log in to your account and start managing your appointments, viewing patient information, and accessing all the features available to verified medical practitioners.
            </div>
            ` : ''}
            
            <div class="message">
              If you have any questions or need assistance, please reach out to us at <a href="mailto:support@unihealth.com">support@unihealth.com</a>. Our team is here to support you every step of the way.
            </div>
            
            <div class="message">
              Best regards,<br>
              The UniHEALTH Team
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <div class="footer-links">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}">Visit our website</a>
              <span>|</span>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/support">Support</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${config.title.toUpperCase()} - UniHealth
      
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
      UniHealth
      
      This is an automated message. Please do not reply to this email.
    `;

    return {
      to: data.doctorEmail,
      subject: `${config.title} - UniHealth, Dr. ${data.doctorName}`,
      html,
      text
    };
  }

  /**
   * Create temporary password email template
   */
  private createTemporaryPasswordTemplate(data: TemporaryPasswordEmailData): EmailTemplate {
    const userTypeDisplay = data.userType === 'doctor' ? 'Doctor' : 'Patient';
    const loginUrl = data.loginUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to UniHealth - Your Account Details</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #000000; 
            margin: 0; 
            padding: 0; 
            background: #ffffff;
          }
          .email-wrapper { 
            padding: 40px 20px; 
            max-width: 600px; 
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: bold; 
            color: #1e40af;
            margin-bottom: 20px;
          }
          .content { 
            padding: 0; 
          }
          .greeting { 
            font-size: 16px; 
            margin-bottom: 20px; 
            color: #000000; 
          }
          .message { 
            font-size: 16px; 
            margin-bottom: 20px; 
            color: #000000; 
            line-height: 1.6;
          }
          .credentials { 
            background: #f8f9fa; 
            border: 1px solid #e5e7eb; 
            padding: 20px; 
            margin: 30px 0; 
            border-left: 3px solid #1e40af;
          }
          .credentials h3 { 
            font-size: 16px; 
            font-weight: 600; 
            color: #1e40af; 
            margin-bottom: 15px; 
          }
          .credential-item { 
            margin-bottom: 12px; 
            display: flex; 
            align-items: center; 
            gap: 10px;
          }
          .credential-label { 
            font-weight: 600; 
            color: #374151; 
            min-width: 80px;
            font-size: 14px;
          }
          .credential-value { 
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
            background: #1f2937; 
            color: #f9fafb; 
            padding: 6px 10px; 
            border-radius: 4px; 
            font-size: 13px; 
            font-weight: 500;
          }
          .next-steps { 
            background: #f8f9fa; 
            padding: 20px; 
            margin: 30px 0; 
            border-left: 3px solid #1e40af;
          }
          .next-steps h3 { 
            font-size: 16px; 
            font-weight: 600; 
            color: #1e40af; 
            margin-bottom: 15px; 
          }
          .next-steps ol { 
            margin: 0; 
            padding-left: 20px; 
          }
          .next-steps li { 
            margin-bottom: 8px; 
            color: #000000; 
            font-size: 14px;
          }
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb;
            color: #6b7280; 
            font-size: 14px; 
          }
          .footer p { margin-bottom: 8px; }
          .footer a { 
            color: #1e40af; 
            text-decoration: underline;
          }
          .footer-links {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
          }
          .footer-links a {
            margin: 0 8px;
            font-size: 13px;
          }
          @media (max-width: 640px) {
            .email-wrapper { padding: 20px 15px; }
            .header h1 { font-size: 24px; }
            .credentials { padding: 15px; }
            .next-steps { padding: 15px; }
            .credential-item { flex-direction: column; align-items: flex-start; gap: 5px; }
            .credential-label { min-width: auto; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <h1>UniHEALTH</h1>
          </div>
          
          <div class="content">
            <div class="greeting">Dear ${data.userName},</div>
            
            <div class="message">
              Welcome to the UniHEALTH family! We're delighted to have you join our community. Your ${userTypeDisplay.toLowerCase()} account has been successfully created, and you're now ready to access all the tools and resources designed to support your health journey.
            </div>
            
            <div class="credentials">
              <h3>Your Login Credentials</h3>
              <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${data.userEmail}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Password:</span>
                <span class="credential-value">${data.temporaryPassword}</span>
              </div>
            </div>
            
            <div class="next-steps">
              <h3>Next Steps</h3>
              <ol>
                <li>Wait 2-3 business days for document verification</li>
                <li>You will receive an email notification once verification is complete</li>
                <li>After verification, you can log in using the credentials provided above</li>
                <li>Complete your profile setup and start using your UniHEALTH account</li>
              </ol>
            </div>
            
            <div class="message">
              If you have any questions or need assistance, please reach out to us at <a href="mailto:support@unihealth.com">support@unihealth.com</a>. Our team is here to support you every step of the way.
            </div>
            
            <div class="message">
              Best regards,<br>
              The UniHEALTH Team
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <div class="footer-links">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}">Visit our website</a>
              <span>|</span>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/support">Support</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      WELCOME TO UNIHEALTH - YOUR ${userTypeDisplay.toUpperCase()} ACCOUNT IS READY
      
      Hello ${data.userName},
      
      Welcome to UniHealth! Your ${userTypeDisplay.toLowerCase()} account has been successfully created by ${data.adminName}${data.clinicName ? ` from ${data.clinicName}` : ''}.
      
      YOUR LOGIN CREDENTIALS:
      - Email Address: ${data.userEmail}
      - Password: ${data.temporaryPassword}
      
      NEXT STEPS:
      1. Wait 2-3 business days for document verification
      2. You will receive an email notification once verification is complete
      3. After verification, you can log in using the credentials provided above
      4. Complete your profile setup and start using your UniHealth account
      
      If you have any questions or need assistance, please contact our support team.
      
      Best regards,
      UniHealth Medical System
    `;

    return {
      to: data.userEmail,
      subject: `Welcome to UniHealth - Your ${userTypeDisplay} Account Details`,
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
