import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
  console.log('[API] Email API route called');
  
  // Log environment variables for testing (remove in production)
  console.log('🔍 [API] Environment variables check:', {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET',
    NEXT_PUBLIC_RESEND_API_KEY: process.env.NEXT_PUBLIC_RESEND_API_KEY ? `${process.env.NEXT_PUBLIC_RESEND_API_KEY.substring(0, 10)}...` : 'NOT SET',
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'NOT SET (using default)',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET'
  });
  
  // Check if using unverified domain
  if (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.includes('email.com')) {
    console.warn('⚠️ [API] WARNING: Using email.com domain which may not be verified in Resend');
  }
  
  try {
    // Initialize email service with error handling
    let emailServiceInstance;
    try {
      console.log('[API] Attempting to initialize email service...');
      emailServiceInstance = emailService;
      console.log('✅ [API] Email service initialized successfully');
    } catch (error) {
      console.error('❌ [API] Failed to initialize email service:', error);
      console.error('❌ [API] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return NextResponse.json(
        { 
          error: 'Email service initialization failed. Please check API key configuration.',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('[API] Request body received:', {
      doctorName: body.doctorName,
      doctorEmail: body.doctorEmail,
      newStatus: body.newStatus,
      hasClinicName: !!body.clinicName,
      hasSpecialty: !!body.specialty,
      hasReason: !!body.reason
    });

    const { 
      doctorName, 
      doctorEmail, 
      verificationDate, 
      adminName, 
      clinicName, 
      specialty,
      newStatus,
      reason 
    } = body;

    // Validate required fields
    if (!doctorName || !doctorEmail || !verificationDate || !adminName || !specialty) {
      console.error('❌ [API] Missing required fields:', {
        doctorName: !!doctorName,
        doctorEmail: !!doctorEmail,
        verificationDate: !!verificationDate,
        adminName: !!adminName,
        specialty: !!specialty
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailData = {
      doctorName,
      doctorEmail,
      verificationDate,
      adminName,
      clinicName: clinicName || 'UniHealth Medical System',
      specialty
    };

    console.log('[API] Email data prepared:', emailData);
    console.log('[API] NEXT_PUBLIC_RESEND_API_KEY exists:', !!process.env.NEXT_PUBLIC_RESEND_API_KEY);
    console.log('[API] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('[API] Using API key:', process.env.NEXT_PUBLIC_RESEND_API_KEY ? 'NEXT_PUBLIC' : 'SERVER_SIDE');
    console.log('[API] API key length:', (process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.RESEND_API_KEY)?.length || 0);

    let result;
    try {
      if (newStatus === 'verified') {
        console.log('[API] Sending verification email...');
        result = await emailServiceInstance.sendDoctorVerificationEmail(emailData);
      } else {
        console.log('[API] Sending status change email...');
        result = await emailServiceInstance.sendDoctorStatusChangeEmail({
          ...emailData,
          newStatus: newStatus || 'verified',
          reason: reason || undefined
        });
      }
      console.log('[API] Email service call completed');
    } catch (emailError) {
      console.error('❌ [API] Email service call failed:', emailError);
      console.error('❌ [API] Email error details:', {
        message: emailError instanceof Error ? emailError.message : 'Unknown error',
        stack: emailError instanceof Error ? emailError.stack : undefined
      });
      return NextResponse.json(
        { 
          error: 'Email service call failed',
          details: emailError instanceof Error ? emailError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    console.log('[API] Email service result:', result);

    if (result.success) {
      console.log('✅ [API] Email sent successfully:', result.messageId);
      return NextResponse.json({ 
        success: true, 
        messageId: result.messageId 
      });
    } else {
      console.error('❌ [API] Email failed:', result.error);
      console.error('❌ [API] Full result object:', result);
      return NextResponse.json(
        { 
          error: result.error || 'Failed to send email',
          details: result.error,
          success: false,
          debug: {
            hasError: !!result.error,
            errorType: typeof result.error,
            fullResult: result
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ [API] Error in send-verification-email API:', error);
    console.error('❌ [API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          errorType: typeof error,
          hasMessage: error instanceof Error,
          errorName: error instanceof Error ? error.name : 'Unknown'
        }
      },
      { status: 500 }
    );
  }
}
