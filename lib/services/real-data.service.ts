import { ref, get, onValue, query, orderByChild, equalTo, set, push, update } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import { safeGetTimestamp, resolveAddress, resolveFullAddress, getAddressComponents, getStreetAddress, getLocationDetails } from '@/lib/utils';
import { calculateAverageConsultationTime } from '@/lib/utils/consultation-time';
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
        createdAt: timestamp,
        doctorId: doctorId,
        email: doctorData.email,
        firstName: doctorData.firstName,
        middleName: doctorData.middleName || '',
        lastName: doctorData.lastName,
        role: 'specialist'
      };

      // 3. Create doctor entry (detailed information)
      const doctorEntry = {
        address: doctorData.address,
        civilStatus: doctorData.civilStatus,
        clinicAffiliations: doctorData.schedules?.map((schedule: any) => schedule.practiceLocation.clinicId) || [],
        contactNumber: doctorData.phone, // ✅ Reverted: Use 'phone' as provided by bulk import
        createdAt: timestamp,
        dateOfBirth: doctorData.dateOfBirth,
        email: doctorData.email,
        firstName: doctorData.firstName,
        gender: doctorData.gender,
        isGeneralist: false,
        isSpecialist: true,
        lastLogin: timestamp,
        lastName: doctorData.lastName,
        medicalLicenseNumber: doctorData.medicalLicenseNumber, // ✅ Reverted: Use 'medicalLicense' as provided by bulk import
        prcExpiryDate: doctorData.prcExpiryDate, // ✅ Reverted: Use 'prcExpiry' as provided by bulk import
        prcId: doctorData.prcId,
        professionalFee: doctorData.professionalFee || 0,
        profileImageUrl: doctorData.profileImageUrl || '',
        specialty: doctorData.specialty,
        status: 'pending',
        userId: doctorId
      };

      // 4. Create specialist schedules
      if (doctorData.schedules && doctorData.schedules.length > 0) {
        const scheduleData: any = {};
        
        doctorData.schedules.forEach((schedule: any, index: number) => {
          const scheduleKey = `sched_${doctorId}_${index + 1}`;
          scheduleData[scheduleKey] = {
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
        });
        
        // Save schedules to Firebase
        await set(ref(db, `specialistSchedules/${doctorId}`), scheduleData);
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
   * Get a single doctor by ID with user data
   */
  async getDoctorById(doctorId: string): Promise<Doctor | null> {
    try {
      // Fetch both specific doctor and users data
      const [doctorSnapshot, usersSnapshot] = await Promise.all([
        get(ref(db, `doctors/${doctorId}`)),
        get(ref(db, 'users'))
      ]);
      
      if (!doctorSnapshot.exists()) return null;
      
      const doctor = doctorSnapshot.val();
      const users = usersSnapshot.exists() ? usersSnapshot.val() : {};
      const userId = doctor.userId;
      const user = users[userId] || {};
      
      // Resolve addresses using the utility function
      const resolvedAddress = resolveAddress(doctor);
      const resolvedFullAddress = resolveFullAddress(doctor);
      const streetAddress = getStreetAddress(doctor);
      const locationDetails = getLocationDetails(doctor);
      const addressComponents = getAddressComponents(doctor);
      
      return {
        id: doctorId,
        userId: userId,
        // User data
        firstName: user.firstName || doctor.firstName || '',
        middleName: user.middleName || doctor.middleName || '',
        lastName: user.lastName || doctor.lastName || '',
        email: user.email || doctor.email || '',
        // Doctor data
        ...doctor,
        // Resolved address data
        resolvedAddress,
        resolvedFullAddress,
        streetAddress,
        locationDetails,
        addressComponents
      };
    } catch (error) {
      console.error('Error fetching doctor by ID:', error);
      throw error;
    }
  }

  /**
   * Get all specialist doctors from your database with user data
   */
  async getDoctors(): Promise<Doctor[]> {
    try {
      // Fetch both doctors and users data
      const [doctorsSnapshot, usersSnapshot] = await Promise.all([
        get(ref(db, 'doctors')),
        get(ref(db, 'users'))
      ]);
      
      if (!doctorsSnapshot.exists()) return [];
      
      const doctors = doctorsSnapshot.val();
      const users = usersSnapshot.exists() ? usersSnapshot.val() : {};
      
      const allDoctors = Object.keys(doctors).map(doctorId => {
        const doctor = doctors[doctorId];
        const userId = doctor.userId;
        const user = users[userId] || {};
        
        // Resolve addresses using the utility function
        const resolvedAddress = resolveAddress(doctor);
        const resolvedFullAddress = resolveFullAddress(doctor);
        const streetAddress = getStreetAddress(doctor);
        const locationDetails = getLocationDetails(doctor);
        const addressComponents = getAddressComponents(doctor);
        
        return {
          id: doctorId,
          userId: userId,
          // User data
          firstName: user.firstName || doctor.firstName || '',
          middleName: user.middleName || doctor.middleName || '',
          lastName: user.lastName || doctor.lastName || '',
          email: user.email || doctor.email || '',
          // Doctor data
          ...doctor,
          // Resolved address data
          resolvedAddress,
          resolvedFullAddress,
          streetAddress,
          locationDetails,
          addressComponents
        };
      });
      
      // Filter to show only specialists
      const specialists = allDoctors.filter(doctor => doctor.isSpecialist === true);
      
      return specialists;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time appointments updates
   */
  subscribeToAppointments(callback: (appointments: Appointment[]) => void): () => void {
    const appointmentsRef = ref(db, 'appointments');
    const patientsRef = ref(db, 'patients');
    const doctorsRef = ref(db, 'doctors');
    const clinicsRef = ref(db, 'clinics');
    const usersRef = ref(db, 'users');
    
    const unsubscribe = onValue(appointmentsRef, async (appointmentsSnapshot) => {
      try {
        if (!appointmentsSnapshot.exists()) {
          callback([]);
          return;
        }
        
        // Fetch related data in parallel
        const [patientsSnapshot, doctorsSnapshot, clinicsSnapshot, usersSnapshot] = await Promise.all([
          get(patientsRef),
          get(doctorsRef),
          get(clinicsRef),
          get(usersRef)
        ]);
        
        const appointments = appointmentsSnapshot.val();
        const patients = patientsSnapshot.exists() ? patientsSnapshot.val() : {};
        const doctors = doctorsSnapshot.exists() ? doctorsSnapshot.val() : {};
        const clinics = clinicsSnapshot.exists() ? clinicsSnapshot.val() : {};
        const users = usersSnapshot.exists() ? usersSnapshot.val() : {};
        
        // Create lookup maps for quick access
        const patientNameMap: { [key: string]: { firstName: string; lastName: string } } = {};
        const doctorNameMap: { [key: string]: { firstName: string; lastName: string } } = {};
        const clinicNameMap: { [key: string]: string } = {};
        const userNameMap: { [key: string]: { firstName: string; lastName: string } } = {};
        
        // Build patient name map
        Object.keys(patients).forEach(patientId => {
          const patient = patients[patientId];
          if (patient && (patient.firstName || patient.lastName)) {
            patientNameMap[patientId] = {
              firstName: patient.firstName || 'Unknown',
              lastName: patient.lastName || 'Patient'
            };
          }
        });
        
        // Build doctor name map
        Object.keys(doctors).forEach(doctorId => {
          const doctor = doctors[doctorId];
          if (doctor && (doctor.firstName || doctor.lastName)) {
            doctorNameMap[doctorId] = {
              firstName: doctor.firstName || 'Unknown',
              lastName: doctor.lastName || 'Doctor'
            };
          }
        });
        
        // Build clinic name map
        Object.keys(clinics).forEach(clinicId => {
          const clinic = clinics[clinicId];
          if (clinic && clinic.name) {
            clinicNameMap[clinicId] = clinic.name;
          }
        });
        
        // Build user name map
        Object.keys(users).forEach(userId => {
          const user = users[userId];
          if (user && (user.firstName || user.lastName)) {
            userNameMap[userId] = {
              firstName: user.firstName || 'Unknown',
              lastName: user.lastName || 'User'
            };
          }
        });
        
        const processedAppointments = Object.keys(appointments).map(id => {
          const appointment = appointments[id];
          const patientId = appointment.patientId;
          const doctorId = appointment.doctorId;
          const clinicId = appointment.clinicId;
          const bookedByUserId = appointment.bookedByUserId;
          
          const patientName = patientNameMap[patientId] || { firstName: 'Unknown', lastName: 'Patient' };
          const doctorName = doctorNameMap[doctorId] || { firstName: 'Unknown', lastName: 'Doctor' };
          const clinicName = clinicNameMap[clinicId] || 'Unknown Clinic';
          const bookedByUserName = bookedByUserId ? userNameMap[bookedByUserId] : null;
          
          return {
            id,
            ...appointment,
            patientFirstName: patientName.firstName,
            patientLastName: patientName.lastName,
            doctorFirstName: doctorName.firstName,
            doctorLastName: doctorName.lastName,
            clinicName,
            bookedByUserFirstName: bookedByUserName?.firstName,
            bookedByUserLastName: bookedByUserName?.lastName
          };
        });
        
        callback(processedAppointments);
      } catch (error) {
        console.error('Error processing appointments subscription:', error);
        callback([]);
      }
    });
    
    return unsubscribe;
  }

  /**
   * Subscribe to real-time referrals updates
   */
  subscribeToReferrals(callback: (referrals: Referral[]) => void): () => void {
    const referralsRef = ref(db, 'referrals');
    const clinicsRef = ref(db, 'clinics');
    
    const unsubscribe = onValue(referralsRef, async (referralsSnapshot) => {
      try {
        if (!referralsSnapshot.exists()) {
          callback([]);
          return;
        }
        
        const clinicsSnapshot = await get(clinicsRef);
        const clinics = clinicsSnapshot.exists() ? clinicsSnapshot.val() : {};
        
        // Create a map of clinic IDs to clinic names for quick lookup
        const clinicNameMap: { [key: string]: string } = {};
        Object.keys(clinics).forEach(clinicId => {
          clinicNameMap[clinicId] = clinics[clinicId].name || 'Unknown Clinic';
        });
        
        const referrals = referralsSnapshot.val();
        const processedReferrals = Object.keys(referrals).map(id => {
          const referral = referrals[id];
          const specialistClinicId = referral.practiceLocation?.clinicId;
          const referringClinicId = referral.referringClinicId;
          
          const specialistClinicName = specialistClinicId ? clinicNameMap[specialistClinicId] || 'Unknown Clinic' : 'Unknown Clinic';
          const referringClinicName = referringClinicId ? clinicNameMap[referringClinicId] || referral.referringClinicName || 'Unknown Clinic' : referral.referringClinicName || 'Unknown Clinic';
          
          return {
            id,
            ...referral,
            specialistClinicName,
            referringClinicName
          };
        });
        
        callback(processedReferrals);
      } catch (error) {
        console.error('Error processing referrals subscription:', error);
        callback([]);
      }
    });
    
    return unsubscribe;
  }

  /**
   * Subscribe to real-time specialist doctors updates
   */
  subscribeToDoctors(callback: (doctors: Doctor[]) => void): () => void {
    const doctorsRef = ref(db, 'doctors');
    const usersRef = ref(db, 'users');
    
    const unsubscribe = onValue(doctorsRef, async (doctorsSnapshot) => {
      try {
        // Also fetch users data to get middleName and other user fields
        const usersSnapshot = await get(usersRef);
        const users = usersSnapshot.exists() ? usersSnapshot.val() : {};
        
        const doctors: Doctor[] = [];
        if (doctorsSnapshot.exists()) {
          const data = doctorsSnapshot.val();
          Object.keys(data).forEach(id => {
            const doctorData = data[id];
            const userId = doctorData.userId;
            const user = users[userId] || {};
            
            // Resolve addresses using the utility function
            const resolvedAddress = resolveAddress(doctorData);
            const resolvedFullAddress = resolveFullAddress(doctorData);
            const streetAddress = getStreetAddress(doctorData);
            const locationDetails = getLocationDetails(doctorData);
            const addressComponents = getAddressComponents(doctorData);
            
            const doctor = { 
              id, 
              userId: userId,
              // User data (including middleName)
              firstName: user.firstName || doctorData.firstName || '',
              middleName: user.middleName || doctorData.middleName || '',
              lastName: user.lastName || doctorData.lastName || '',
              email: user.email || doctorData.email || '',
              // Doctor data
              ...doctorData,
              resolvedAddress,
              resolvedFullAddress,
              streetAddress,
              locationDetails,
              addressComponents
            };
            
            // Only include specialists
            if (doctor.isSpecialist === true) {
              doctors.push(doctor);
            }
          });
        }
        callback(doctors);
      } catch (error) {
        console.error('Error in subscribeToDoctors:', error);
        // Fallback to original behavior if users fetch fails
        const doctors: Doctor[] = [];
        if (doctorsSnapshot.exists()) {
          const data = doctorsSnapshot.val();
          Object.keys(data).forEach(id => {
            const doctorData = data[id];
            
            // Resolve addresses using the utility function
            const resolvedAddress = resolveAddress(doctorData);
            const resolvedFullAddress = resolveFullAddress(doctorData);
            const streetAddress = getStreetAddress(doctorData);
            const locationDetails = getLocationDetails(doctorData);
            const addressComponents = getAddressComponents(doctorData);
            
            const doctor = { 
              id, 
              ...doctorData,
              resolvedAddress,
              resolvedFullAddress,
              streetAddress,
              locationDetails,
              addressComponents
            };
            
            // Only include specialists
            if (doctor.isSpecialist === true) {
              doctors.push(doctor);
            }
          });
        }
        callback(doctors);
      }
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
      return Object.keys(clinics).map(id => {
        const clinic = clinics[id];
        
        // Resolve addresses using the utility function
        const resolvedAddress = resolveAddress(clinic);
        const resolvedFullAddress = resolveFullAddress(clinic);
        const streetAddress = getStreetAddress(clinic);
        const locationDetails = getLocationDetails(clinic);
        const addressComponents = getAddressComponents(clinic);
        
        return {
          id,
          ...clinic,
          resolvedAddress,
          resolvedFullAddress,
          streetAddress,
          locationDetails,
          addressComponents
        };
      });
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
          const clinic = data[id];
          
          // Resolve addresses using the utility function
          const resolvedAddress = resolveAddress(clinic);
          const resolvedFullAddress = resolveFullAddress(clinic);
          const streetAddress = getStreetAddress(clinic);
          const locationDetails = getLocationDetails(clinic);
          const addressComponents = getAddressComponents(clinic);
          
          clinics.push({ 
            id, 
            ...clinic,
            resolvedAddress,
            resolvedFullAddress,
            streetAddress,
            locationDetails,
            addressComponents
          });
        });
      }
      callback(clinics);
    });

    return unsubscribe;
  }

  /**
   * Get all feedback from your database with resolved patient, doctor, and clinic details
   */
  async getFeedback(): Promise<any[]> {
    try {
      // Fetch all related data
      const [feedbackSnapshot, patientsSnapshot, doctorsSnapshot, clinicsSnapshot, usersSnapshot] = await Promise.all([
        get(ref(db, 'feedback')),
        get(ref(db, 'patients')),
        get(ref(db, 'doctors')),
        get(ref(db, 'clinics')),
        get(ref(db, 'users'))
      ]);
      
      if (!feedbackSnapshot.exists()) return [];
      
      const feedback = feedbackSnapshot.val();
      const patients = patientsSnapshot.exists() ? patientsSnapshot.val() : {};
      const doctors = doctorsSnapshot.exists() ? doctorsSnapshot.val() : {};
      const clinics = clinicsSnapshot.exists() ? clinicsSnapshot.val() : {};
      const users = usersSnapshot.exists() ? usersSnapshot.val() : {};
      
      return Object.keys(feedback).map(id => {
        const rawFeedback = feedback[id];
        
        // Resolve patient details - try both id and patientId
        let patientDetails = null;
        const patientId = rawFeedback.patientId || rawFeedback.id;
        
        if (patientId) {
          // First try to find patient by patientId
          if (patients[patientId]) {
            patientDetails = patients[patientId];
          } else {
            // If not found, search through all patients to find by userId
            const foundPatient = Object.values(patients).find((p: any) => p.userId === patientId);
            if (foundPatient) {
              patientDetails = foundPatient;
            }
          }
        }
        
        // Resolve doctor details
        let doctorDetails = null;
        const doctorId = rawFeedback.doctorId || rawFeedback.providerId;
        if (doctorId && doctors[doctorId]) {
          doctorDetails = doctors[doctorId];
        }
        
        // Resolve clinic details
        let clinicDetails = null;
        const clinicId = rawFeedback.clinicId;
        if (clinicId && clinics[clinicId]) {
          clinicDetails = clinics[clinicId];
        }
        
        // Resolve user details for patient and doctor
        let patientUserDetails = null;
        let doctorUserDetails = null;
        
        if (patientDetails?.userId && users[patientDetails.userId]) {
          patientUserDetails = users[patientDetails.userId];
        }
        
        if (doctorDetails?.userId && users[doctorDetails.userId]) {
          doctorUserDetails = users[doctorDetails.userId];
        }
        
        // Transform the data to match UI expectations
        return {
          id,
          // Patient info - resolved from patients and users nodes
          patientId: patientId,
          patientName: rawFeedback.patientName || 
            (patientUserDetails ? `${patientUserDetails.firstName} ${patientUserDetails.lastName}` : 'Unknown Patient'),
          patientEmail: rawFeedback.patientEmail || 
            (patientUserDetails ? patientUserDetails.email : ''),
          patientFirstName: patientUserDetails?.firstName || patientDetails?.firstName || '',
          patientLastName: patientUserDetails?.lastName || patientDetails?.lastName || '',
          
          // Doctor/Provider info - resolved from doctors and users nodes
          providerId: doctorId,
          doctorId: doctorId,
          doctorName: rawFeedback.doctorName || 
            (doctorUserDetails ? `Dr. ${doctorUserDetails.firstName} ${doctorUserDetails.lastName}` : 'Unknown Doctor'),
          doctorFirstName: doctorUserDetails?.firstName || doctorDetails?.firstName || '',
          doctorLastName: doctorUserDetails?.lastName || doctorDetails?.lastName || '',
          
          // Clinic info - resolved from clinics node
          clinicId: clinicId,
          clinicName: rawFeedback.clinicName || 
            (clinicDetails ? clinicDetails.name : 'Unknown Clinic'),
          practiceLocationName: rawFeedback.practiceLocationName || 
            (clinicDetails ? clinicDetails.name : ''),
          
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
          isAnonymous: rawFeedback.isAnonymous || false,
          
          // UI-specific fields
          status: rawFeedback.status || 'pending',
          date: rawFeedback.timestamp || rawFeedback.appointmentDate,
          createdAt: rawFeedback.createdAt || rawFeedback.timestamp,
          
          // Tags for UI display
          tags: rawFeedback.tags || [
            rawFeedback.sentiment === 'positive' ? 'Positive' : 
            rawFeedback.sentiment === 'negative' ? 'Negative' : 'Neutral',
            rawFeedback.rating >= 4 ? 'High Rating' : 
            rawFeedback.rating >= 3 ? 'Average Rating' : 'Low Rating'
          ].filter(Boolean),
          
          // Raw data for debugging
          _rawFeedback: rawFeedback,
          _patientDetails: patientDetails,
          _doctorDetails: doctorDetails,
          _clinicDetails: clinicDetails
        };
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time feedback updates with resolved details
   */
  subscribeToFeedback(callback: (feedback: any[]) => void): () => void {
    const feedbackRef = ref(db, 'feedback');
    
    const unsubscribe = onValue(feedbackRef, async (snapshot) => {
      try {
        // Fetch all related data for resolution
        const [patientsSnapshot, doctorsSnapshot, clinicsSnapshot, usersSnapshot] = await Promise.all([
          get(ref(db, 'patients')),
          get(ref(db, 'doctors')),
          get(ref(db, 'clinics')),
          get(ref(db, 'users'))
        ]);
        
        const patients = patientsSnapshot.exists() ? patientsSnapshot.val() : {};
        const doctors = doctorsSnapshot.exists() ? doctorsSnapshot.val() : {};
        const clinics = clinicsSnapshot.exists() ? clinicsSnapshot.val() : {};
        const users = usersSnapshot.exists() ? usersSnapshot.val() : {};
        
        const feedback: any[] = [];
        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.keys(data).forEach(id => {
            const rawFeedback = data[id];
            
            // Resolve patient details - try both id and patientId
            let patientDetails = null;
            const patientId = rawFeedback.patientId || rawFeedback.id;
            
            if (patientId) {
              // First try to find patient by patientId
              if (patients[patientId]) {
                patientDetails = patients[patientId];
              } else {
                // If not found, search through all patients to find by userId
                const foundPatient = Object.values(patients).find((p: any) => p.userId === patientId);
                if (foundPatient) {
                  patientDetails = foundPatient;
                }
              }
            }
            
            // Resolve doctor details
            let doctorDetails = null;
            const doctorId = rawFeedback.doctorId || rawFeedback.providerId;
            if (doctorId && doctors[doctorId]) {
              doctorDetails = doctors[doctorId];
            }
            
            // Resolve clinic details
            let clinicDetails = null;
            const clinicId = rawFeedback.clinicId;
            if (clinicId && clinics[clinicId]) {
              clinicDetails = clinics[clinicId];
            }
            
            // Resolve user details for patient and doctor
            let patientUserDetails = null;
            let doctorUserDetails = null;
            
            if (patientDetails?.userId && users[patientDetails.userId]) {
              patientUserDetails = users[patientDetails.userId];
            }
            
            if (doctorDetails?.userId && users[doctorDetails.userId]) {
              doctorUserDetails = users[doctorDetails.userId];
            }
            
            // Transform the data to match UI expectations
            const transformedFeedback = {
              id,
              // Patient info - resolved from patients and users nodes
              patientId: patientId,
              patientName: rawFeedback.patientName || 
                (patientUserDetails ? `${patientUserDetails.firstName} ${patientUserDetails.lastName}` : 'Unknown Patient'),
              patientEmail: rawFeedback.patientEmail || 
                (patientUserDetails ? patientUserDetails.email : ''),
              patientFirstName: patientUserDetails?.firstName || patientDetails?.firstName || '',
              patientLastName: patientUserDetails?.lastName || patientDetails?.lastName || '',
              
              // Doctor/Provider info - resolved from doctors and users nodes
              providerId: doctorId,
              doctorId: doctorId,
              doctorName: rawFeedback.doctorName || 
                (doctorUserDetails ? `Dr. ${doctorUserDetails.firstName} ${doctorUserDetails.lastName}` : 'Unknown Doctor'),
              doctorFirstName: doctorUserDetails?.firstName || doctorDetails?.firstName || '',
              doctorLastName: doctorUserDetails?.lastName || doctorDetails?.lastName || '',
              
              // Clinic info - resolved from clinics node
              clinicId: clinicId,
              clinicName: rawFeedback.clinicName || 
                (clinicDetails ? clinicDetails.name : 'Unknown Clinic'),
              practiceLocationName: rawFeedback.practiceLocationName || 
                (clinicDetails ? clinicDetails.name : ''),
              
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
              isAnonymous: rawFeedback.isAnonymous || false,
              
              // UI-specific fields
              status: rawFeedback.status || 'pending',
              date: rawFeedback.timestamp || rawFeedback.appointmentDate,
              createdAt: rawFeedback.createdAt || rawFeedback.timestamp,
              
              // Tags for UI display
              tags: rawFeedback.tags || [
                rawFeedback.sentiment === 'positive' ? 'Positive' : 
                rawFeedback.sentiment === 'negative' ? 'Negative' : 'Neutral',
                rawFeedback.rating >= 4 ? 'High Rating' : 
                rawFeedback.rating >= 3 ? 'Average Rating' : 'Low Rating'
              ].filter(Boolean),
              
              // Raw data for debugging
              _rawFeedback: rawFeedback,
              _patientDetails: patientDetails,
              _doctorDetails: doctorDetails,
              _clinicDetails: clinicDetails
            };
            
            feedback.push(transformedFeedback);
          });
        }
        callback(feedback);
      } catch (error) {
        console.error('Error in feedback subscription:', error);
        callback([]);
      }
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
      const [appointmentsSnapshot, patientsSnapshot, doctorsSnapshot, clinicsSnapshot, usersSnapshot] = await Promise.all([
        get(ref(db, 'appointments')),
        get(ref(db, 'patients')),
        get(ref(db, 'doctors')),
        get(ref(db, 'clinics')),
        get(ref(db, 'users'))
      ]);
      
      if (!appointmentsSnapshot.exists()) return [];
      
      const appointments = appointmentsSnapshot.val();
      const patients = patientsSnapshot.exists() ? patientsSnapshot.val() : {};
      const doctors = doctorsSnapshot.exists() ? doctorsSnapshot.val() : {};
      const clinics = clinicsSnapshot.exists() ? clinicsSnapshot.val() : {};
      const users = usersSnapshot.exists() ? usersSnapshot.val() : {};
      
      // Create lookup maps for quick access
      const patientNameMap: { [key: string]: { firstName: string; lastName: string } } = {};
      const doctorNameMap: { [key: string]: { firstName: string; lastName: string } } = {};
      const clinicNameMap: { [key: string]: string } = {};
      const userNameMap: { [key: string]: { firstName: string; lastName: string } } = {};
      
      // Build patient name map
      Object.keys(patients).forEach(patientId => {
        const patient = patients[patientId];
        if (patient && (patient.firstName || patient.lastName)) {
          patientNameMap[patientId] = {
            firstName: patient.firstName || 'Unknown',
            lastName: patient.lastName || 'Patient'
          };
        } else {
          console.warn(`Patient ${patientId} has missing or invalid data:`, patient);
        }
      });
      
      // Build doctor name map
      Object.keys(doctors).forEach(doctorId => {
        const doctor = doctors[doctorId];
        if (doctor && (doctor.firstName || doctor.lastName)) {
          doctorNameMap[doctorId] = {
            firstName: doctor.firstName || 'Unknown',
            lastName: doctor.lastName || 'Doctor'
          };
        } else {
          console.warn(`Doctor ${doctorId} has missing or invalid data:`, doctor);
        }
      });
      
      // Build clinic name map
      Object.keys(clinics).forEach(clinicId => {
        clinicNameMap[clinicId] = clinics[clinicId].name || 'Unknown Clinic';
      });
      
      // Build user name map
      Object.keys(users).forEach(userId => {
        const user = users[userId];
        if (user && (user.firstName || user.lastName)) {
          userNameMap[userId] = {
            firstName: user.firstName || 'Unknown',
            lastName: user.lastName || 'User'
          };
        } else {
          console.warn(`User ${userId} has missing or invalid data:`, user);
        }
      });
      
      return Object.keys(appointments).map(id => {
        const appointment = appointments[id];
        const patientId = appointment.patientId;
        const doctorId = appointment.doctorId;
        const clinicId = appointment.clinicId;
        const bookedByUserId = appointment.bookedByUserId;
        
        // Log missing references for debugging
        if (patientId && !patientNameMap[patientId]) {
          console.warn(`Appointment ${id} references missing patient ${patientId}`);
        }
        if (doctorId && !doctorNameMap[doctorId]) {
          console.warn(`Appointment ${id} references missing doctor ${doctorId}`);
        }
        if (clinicId && !clinicNameMap[clinicId]) {
          console.warn(`Appointment ${id} references missing clinic ${clinicId}`);
        }
        if (bookedByUserId && !userNameMap[bookedByUserId]) {
          console.warn(`Appointment ${id} references missing user ${bookedByUserId}`);
        }
        
        // Resolve names from respective nodes with fallback handling
        const patientNames = patientId && patientNameMap[patientId] ? patientNameMap[patientId] : { firstName: appointment.patientFirstName || 'Unknown', lastName: appointment.patientLastName || 'Patient' };
        const doctorNames = doctorId && doctorNameMap[doctorId] ? doctorNameMap[doctorId] : { firstName: appointment.doctorFirstName || 'Unknown', lastName: appointment.doctorLastName || 'Doctor' };
        const clinicName = clinicId && clinicNameMap[clinicId] ? clinicNameMap[clinicId] : appointment.clinicName || 'Unknown Clinic';
        const userNames = bookedByUserId && userNameMap[bookedByUserId] ? userNameMap[bookedByUserId] : { firstName: appointment.bookedByUserFirstName || 'Unknown', lastName: appointment.bookedByUserLastName || 'User' };
        
        return {
          id,
          ...appointment,
          // Override with resolved names
          patientFirstName: patientNames.firstName,
          patientLastName: patientNames.lastName,
          doctorFirstName: doctorNames.firstName,
          doctorLastName: doctorNames.lastName,
          clinicName: clinicName,
          bookedByUserFirstName: userNames.firstName,
          bookedByUserLastName: userNames.lastName
        };
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  /**
   * Get a single patient by ID with user data
   */
  async getPatientById(patientId: string): Promise<Patient | null> {
    try {
      // Fetch both specific patient and users data
      const [patientSnapshot, usersSnapshot] = await Promise.all([
        get(ref(db, `patients/${patientId}`)),
        get(ref(db, 'users'))
      ]);
      
      if (!patientSnapshot.exists()) return null;
      
      const patient = patientSnapshot.val();
      const users = usersSnapshot.exists() ? usersSnapshot.val() : {};
      
      // Try multiple ways to find the user data
      let userId = patient.userId;
      let user = users[userId] || {};
      
      // If no user found with patient.userId, try using patientId as userId
      if (!user.email && !user.firstName) {
        userId = patientId;
        user = users[userId] || {};
      }
      
      // If still no user found, try to find by email in users
      if (!user.email && patient.email) {
        const userByEmail = Object.values(users).find((u: any) => u.email === patient.email);
        if (userByEmail) {
          user = userByEmail;
          userId = Object.keys(users).find(key => users[key] === userByEmail) || userId;
        }
      }
      
      // Resolve addresses using the utility function
      const resolvedAddress = resolveAddress(patient);
      const resolvedFullAddress = resolveFullAddress(patient);
      const streetAddress = getStreetAddress(patient);
      const locationDetails = getLocationDetails(patient);
      const addressComponents = getAddressComponents(patient);
      
             return {
         id: patientId,
         userId: userId,
         // User data
         firstName: user.firstName || patient.firstName || '',
         middleName: user.middleName || patient.middleName || '',
         lastName: user.lastName || patient.lastName || '',
         email: user.email || patient.email || '',
         // Handle both profileImage and profileImageUrl fields
         profileImageUrl: user.profileImageUrl || user.profileImage || patient.profileImageUrl || patient.profileImage || '',
         // Patient data
         ...patient,
         // Resolved address data
         resolvedAddress,
         resolvedFullAddress,
         streetAddress,
         locationDetails,
         addressComponents
       };
    } catch (error) {
      console.error('Error fetching patient by ID:', error);
      throw error;
    }
  }

  /**
   * Debug method to check user data availability
   */
  async debugUserData(): Promise<{ patients: any[], users: any[], missingEmails: string[] }> {
    try {
      const [patientsSnapshot, usersSnapshot] = await Promise.all([
        get(ref(db, 'patients')),
        get(ref(db, 'users'))
      ]);
      
      const patients = patientsSnapshot.exists() ? patientsSnapshot.val() : {};
      const users = usersSnapshot.exists() ? usersSnapshot.val() : {};
      
      const missingEmails: string[] = [];
      
      Object.keys(patients).forEach(patientId => {
        const patient = patients[patientId];
        const userId = patient.userId;
        const user = users[userId] || {};
        
        if (!user.email && patient.email) {
          missingEmails.push(`Patient ${patientId}: userId=${userId}, email=${patient.email}`);
        }
      });
      
      return {
        patients: Object.keys(patients).map(id => ({ id, ...patients[id] })),
        users: Object.keys(users).map(id => ({ id, ...users[id] })),
        missingEmails
      };
    } catch (error) {
      console.error('Error debugging user data:', error);
      throw error;
    }
  }

  /**
   * Get all patients from your database with user data
   */
  async getPatients(): Promise<Patient[]> {
    try {
      // Fetch both patients and users data
      const [patientsSnapshot, usersSnapshot] = await Promise.all([
        get(ref(db, 'patients')),
        get(ref(db, 'users'))
      ]);
      
      if (!patientsSnapshot.exists()) return [];
      
      const patients = patientsSnapshot.val();
      const users = usersSnapshot.exists() ? usersSnapshot.val() : {};
      
      return Object.keys(patients).map(patientId => {
        const patient = patients[patientId];
        
        // Try multiple ways to find the user data
        let userId = patient.userId;
        let user = users[userId] || {};
        
        // If no user found with patient.userId, try using patientId as userId
        if (!user.email && !user.firstName) {
          userId = patientId;
          user = users[userId] || {};
        }
        
        // If still no user found, try to find by email in users
        if (!user.email && patient.email) {
          const userByEmail = Object.values(users).find((u: any) => u.email === patient.email);
          if (userByEmail) {
            user = userByEmail;
            userId = Object.keys(users).find(key => users[key] === userByEmail) || userId;
          }
        }
        
        // Log warning if no user data found
        if (!user.email && !user.firstName) {
          console.warn(`No user data found for patient ${patientId}. Patient userId: ${patient.userId}, Patient email: ${patient.email}`);
        }
        
        // Resolve addresses using the utility function
        const resolvedAddress = resolveAddress(patient);
        const resolvedFullAddress = resolveFullAddress(patient);
        const streetAddress = getStreetAddress(patient);
        const locationDetails = getLocationDetails(patient);
        const addressComponents = getAddressComponents(patient);
        
                 return {
           id: patientId,
           userId: userId,
           // User data (prioritize user data over patient data)
           firstName: user.firstName || patient.firstName || '',
           middleName: user.middleName || patient.middleName || '',
           lastName: user.lastName || patient.lastName || '',
           email: user.email || patient.email || '',
           // Handle both profileImage and profileImageUrl fields
           profileImageUrl: user.profileImageUrl || user.profileImage || patient.profileImageUrl || patient.profileImage || '',
           // Patient data
           ...patient,
           // Resolved address data
           resolvedAddress,
           resolvedFullAddress,
           streetAddress,
           locationDetails,
           addressComponents
         };
      });
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
      const [referralsSnapshot, clinicsSnapshot] = await Promise.all([
        get(ref(db, 'referrals')),
        get(ref(db, 'clinics'))
      ]);
      
      if (!referralsSnapshot.exists()) return [];
      
      const referrals = referralsSnapshot.val();
      const clinics = clinicsSnapshot.exists() ? clinicsSnapshot.val() : {};
      
      // Create a map of clinic IDs to clinic names for quick lookup
      const clinicNameMap: { [key: string]: string } = {};
      Object.keys(clinics).forEach(clinicId => {
        clinicNameMap[clinicId] = clinics[clinicId].name || 'Unknown Clinic';
      });
      
      return Object.keys(referrals).map(id => {
        const referral = referrals[id];
        const specialistClinicId = referral.practiceLocation?.clinicId;
        const referringClinicId = referral.referringClinicId;
        
        const specialistClinicName = specialistClinicId ? clinicNameMap[specialistClinicId] || 'Unknown Clinic' : 'Unknown Clinic';
        const referringClinicName = referringClinicId ? clinicNameMap[referringClinicId] || referral.referringClinicName || 'Unknown Clinic' : referral.referringClinicName || 'Unknown Clinic';
        
        return {
          id,
          ...referral,
          specialistClinicName,
          referringClinicName
        };
      });
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

      // Calculate consultation time statistics
      const consultationTimeStats = calculateAverageConsultationTime(appointments, referrals);

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
        totalReferrals: referrals.length,
        consultationTimeStats
      };
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get consultation time statistics
   */
  async getConsultationTimeStats() {
    try {
      const [appointments, referrals] = await Promise.all([
        this.getAppointments(),
        this.getReferrals()
      ]);

      return calculateAverageConsultationTime(appointments, referrals);
    } catch (error) {
      console.error('Error calculating consultation time stats:', error);
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
          .sort((a, b) => {
            const aTime = safeGetTimestamp(a.timestamp);
            const bTime = safeGetTimestamp(b.timestamp);
            return bTime - aTime;
          })
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
        .sort((a, b) => {
          const aTime = safeGetTimestamp(a.timestamp);
          const bTime = safeGetTimestamp(b.timestamp);
          return bTime - aTime;
        })
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
      
      // 3. Create user entry (only immutable fields)
      const userData = {
        createdAt: timestamp,
        email: patientData.email,
        firstName: patientData.firstName,
        middleName: patientData.middleName || '',
        lastName: patientData.lastName,
        patientId: patientId,
        role: 'patient'
      };

      // 4. Create patient entry (detailed information)
      const patientEntry = {
        contactNumber: patientData.phone,
        highestEducationalAttainment: patientData.educationalAttainment || '',
        createdAt: timestamp,
        dateOfBirth: patientData.dateOfBirth,
        emergencyContact: patientData.emergencyContact,
        firstName: patientData.firstName,
        gender: patientData.gender,
        middleName: patientData.middleName || '',
        lastName: patientData.lastName,
        address: patientData.address || '',
        bloodType: patientData.bloodType || '',
        allergies: patientData.allergies || [],
        lastUpdated: timestamp,
        userId: patientId
      };

      // 5. Save to Firebase
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
      await update(patientRef, {
        ...patientData,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  /**
   * Update doctor information in both users and doctors nodes
   */
  async updateDoctor(doctorId: string, doctorData: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      
      // Get current doctor data to preserve existing fields
      const [doctorSnapshot, userSnapshot] = await Promise.all([
        get(ref(db, `doctors/${doctorId}`)),
        get(ref(db, `users/${doctorId}`))
      ]);

      if (!doctorSnapshot.exists()) {
        throw new Error('Doctor not found');
      }

      const currentDoctor = doctorSnapshot.val();
      const currentUser = userSnapshot.exists() ? userSnapshot.val() : {};

      // Prepare updates for doctors node
      const doctorUpdates = {
        ...currentDoctor,
        ...doctorData,
        lastUpdated: timestamp
      };

      // Prepare updates for users node (only specific fields)
      const userUpdates = {
        ...currentUser,
        firstName: doctorData.firstName || currentUser.firstName,
        middleName: doctorData.middleName || currentUser.middleName,
        lastName: doctorData.lastName || currentUser.lastName,
        email: doctorData.email || currentUser.email
      };

      // Update both nodes
      await Promise.all([
        set(ref(db, `doctors/${doctorId}`), doctorUpdates),
        set(ref(db, `users/${doctorId}`), userUpdates)
      ]);

      console.log('Doctor updated successfully:', doctorId);
    } catch (error) {
      console.error('Error updating doctor:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const realDataService = new RealDataService();