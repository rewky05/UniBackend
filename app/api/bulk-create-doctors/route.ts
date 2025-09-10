import { NextRequest, NextResponse } from 'next/server';
import { RealDataService } from '@/lib/services/real-data.service';
import { TemporaryPasswordService } from '@/lib/services/temporary-password.service';
import { EmailService } from '@/lib/services/email.service';

export async function POST(request: NextRequest) {
  console.log('👥 [API] Bulk create doctors API route called');
  
  try {
    const body = await request.json();
    const { doctorsData, batchSize = 5 } = body;

    // Validate required fields
    if (!doctorsData || !Array.isArray(doctorsData) || doctorsData.length === 0) {
      console.error('❌ [API] Missing or invalid doctors data');
      return NextResponse.json(
        { 
          error: 'Missing or invalid doctors data: expected array of doctor objects' 
        },
        { status: 400 }
      );
    }

    console.log(`👥 [API] Processing ${doctorsData.length} doctors in batches of ${batchSize}`);

    const results = [];
    const errors = [];
    let successCount = 0;
    let emailSuccessCount = 0;

    // Process doctors in batches
    for (let i = 0; i < doctorsData.length; i += batchSize) {
      const batch = doctorsData.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`👥 [API] Processing batch ${batchNumber} (${batch.length} doctors)`);

      const batchResults = [];
      const batchErrors = [];

      // Process each doctor in the batch
      for (let j = 0; j < batch.length; j++) {
        const doctorData = batch[j];
        const doctorIndex = i + j + 1;

        try {
          console.log(`👨‍⚕️ [API] Creating doctor ${doctorIndex}/${doctorsData.length}: ${doctorData.email}`);
          console.log(`🔍 [API] Doctor data keys:`, Object.keys(doctorData));
          console.log(`🔍 [API] temporaryPassword value:`, doctorData.temporaryPassword);
          console.log(`🔍 [API] temporaryPassword type:`, typeof doctorData.temporaryPassword);

          // 1. Validate and use the provided temporary password from the form
          const temporaryPassword = doctorData.temporaryPassword;
          
          if (!temporaryPassword || temporaryPassword.trim() === '') {
            console.error(`❌ [API] Temporary password validation failed for doctor ${doctorIndex}:`, {
              temporaryPassword,
              isEmpty: !temporaryPassword,
              isWhitespace: temporaryPassword && temporaryPassword.trim() === '',
              type: typeof temporaryPassword
            });
            throw new Error('Temporary password is required and cannot be empty');
          }
          
          const tempPasswordId = 'user_provided_' + Date.now();
          console.log(`👨‍⚕️ [API] Using provided temporary password for doctor ${doctorIndex}:`, temporaryPassword);

          // 2. Create Firebase Authentication account
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          const { auth } = await import('@/lib/firebase/config');
          
          console.log(`🔐 [API] Creating Firebase Auth user for doctor ${doctorIndex}: ${doctorData.email}`);
          const userCredential = await createUserWithEmailAndPassword(auth, doctorData.email, temporaryPassword);
          const doctorId = userCredential.user.uid;
          console.log(`✅ [API] Firebase Auth user created for doctor ${doctorIndex}: ${doctorId}`);

          // 3. Create doctor using RealDataService
          const realDataService = new RealDataService();
          const result = await realDataService.createDoctor(doctorData, doctorId, temporaryPassword, tempPasswordId);

          console.log(`✅ [API] Doctor ${doctorIndex} created successfully:`, {
            doctorId: result.doctorId,
            passwordLength: result.temporaryPassword.length,
            tempPasswordId: result.tempPasswordId
          });

          // Send welcome email with temporary password
          console.log(`📧 [API] Sending welcome email for doctor ${doctorIndex}...`);
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
            console.log(`✅ [API] Welcome email sent for doctor ${doctorIndex}:`, emailResult.messageId);
            emailSuccessCount++;
          } else {
            console.error(`❌ [API] Failed to send welcome email for doctor ${doctorIndex}:`, emailResult.error);
          }

          batchResults.push({
            index: doctorIndex,
            email: doctorData.email,
            doctorId: result.doctorId,
            temporaryPassword: result.temporaryPassword,
            tempPasswordId: result.tempPasswordId,
            emailSent: emailResult.success,
            emailMessageId: emailResult.messageId,
            success: true
          });

          successCount++;

        } catch (error) {
          console.error(`❌ [API] Error creating doctor ${doctorIndex} (${doctorData.email}):`, error);
          
          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            errorMessage = error.message;
            if (error.message.includes('auth/admin-restricted-operation')) {
              errorMessage = 'Firebase Auth admin restriction: This email domain may not be authorized or there are too many rapid requests.';
            }
          }
          
          batchErrors.push({
            index: doctorIndex,
            email: doctorData.email,
            error: errorMessage,
            success: false
          });
        }

        // Small delay between individual doctor creations to prevent rate limiting
        if (j < batch.length - 1) {
          console.log(`⏳ [API] Waiting 1 second before next doctor creation...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      results.push(...batchResults);
      errors.push(...batchErrors);

      // Delay between batches to prevent API overload
      if (i + batchSize < doctorsData.length) {
        console.log(`⏳ [API] Waiting 2 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`👥 [API] Bulk creation completed:`, {
      total: doctorsData.length,
      successful: successCount,
      failed: errors.length,
      emailsSent: emailSuccessCount
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: doctorsData.length,
        successful: successCount,
        failed: errors.length,
        emailsSent: emailSuccessCount
      },
      results,
      errors
    });

  } catch (error) {
    console.error('❌ [API] Error in bulk doctor creation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create doctors in bulk',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
