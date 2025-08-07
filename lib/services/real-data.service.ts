import { ref, get, onValue, query, orderByChild, equalTo, set, push } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import type { 
  Doctor, 
  Clinic, 
  Feedback, 
  User, 
  Appointment, 
  Patient, 
  Referral, 
  DashboardStats,
  MedicalSpecialty,
  LabTest,
  ImagingTest,
  ConsultationType
} from '@/lib/types/database';

export class RealDataService {
  /**
   * Generate a random temporary password that meets Firebase requirements
   * TEMPORARILY COMMENTED OUT FOR TESTING - REPLACED WITH STATIC PASSWORD
   */
  /*
  private generateTemporaryPassword(): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    
    // Fill the rest with random characters from all categories
    const allChars = lowercase + uppercase + numbers + specialChars;
    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password to make it more random
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
  */
  
  /**
   * TEMPORARY: Return a static password for testing
   */
  private generateTemporaryPassword(): string {
    return 'TestPass123!';
  }

  /**
   * Create a new doctor with entries in users, doctors, and specialistSchedules nodes
   */
  async createDoctor(doctorData: any): Promise<{ doctorId: string; temporaryPassword: string }> {
    try {
      const timestamp = new Date().toISOString();
      // Use provided temporary password or generate one
      const temporaryPassword = doctorData.temporaryPassword || this.generateTemporaryPassword();
      
      console.log('Creating doctor with temporary password:', temporaryPassword);

      // 1. Create Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(auth, doctorData.email, temporaryPassword);
      
      // Note: createUserWithEmailAndPassword automatically signs in the new user
      // We need to handle this in the calling component to prevent the admin from being signed out

      // 2. Use the Firebase Auth UID as the unique key
      const doctorId = userCredential.user.uid;
      
      const userData = {
        contactNumber: doctorData.phone,
        createdAt: timestamp,
        email: doctorData.email,
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
        role: 'specialist',
        specialty: doctorData.specialty
      };

      // 3. Create doctor entry
      const doctorEntry = {
        accreditations: doctorData.accreditations || [],
        address: doctorData.address,
        boardCertifications: doctorData.certifications?.map((cert: any) => cert.name) || [],
        civilStatus: doctorData.civilStatus,
        clinicAffiliations: doctorData.schedules?.map((schedule: any) => schedule.practiceLocation.clinicId) || [],
        contactNumber: doctorData.phone,
        createdAt: timestamp,
        dateOfBirth: doctorData.dateOfBirth,
        education: doctorData.education || [],
        email: doctorData.email,
        fellowships: doctorData.fellowships || [],
        firstName: doctorData.firstName,
        gender: doctorData.gender,
        isGeneralist: false,
        isSpecialist: true,
        lastLogin: timestamp,
        lastName: doctorData.lastName,
        lastUpdated: timestamp,
        medicalLicenseNumber: doctorData.medicalLicense,
        prcExpiryDate: doctorData.prcExpiry,
        prcId: doctorData.prcId,
        professionalFee: doctorData.professionalFee || 0,
        profileImageUrl: doctorData.profileImageUrl || '',
        specialty: doctorData.specialty,
        status: 'pending',
        userId: doctorId,
        verificationDate: null,
        verificationNotes: '',
        verifiedByAdminId: null,
        yearsOfExperience: doctorData.yearsOfExperience || 0
      };

      // 4. Create specialist schedules
      const schedulesData: any = {};
      if (doctorData.schedules && doctorData.schedules.length > 0) {
        // Use Promise.all to create all schedules with push() for unique keys
        const schedulePromises = doctorData.schedules.map(async (schedule: any) => {
          const schedulesRef = ref(db, `specialistSchedules/${doctorId}`);
          const newScheduleRef = push(schedulesRef);
          const scheduleId = newScheduleRef.key!;
          
          const scheduleData = {
            createdAt: timestamp,
            isActive: schedule.isActive,
            lastUpdated: timestamp,
            practiceLocation: schedule.practiceLocation,
            recurrence: schedule.recurrence,
            scheduleType: schedule.scheduleType,
            slotTemplate: schedule.slotTemplate,
            specialistId: doctorId,
            validFrom: schedule.validFrom
          };
          
          return set(newScheduleRef, scheduleData);
        });
        
        // Wait for all schedules to be created
        await Promise.all(schedulePromises);
      }

      // Save to Firebase
      await Promise.all([
        set(ref(db, `users/${doctorId}`), userData),
        set(ref(db, `doctors/${doctorId}`), doctorEntry)
      ]);

      console.log('Doctor created successfully. Returning:', { doctorId, temporaryPassword });
      return { doctorId, temporaryPassword };
    } catch (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  }

  /**
   * Get all specialist doctors from your database
   */
  async getDoctors(): Promise<Doctor[]> {
    try {
      const snapshot = await get(ref(db, 'doctors'));
      if (!snapshot.exists()) return [];
      
      const doctors = snapshot.val();
      const allDoctors = Object.keys(doctors).map(id => ({
        id,
        ...doctors[id]
      }));
      
      // Filter to show only specialists
      const specialists = allDoctors.filter(doctor => doctor.isSpecialist === true);
      

      
      return specialists;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time specialist doctors updates
   */
  subscribeToDoctors(callback: (doctors: Doctor[]) => void): () => void {
    const doctorsRef = ref(db, 'doctors');
    
    const unsubscribe = onValue(doctorsRef, (snapshot) => {
      const doctors: Doctor[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach(id => {
          const doctor = { id, ...data[id] };
          // Only include specialists
          if (doctor.isSpecialist === true) {
            doctors.push(doctor);
          }
        });
      }
      callback(doctors);
    });

    return unsubscribe;
  }

  /**
   * Get all clinics from your database
   */
  async getClinics(): Promise<Clinic[]> {
    try {
      const snapshot = await get(ref(db, 'clinics'));
      if (!snapshot.exists()) return [];
      
      const clinics = snapshot.val();
      return Object.keys(clinics).map(id => ({
        id,
        ...clinics[id]
      }));
    } catch (error) {
      console.error('Error fetching clinics:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time clinics updates
   */
  subscribeToClinics(callback: (clinics: Clinic[]) => void): () => void {
    const clinicsRef = ref(db, 'clinics');
    
    const unsubscribe = onValue(clinicsRef, (snapshot) => {
      const clinics: Clinic[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach(id => {
          clinics.push({ id, ...data[id] });
        });
      }
      callback(clinics);
    });

    return unsubscribe;
  }

  /**
   * Get all feedback from your database
   */
  async getFeedback(): Promise<any[]> {
    try {
      const snapshot = await get(ref(db, 'feedback'));
      if (!snapshot.exists()) return [];
      
      const feedback = snapshot.val();
      return Object.keys(feedback).map(id => {
        const rawFeedback = feedback[id];
        
        // Transform the data to match UI expectations
        return {
          id,
          // Patient info - handle both old and new structures
          patientName: rawFeedback.patientName || `${rawFeedback.patientFirstName || ''} ${rawFeedback.patientLastName || ''}`.trim(),
          patientInitials: rawFeedback.patientName ? 
            rawFeedback.patientName.split(' ').map(n => n.charAt(0)).join('').toUpperCase() :
            `${(rawFeedback.patientFirstName || '').charAt(0)}${(rawFeedback.patientLastName || '').charAt(0)}`,
          patientId: rawFeedback.patientId,
          
          // Doctor/Provider info - handle both old and new structures
          doctorName: rawFeedback.doctorName || `${rawFeedback.providerFirstName || ''} ${rawFeedback.providerLastName || ''}`.trim(),
          doctorSpecialty: 'Specialist', // Default since we don't have specialty in feedback
          providerId: rawFeedback.doctorId || rawFeedback.providerId,
          
          // Clinic info - handle both old and new structures
          clinic: rawFeedback.clinicName || rawFeedback.practiceLocationName || 'N/A',
          clinicId: rawFeedback.clinicId,
          
          // Rating and comments
          rating: rawFeedback.rating || 0,
          comment: rawFeedback.comment || rawFeedback.comments || 'No comment provided',
          
          // Appointment info
          appointmentDate: rawFeedback.appointmentDate,
          appointmentTime: rawFeedback.appointmentTime,
          appointmentType: rawFeedback.appointmentType || rawFeedback.treatmentType,
          clinicAppointmentId: rawFeedback.clinicAppointmentId,
          
          // Additional fields
          referralId: rawFeedback.referralId,
          sentiment: rawFeedback.sentiment || 'neutral',
          submittedBy: rawFeedback.submittedBy,
          timestamp: rawFeedback.timestamp,
          
          // UI-specific fields
          status: rawFeedback.status || 'pending',
          date: rawFeedback.timestamp || rawFeedback.appointmentDate,
          createdAt: rawFeedback.createdAt || rawFeedback.timestamp,
          
          // Tags for UI display (based on sentiment and rating)
          tags: rawFeedback.tags || [
            rawFeedback.sentiment === 'positive' ? 'Positive' : 
            rawFeedback.sentiment === 'negative' ? 'Negative' : 'Neutral',
            rawFeedback.rating >= 4 ? 'High Rating' : 
            rawFeedback.rating >= 3 ? 'Average Rating' : 'Low Rating'
          ].filter(Boolean)
        };
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time feedback updates
   */
  subscribeToFeedback(callback: (feedback: any[]) => void): () => void {
    const feedbackRef = ref(db, 'feedback');
    
    const unsubscribe = onValue(feedbackRef, (snapshot) => {
              const feedback: any[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach(id => {
          const rawFeedback = data[id];
          
          // Transform the data to match UI expectations
          const transformedFeedback = {
            id,
            // Patient info - handle both old and new structures
            patientName: rawFeedback.patientName || `${rawFeedback.patientFirstName || ''} ${rawFeedback.patientLastName || ''}`.trim(),
            patientInitials: rawFeedback.patientName ? 
              rawFeedback.patientName.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase() :
              `${(rawFeedback.patientFirstName || '').charAt(0)}${(rawFeedback.patientLastName || '').charAt(0)}`,
            patientId: rawFeedback.patientId,
            
            // Doctor/Provider info - handle both old and new structures
            doctorName: rawFeedback.doctorName || `${rawFeedback.providerFirstName || ''} ${rawFeedback.providerLastName || ''}`.trim(),
            doctorSpecialty: 'Specialist', // Default since we don't have specialty in feedback
            providerId: rawFeedback.doctorId || rawFeedback.providerId,
            
            // Clinic info - handle both old and new structures
            clinic: rawFeedback.clinicName || rawFeedback.practiceLocationName || 'N/A',
            clinicId: rawFeedback.clinicId,
            
            // Rating and comments
            rating: rawFeedback.rating || 0,
            comment: rawFeedback.comment || rawFeedback.comments || 'No comment provided',
            
            // Appointment info
            appointmentDate: rawFeedback.appointmentDate,
            appointmentTime: rawFeedback.appointmentTime,
            appointmentType: rawFeedback.appointmentType || rawFeedback.treatmentType,
            clinicAppointmentId: rawFeedback.clinicAppointmentId,
            
            // Additional fields
            referralId: rawFeedback.referralId,
            sentiment: rawFeedback.sentiment || 'neutral',
            submittedBy: rawFeedback.submittedBy,
            timestamp: rawFeedback.timestamp,
            
            // UI-specific fields
            status: 'pending', // Default status since it's not in the original data
            date: rawFeedback.timestamp || rawFeedback.appointmentDate,
            createdAt: rawFeedback.timestamp,
            
            // Tags for UI display (based on sentiment and rating)
            tags: [
              rawFeedback.sentiment === 'positive' ? 'Positive' : 
              rawFeedback.sentiment === 'negative' ? 'Negative' : 'Neutral',
              rawFeedback.rating >= 4 ? 'High Rating' : 
              rawFeedback.rating >= 3 ? 'Average Rating' : 'Low Rating'
            ].filter(Boolean)
          };
          
          feedback.push(transformedFeedback);
        });
      }
      callback(feedback);
    });

    return unsubscribe;
  }

  /**
   * Get all users from your database
   */
  async getUsers(): Promise<User[]> {
    try {
      const snapshot = await get(ref(db, 'users'));
      if (!snapshot.exists()) return [];
      
      const users = snapshot.val();
      return Object.keys(users).map(id => ({
        id,
        ...users[id]
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get all appointments from your database
   */
  async getAppointments(): Promise<Appointment[]> {
    try {
      const snapshot = await get(ref(db, 'appointments'));
      if (!snapshot.exists()) return [];
      
      const appointments = snapshot.val();
      return Object.keys(appointments).map(id => ({
        id,
        ...appointments[id]
      }));
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  /**
   * Get all patients from your database
   */
  async getPatients(): Promise<Patient[]> {
    try {
      const snapshot = await get(ref(db, 'patients'));
      if (!snapshot.exists()) return [];
      
      const patients = snapshot.val();
      return Object.keys(patients).map(id => ({
        id,
        ...patients[id]
      }));
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  /**
   * Get all referrals from your database
   */
  async getReferrals(): Promise<Referral[]> {
    try {
      const snapshot = await get(ref(db, 'referrals'));
      if (!snapshot.exists()) return [];
      
      const referrals = snapshot.val();
      return Object.keys(referrals).map(id => ({
        id,
        ...referrals[id]
      }));
    } catch (error) {
      console.error('Error fetching referrals:', error);
      throw error;
    }
  }

  /**
   * Calculate dashboard statistics from your real data (specialists only)
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [doctors, clinics, feedback, appointments, patients, referrals] = await Promise.all([
        this.getDoctors(), // This now returns only specialists
        this.getClinics(),
        this.getFeedback(),
        this.getAppointments(),
        this.getPatients(),
        this.getReferrals()
      ]);

      // Calculate stats from your real data (specialists only)
      const totalDoctors = doctors.length; // This is now specialists only
      const verifiedDoctors = doctors.filter(d => d.status === 'verified').length;
      const pendingVerification = doctors.filter(d => !d.status || d.status === 'pending').length;
      const suspendedDoctors = doctors.filter(d => d.status === 'suspended').length;

      const totalClinics = clinics.length;
      const activeClinics = clinics.filter(c => c.isActive).length;

      const totalFeedback = feedback.length;
      const averageRating = feedback.length > 0 
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
        : 0;

      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(a => a.status === 'completed').length;
      const pendingAppointments = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;

      return {
        totalDoctors,
        verifiedDoctors,
        pendingVerification,
        suspendedDoctors,
        totalClinics,
        activeClinics,
        totalFeedback,
        averageRating,
        totalAppointments,
        completedAppointments,
        pendingAppointments,
        totalPatients: patients.length,
        totalReferrals: referrals.length
      };
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get specialist doctors by specialty
   */
  async getDoctorsBySpecialty(specialty: string): Promise<Doctor[]> {
    try {
      const doctors = await this.getDoctors(); // This now returns only specialists
      return doctors.filter(doctor => 
        doctor.specialty.toLowerCase().includes(specialty.toLowerCase())
      );
    } catch (error) {
      console.error('Error fetching doctors by specialty:', error);
      throw error;
    }
  }

  /**
   * Get feedback by doctor
   */
  async getFeedbackByDoctor(doctorId: string): Promise<Feedback[]> {
    try {
      const feedback = await this.getFeedback();
      return feedback.filter(f => f.providerId === doctorId);
    } catch (error) {
      console.error('Error fetching feedback by doctor:', error);
      throw error;
    }
  }

  /**
   * Get appointments by clinic
   */
  async getAppointmentsByClinic(clinicId: string): Promise<Appointment[]> {
    try {
      const appointments = await this.getAppointments();
      return appointments.filter(a => a.clinicId === clinicId);
    } catch (error) {
      console.error('Error fetching appointments by clinic:', error);
      throw error;
    }
  }

  /**
   * Search specialist doctors by name or specialty
   */
  async searchDoctors(searchTerm: string): Promise<Doctor[]> {
    try {
      const doctors = await this.getDoctors(); // This now returns only specialists
      const term = searchTerm.toLowerCase();
      
      return doctors.filter(doctor => 
        doctor.firstName.toLowerCase().includes(term) ||
        doctor.lastName.toLowerCase().includes(term) ||
        (`${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(term)) ||
        doctor.specialty.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching doctors:', error);
      throw error;
    }
  }

  /**
   * Get recent activity from adminActivityLogs (if exists) or fallback to system activities
   */
  async getRecentActivity(limit: number = 10): Promise<any[]> {
    try {
      // First try to get admin activity logs
      const snapshot = await get(ref(db, 'adminActivityLogs'));
      if (snapshot.exists()) {
        const activities = snapshot.val();
        const activityList = Object.keys(activities).map(id => {
          const rawActivity = activities[id];
          
          // Transform the data to match UI expectations
          return {
            id,
            action: rawActivity.action || 'System Activity',
            targetDoctor: rawActivity.targetName || 'N/A',
            targetDoctorId: rawActivity.targetId || '',
            adminUser: rawActivity.adminEmail || 'System',
            adminEmail: rawActivity.adminEmail || 'system@unihealth.ph',
            description: rawActivity.details?.description || rawActivity.action || 'Activity performed',
            category: rawActivity.targetType || 'system',
            timestamp: rawActivity.timestamp,
            ipAddress: rawActivity.details?.ipAddress || 'N/A',
            details: rawActivity.details || {}
          };
        });
        
        // Sort by timestamp (newest first) and limit results
        return activityList
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
      }

      // Fallback to system activities if adminActivityLogs doesn't exist yet
      const [appointments, referrals, feedback] = await Promise.all([
        this.getAppointments(),
        this.getReferrals(),
        this.getFeedback()
      ]);

      // Combine and transform to match UI expectations
      const activities = [
        ...appointments.map(a => ({
          id: a.id,
          action: `${a.type} appointment ${a.status}`,
          targetDoctor: `${a.doctorFirstName || ''} ${a.doctorLastName || ''}`.trim() || 'N/A',
          targetDoctorId: a.doctorId || '',
          adminUser: `${a.bookedByUserFirstName} ${a.bookedByUserLastName}`,
          adminEmail: 'system@unihealth.ph',
          description: `Appointment ${a.status} for ${a.patientFirstName} ${a.patientLastName}`,
          category: 'appointment',
          timestamp: a.createdAt,
          ipAddress: 'N/A',
          details: a
        })),
        ...referrals.map(r => ({
          id: r.id,
          action: `Referral ${r.status}`,
          targetDoctor: `${r.assignedSpecialistFirstName} ${r.assignedSpecialistLastName}`,
          targetDoctorId: r.assignedSpecialistId,
          adminUser: `${r.referringGeneralistFirstName} ${r.referringGeneralistLastName}`,
          adminEmail: 'system@unihealth.ph',
          description: `Referral ${r.status} for ${r.patientFirstName} ${r.patientLastName}`,
          category: 'referral',
          timestamp: r.referralTimestamp,
          ipAddress: 'N/A',
          details: r
        })),
        ...feedback.map(f => ({
          id: f.id,
          action: `Feedback submitted (${f.rating}★)`,
          targetDoctor: f.doctorName,
          targetDoctorId: f.providerId,
          adminUser: `${f.patientFirstName} ${f.patientLastName}`,
          adminEmail: 'patient@unihealth.ph',
          description: `Feedback submitted with ${f.rating} star rating`,
          category: 'feedback',
          timestamp: f.timestamp,
          ipAddress: 'N/A',
          details: f
        }))
      ];

      // Sort by timestamp (newest first) and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  // Medical Services Catalogs
  /**
   * Get medical specialties
   */
  async getMedicalSpecialties(): Promise<MedicalSpecialty[]> {
    try {
      const snapshot = await get(ref(db, 'medicalServices/specialties'));
      if (!snapshot.exists()) return [];
      
      const specialties = snapshot.val();
      return Object.keys(specialties).map(id => ({
        id,
        ...specialties[id]
      }));
    } catch (error) {
      console.error('Error fetching medical specialties:', error);
      throw error;
    }
  }

  /**
   * Get laboratory tests
   */
  async getLabTests(): Promise<LabTest[]> {
    try {
      const snapshot = await get(ref(db, 'medicalServices/laboratoryTests'));
      if (!snapshot.exists()) return [];
      
      const tests = snapshot.val();
      return Object.keys(tests).map(id => ({
        id,
        ...tests[id]
      }));
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      throw error;
    }
  }

  /**
   * Get imaging tests
   */
  async getImagingTests(): Promise<ImagingTest[]> {
    try {
      const snapshot = await get(ref(db, 'medicalServices/imagingTests'));
      if (!snapshot.exists()) return [];
      
      const tests = snapshot.val();
      return Object.keys(tests).map(id => ({
        id,
        ...tests[id]
      }));
    } catch (error) {
      console.error('Error fetching imaging tests:', error);
      throw error;
    }
  }

  /**
   * Get consultation types
   */
  async getConsultationTypes(): Promise<ConsultationType[]> {
    try {
      const snapshot = await get(ref(db, 'medicalServices/consultationTypes'));
      if (!snapshot.exists()) return [];
      
      const types = snapshot.val();
      return Object.keys(types).map(id => ({
        id,
        ...types[id]
      }));
    } catch (error) {
      console.error('Error fetching consultation types:', error);
      throw error;
    }
  }

  /**
   * Create a new patient with entries in users and patients nodes
   */
  async createPatient(patientData: any): Promise<{ patientId: string; temporaryPassword: string }> {
    try {
      const timestamp = new Date().toISOString();
      // Use provided temporary password or generate one
      const temporaryPassword = patientData.temporaryPassword || this.generateTemporaryPassword();

      // 1. Create Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(auth, patientData.email, temporaryPassword);
      
      // Note: createUserWithEmailAndPassword automatically signs in the new user
      // We need to handle this in the calling component to prevent the admin from being signed out

      // 2. Use the Firebase Auth UID as the unique key
      const patientId = userCredential.user.uid;
      
      const userData = {
        contactNumber: patientData.phone,
        createdAt: timestamp,
        email: patientData.email,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        role: 'patient',
        patientId: patientId
      };

      // 3. Create patient entry
      const patientEntry = {
        userId: patientId,
        firstName: patientData.firstName,
        middleName: patientData.middleName || '',
        lastName: patientData.lastName,
        dateOfBirth: patientData.dateOfBirth,
        gender: patientData.gender,
        educationalAttainment: patientData.educationalAttainment || '',
        emergencyContact: patientData.emergencyContact,
        address: patientData.address || '',
        createdAt: timestamp,
        lastUpdated: timestamp,
        isActive: true // Default to active
      };

      // 4. Save to Firebase
      await set(ref(db, `users/${patientId}`), userData);
      await set(ref(db, `patients/${patientId}`), patientEntry);

      return { patientId, temporaryPassword };
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  async updatePatient(patientId: string, patientData: any): Promise<void> {
    try {
      const patientRef = ref(db, `patients/${patientId}`);
      await set(patientRef, {
        ...patientData,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const realDataService = new RealDataService();