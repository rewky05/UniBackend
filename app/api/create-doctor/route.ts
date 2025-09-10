import { NextRequest, NextResponse } from 'next/server';
import { RealDataService } from '@/lib/services/real-data.service';
import { TemporaryPasswordService } from '@/lib/services/temporary-password.service';
import { EmailService } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
  console.log('👨‍⚕️ [API] Create doctor API route called');
  
  try {
    const body = await request.json();
    const { doctorData } = body;

    // Validate required fields
    if (!doctorData || !doctorData.email || !doctorData.firstName || !doctorData.lastName) {
      console.error('❌ [API] Missing required doctor data');
      return NextResponse.json(
        { 
          error: 'Missing required doctor data: email, firstName, lastName are required' 
        },
        { status: 400 }
      );
    }

    console.log('👨‍⚕️ [API] Creating doctor with email:', doctorData.email);

    // 1. Validate and use the provided temporary password from the form
    const temporaryPassword = doctorData.temporaryPassword;
    
    if (!temporaryPassword || temporaryPassword.trim() === '') {
      console.error('❌ [API] Temporary password is required and cannot be empty');
      return NextResponse.json(
        { 
          error: 'Temporary password is required and cannot be empty' 
        },
        { status: 400 }
      );
    }
    
    const tempPasswordId = 'user_provided_' + Date.now();
    console.log('👨‍⚕️ [API] Using provided temporary password:', temporaryPassword);

    // 2. Create Firebase Authentication account
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const { auth } = await import('@/lib/firebase/config');
    const userCredential = await createUserWithEmailAndPassword(auth, doctorData.email, temporaryPassword);
    const doctorId = userCredential.user.uid;

    // 3. Create doctor using RealDataService
    const realDataService = new RealDataService();
    const result = await realDataService.createDoctor(doctorData, doctorId, temporaryPassword, tempPasswordId);

    console.log('👨‍⚕️ [API] Doctor created successfully:', {
      doctorId: result.doctorId,
      passwordLength: result.temporaryPassword.length,
      tempPasswordId: result.tempPasswordId
    });

    // Send welcome email with temporary password
    console.log('📧 [API] Sending welcome email...');
    const emailService = EmailService.getInstance();
    const emailResult = await emailService.sendTemporaryPasswordEmail({
      userName: `${doctorData.firstName} ${doctorData.lastName}`,
      userEmail: doctorData.email,
      temporaryPassword: result.temporaryPassword,
      userType: 'doctor',
      adminName: doctorData.createdBy || 'System Administrator',
      clinicName: doctorData.clinicName || 'UniHealth Medical System'
    });

    if (emailResult.success) {
      console.log('✅ [API] Welcome email sent successfully:', emailResult.messageId);
    } else {
      console.error('❌ [API] Failed to send welcome email:', emailResult.error);
    }

    return NextResponse.json({
      success: true,
      doctorId: result.doctorId,
      temporaryPassword: result.temporaryPassword,
      tempPasswordId: result.tempPasswordId,
      message: 'Doctor created successfully'
    });

  } catch (error) {
    console.error('❌ [API] Error creating doctor:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create doctor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
