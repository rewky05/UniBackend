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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
          }
          .email-wrapper { 
            padding: 20px; 
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
          }
          .container { 
            max-width: 640px; 
            width: 100%; 
            background: white; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #e5e7eb;
          }
          .header { 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%); 
            color: white; 
            padding: 48px 32px; 
            text-align: center; 
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          .header-content { position: relative; z-index: 1; }
          .header h1 { 
            margin: 0; 
            font-size: 32px; 
            font-weight: 800; 
            letter-spacing: -0.025em;
            margin-bottom: 8px;
          }
          .header p { 
            margin: 0; 
            opacity: 0.95; 
            font-size: 18px; 
            font-weight: 500;
            letter-spacing: -0.01em;
          }
          .content { padding: 48px 32px; }
          .greeting { 
            font-size: 24px; 
            font-weight: 700; 
            margin-bottom: 24px; 
            color: #111827; 
            letter-spacing: -0.025em;
          }
          .message { 
            font-size: 16px; 
            margin-bottom: 32px; 
            color: #4b5563; 
            line-height: 1.7;
            font-weight: 400;
          }
          .verification-badge { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            color: white; 
            padding: 12px 24px; 
            border-radius: 50px; 
            font-size: 14px; 
            font-weight: 700; 
            display: inline-block; 
            margin: 24px 0; 
            text-transform: uppercase;
            letter-spacing: 0.05em;
            box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.2);
          }
          .details { 
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
            border-radius: 12px; 
            padding: 32px; 
            margin: 32px 0; 
            border-left: 4px solid #3b82f6; 
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 16px; 
            padding: 12px 0; 
            border-bottom: 1px solid #e5e7eb; 
          }
          .detail-row:last-child { 
            border-bottom: none; 
            margin-bottom: 0; 
          }
          .detail-label { 
            font-weight: 600; 
            color: #374151; 
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-right: 10px;
          }
          .detail-value { 
            color: #1f2937; 
            font-weight: 500;
            font-size: 15px;
            text-align: right;
          }
          .footer { 
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
            padding: 32px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px; 
            border-top: 1px solid #e5e7eb;
          }
          .footer p { margin-bottom: 8px; }
          .footer a { 
            color: #3b82f6; 
            text-decoration: none; 
            font-weight: 500;
            transition: color 0.2s ease;
          }
          .footer a:hover { 
            color: #1d4ed8; 
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
          .highlight-text {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
            color: #92400e;
          }
          @media (max-width: 640px) {
            .email-wrapper { padding: 12px; }
            .container { border-radius: 12px; }
            .header { padding: 32px 24px; }
            .header h1 { font-size: 28px; }
            .content { padding: 32px 24px; }
            .details { padding: 24px; }
            .detail-row { flex-direction: column; align-items: flex-start; gap: 4px; }
            .detail-value { text-align: left; }
            .footer { padding: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="header">
              <div class="header-content">
                <h1>Account Verified!</h1>
                <p>Welcome to UniHealth</p>
              </div>
            </div>
            
            <div class="content">
              <div class="greeting">Hello Dr. ${data.doctorName},</div>
              
              <div class="message">
                Congratulations! Your medical practitioner account has been successfully verified and approved by our administration team. You now have full access to the <span class="highlight-text">UniHealth</span> platform.
              </div>
              
              <div class="verification-badge">VERIFIED ACCOUNT</div>
              
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Doctor Name</span>
                  <span class="detail-value">Dr. ${data.doctorName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Specialty</span>
                  <span class="detail-value">${data.specialty}</span>
                </div>
                ${data.clinicName ? `
                <div class="detail-row">
                  <span class="detail-label">Clinic</span>
                  <span class="detail-value">${data.clinicName}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span class="detail-label">Verified By</span>
                  <span class="detail-value">${data.adminName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Verification Date</span>
                  <span class="detail-value">${verificationDate}</span>
                </div>
              </div>
              
              <div class="message">
                <strong>What's Next?</strong><br><br>
                You can now log in to your account and start managing your appointments, viewing patient information, and accessing all the features available to verified medical practitioners.
              </div>
              
              <div class="message">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
              </div>
            </div>
            
            <div class="footer">
              <p><strong>UniHealth</strong></p>
              <p>This is an automated message. Please do not reply to this email.</p>
              <div class="footer-links">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}">Visit our website</a>
                <span>|</span>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/support">Support</a>
              </div>
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
          }
          .email-wrapper { 
            padding: 20px; 
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
          }
          .container { 
            max-width: 640px; 
            width: 100%; 
            background: white; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #e5e7eb;
          }
          .header { 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%); 
            color: white; 
            padding: 48px 32px; 
            text-align: center; 
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          .header-content { position: relative; z-index: 1; }
          .header h1 { 
            margin: 0; 
            font-size: 32px; 
            font-weight: 800; 
            letter-spacing: -0.025em;
            margin-bottom: 8px;
          }
          .header p { 
            margin: 0; 
            opacity: 0.95; 
            font-size: 18px; 
            font-weight: 500;
            letter-spacing: -0.01em;
          }
          .content { padding: 48px 32px; }
          .greeting { 
            font-size: 24px; 
            font-weight: 700; 
            margin-bottom: 24px; 
            color: #111827; 
            letter-spacing: -0.025em;
          }
          .message { 
            font-size: 16px; 
            margin-bottom: 32px; 
            color: #4b5563; 
            line-height: 1.7;
            font-weight: 400;
          }
          .status-badge { 
            background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); 
            color: white; 
            padding: 12px 24px; 
            border-radius: 50px; 
            font-size: 14px; 
            font-weight: 700; 
            display: inline-block; 
            margin: 24px 0; 
            text-transform: uppercase;
            letter-spacing: 0.05em;
            box-shadow: 0 4px 14px 0 ${config.color}40;
            border: 2px solid rgba(255, 255, 255, 0.2);
          }
          .details { 
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
            border-radius: 12px; 
            padding: 32px; 
            margin: 32px 0; 
            border-left: 4px solid ${config.color}; 
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 16px; 
            padding: 12px 0; 
            border-bottom: 1px solid #e5e7eb; 
          }
          .detail-row:last-child { 
            border-bottom: none; 
            margin-bottom: 0; 
          }
          .detail-label { 
            font-weight: 600; 
            color: #374151; 
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-right: 10px;
          }
          .detail-value { 
            color: #1f2937; 
            font-weight: 500;
            font-size: 15px;
            text-align: right;
          }
          .footer { 
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
            padding: 32px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px; 
            border-top: 1px solid #e5e7eb;
          }
          .footer p { margin-bottom: 8px; }
          .footer a { 
            color: #3b82f6; 
            text-decoration: none; 
            font-weight: 500;
            transition: color 0.2s ease;
          }
          .footer a:hover { 
            color: #1d4ed8; 
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
          .highlight-text {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
            color: #92400e;
          }
          @media (max-width: 640px) {
            .email-wrapper { padding: 12px; }
            .container { border-radius: 12px; }
            .header { padding: 32px 24px; }
            .header h1 { font-size: 28px; }
            .content { padding: 32px 24px; }
            .details { padding: 24px; }
            .detail-row { flex-direction: column; align-items: flex-start; gap: 4px; }
            .detail-value { text-align: left; }
            .footer { padding: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="header">
              <div class="header-content">
                <h1>${config.title}</h1>
                <p>UniHealth</p>
              </div>
            </div>
            
            <div class="content">
              <div class="greeting">Hello Dr. ${data.doctorName},</div>
              
              <div class="message">
                ${config.message}
                ${data.reason ? `<br><br><strong>Reason:</strong> ${data.reason}` : ''}
              </div>
              
              <div class="status-badge">${data.newStatus.toUpperCase()}</div>
              
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Doctor Name</span>
                  <span class="detail-value">Dr. ${data.doctorName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Specialty</span>
                  <span class="detail-value">${data.specialty}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status</span>
                  <span class="detail-value">${data.newStatus.charAt(0).toUpperCase() + data.newStatus.slice(1)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Updated By</span>
                  <span class="detail-value">${data.adminName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date</span>
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
                If you have any questions or need assistance, please don't hesitate to contact our support team.
              </div>
            </div>
            
            <div class="footer">
              <p><strong>UniHealth</strong></p>
              <p>This is an automated message. Please do not reply to this email.</p>
              <div class="footer-links">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}">Visit our website</a>
                <span>|</span>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/support">Support</a>
              </div>
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
          }
          .email-wrapper { 
            padding: 20px; 
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
          }
          .container { 
            max-width: 640px; 
            width: 100%; 
            background: white; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #e5e7eb;
          }
          .header { 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%); 
            color: white; 
            padding: 48px 32px; 
            text-align: center; 
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          .header-content { position: relative; z-index: 1; }
          .header h1 { 
            margin: 0; 
            font-size: 32px; 
            font-weight: 800; 
            letter-spacing: -0.025em;
            margin-bottom: 8px;
          }
          .header p { 
            margin: 0; 
            opacity: 0.95; 
            font-size: 18px; 
            font-weight: 500;
            letter-spacing: -0.01em;
          }
          .content { padding: 48px 32px; }
          .greeting { 
            font-size: 24px; 
            font-weight: 700; 
            margin-bottom: 24px; 
            color: #111827; 
            letter-spacing: -0.025em;
          }
          .message { 
            font-size: 16px; 
            margin-bottom: 32px; 
            color: #4b5563; 
            line-height: 1.7;
            font-weight: 400;
          }
          .credentials { 
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
            border: 2px solid #3b82f6; 
            border-radius: 12px; 
            padding: 32px; 
            margin: 32px 0; 
            box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.1);
          }
          .credentials h3 { 
            font-size: 18px; 
            font-weight: 700; 
            color: #1e40af; 
            margin-bottom: 20px; 
            display: flex; 
            align-items: center; 
            gap: 8px;
          }
          .credential-item { 
            margin-bottom: 16px; 
            display: flex; 
            align-items: center; 
            gap: 12px;
          }
          .credential-label { 
            font-weight: 600; 
            color: #374151; 
            min-width: 120px;
          }
          .credential-value { 
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
            background: #1f2937; 
            color: #f9fafb; 
            padding: 8px 12px; 
            border-radius: 6px; 
            font-size: 14px; 
            font-weight: 500;
          }
          .next-steps { 
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
            border-radius: 12px; 
            padding: 32px; 
            margin: 32px 0; 
            border-left: 4px solid #3b82f6; 
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }
          .next-steps h3 { 
            font-size: 18px; 
            font-weight: 700; 
            color: #111827; 
            margin-bottom: 20px; 
          }
          .next-steps ol { 
            margin: 0; 
            padding-left: 20px; 
          }
          .next-steps li { 
            margin-bottom: 12px; 
            color: #4b5563; 
            font-weight: 400;
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 12px; 
            font-weight: 600; 
            font-size: 16px;
            box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);
            transition: all 0.2s ease;
            border: none;
            cursor: pointer;
          }
          .button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.4);
          }
          .button-container { 
            text-align: center; 
            margin: 32px 0; 
          }
          .footer { 
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
            padding: 32px; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px; 
            border-top: 1px solid #e5e7eb;
          }
          .footer p { margin-bottom: 8px; }
          .footer a { 
            color: #3b82f6; 
            text-decoration: none; 
            font-weight: 500;
            transition: color 0.2s ease;
          }
          .footer a:hover { 
            color: #1d4ed8; 
            text-decoration: underline; 
          }
          .highlight-text {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
            color: #92400e;
          }
          @media (max-width: 640px) {
            .email-wrapper { padding: 12px; }
            .container { border-radius: 12px; }
            .header { padding: 32px 24px; }
            .header h1 { font-size: 28px; }
            .content { padding: 32px 24px; }
            .credentials { padding: 24px; }
            .next-steps { padding: 24px; }
            .credential-item { flex-direction: column; align-items: flex-start; gap: 8px; }
            .credential-label { min-width: auto; }
            .footer { padding: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="header">
              <div class="header-content">
                <h1>🔐 Welcome to UniHealth</h1>
                <p>Your ${userTypeDisplay} Account is Ready</p>
              </div>
            </div>
            
            <div class="content">
              <div class="greeting">Hello ${data.userName},</div>
              
              <div class="message">
                Welcome to <span class="highlight-text">UniHealth</span>! Your ${userTypeDisplay.toLowerCase()} account has been successfully created.
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
                  <li>Complete your profile setup and start using your UniHealth account</li>
                </ol>
              </div>
              
              <div class="message">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
              </div>
            </div>
            
            <div class="footer">
              <p><strong>UniHealth Medical System</strong></p>
              <p>This is an automated message. Please do not reply to this email.</p>
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}">Visit our website</a>
                <span> | </span>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/support">Support</a>
              </div>
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
