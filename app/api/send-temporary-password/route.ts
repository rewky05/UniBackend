import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/email.service';
import { TemporaryPasswordService } from '@/lib/services/temporary-password.service';

export async function POST(request: NextRequest) {
  console.log('[API] Temporary password email API route called');
  
  try {
    const body = await request.json();
    const { 
      userName, 
      userEmail, 
      userType, 
      adminName, 
      clinicName,
      loginUrl 
    } = body;

    // Validate required fields
    if (!userName || !userEmail || !userType || !adminName) {
      console.error('❌ [API] Missing required fields:', { userName, userEmail, userType, adminName });
      return NextResponse.json(
        { 
          error: 'Missing required fields: userName, userEmail, userType, adminName are required' 
        },
        { status: 400 }
      );
    }

    // Validate userType
    if (!['doctor', 'patient'].includes(userType)) {
      console.error('❌ [API] Invalid userType:', userType);
      return NextResponse.json(
        { 
          error: 'Invalid userType. Must be "doctor" or "patient"' 
        },
        { status: 400 }
      );
    }

    console.log('[API] Email data prepared:', {
      userName,
      userEmail,
      userType,
      adminName,
      clinicName,
      loginUrl
    });

    // Get temporary password data
    const tempPasswordService = TemporaryPasswordService.getInstance();
    const tempPasswordData = await tempPasswordService.getTemporaryPasswordData(body.tempPasswordId);
    
    if (!tempPasswordData) {
      console.error('❌ [API] Temporary password not found or expired');
      return NextResponse.json(
        { 
          error: 'Temporary password not found or expired' 
        },
        { status: 404 }
      );
    }

    const emailData = {
      userName,
      userEmail,
      temporaryPassword: tempPasswordData.password,
      userType,
      adminName,
      clinicName: clinicName || 'UniHealth Medical System',
      loginUrl: loginUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
    };

    console.log('[API] Sending temporary password email...');
    const emailService = EmailService.getInstance();
    const result = await emailService.sendTemporaryPasswordEmail(emailData);

    console.log('[API] Email service result:', result);

    if (result.success) {
      // Mark temporary password as sent
      await tempPasswordService.markAsSent(body.tempPasswordId);
      
      console.log('✅ [API] Temporary password email sent successfully');
      return NextResponse.json({
        success: true,
        message: 'Temporary password email sent successfully',
        messageId: result.messageId
      });
    } else {
      console.error('❌ [API] Failed to send temporary password email:', result.error);
      return NextResponse.json(
        { 
          error: 'Failed to send temporary password email',
          details: result.error
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ [API] Error in temporary password email API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
