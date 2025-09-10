import { NextRequest, NextResponse } from 'next/server';
import { RealDataService } from '@/lib/services/real-data.service';
import { TemporaryPasswordService } from '@/lib/services/temporary-password.service';
import { EmailService } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
  console.log('👤 [API] Create patient API route called');
  
  try {
    const body = await request.json();
    const { patientData } = body;

    // Validate required fields
    if (!patientData || !patientData.email || !patientData.firstName || !patientData.lastName) {
      console.error('❌ [API] Missing required patient data');
      return NextResponse.json(
        { 
          error: 'Missing required patient data: email, firstName, lastName are required' 
        },
        { status: 400 }
      );
    }

    console.log('👤 [API] Creating patient with email:', patientData.email);

    // 1. Validate and use the provided temporary password from the form
    const temporaryPassword = patientData.temporaryPassword;
    
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
    console.log('👤 [API] Using provided temporary password:', temporaryPassword);

    // 2. Create Firebase Authentication account
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const { auth } = await import('@/lib/firebase/config');
    const userCredential = await createUserWithEmailAndPassword(auth, patientData.email, temporaryPassword);
    const patientId = userCredential.user.uid;

    // 3. Create patient using RealDataService
    const realDataService = new RealDataService();
    const result = await realDataService.createPatient(patientData, patientId, temporaryPassword, tempPasswordId);

    console.log('👤 [API] Patient created successfully:', {
      patientId: result.patientId,
      passwordLength: result.temporaryPassword.length,
      tempPasswordId: result.tempPasswordId
    });

    // Send welcome email with temporary password
    console.log('📧 [API] Sending welcome email...');
    const emailService = EmailService.getInstance();
    const emailResult = await emailService.sendTemporaryPasswordEmail({
      userName: `${patientData.firstName} ${patientData.lastName}`,
      userEmail: patientData.email,
      temporaryPassword: result.temporaryPassword,
      userType: 'patient',
      adminName: patientData.createdBy || 'System Administrator',
      clinicName: patientData.clinicName || 'UniHealth Medical System'
    });

    if (emailResult.success) {
      console.log('✅ [API] Welcome email sent successfully:', emailResult.messageId);
    } else {
      console.error('❌ [API] Failed to send welcome email:', emailResult.error);
    }

    return NextResponse.json({
      success: true,
      patientId: result.patientId,
      temporaryPassword: result.temporaryPassword,
      tempPasswordId: result.tempPasswordId,
      emailSent: emailResult.success,
      emailMessageId: emailResult.messageId
    });

  } catch (error) {
    console.error('❌ [API] Error creating patient:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create patient',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
