import { ref, set, push } from 'firebase/database';
import { db } from '@/lib/firebase/config';

// Sample data
const sampleClinics = [
  {
    name: "Cebu Medical Center",
    address: "123 Colon Street",
    city: "Cebu City",
    province: "Cebu",
    zipCode: "6000",
    phone: "+63 32 123 4567",
    email: "info@cebumedical.com",
    type: "hospital" as const,
    isActive: true
  },
  {
    name: "Metro Cebu Hospital",
    address: "456 Lahug Avenue",
    city: "Cebu City", 
    province: "Cebu",
    zipCode: "6000",
    phone: "+63 32 234 5678",
    email: "contact@metrocebu.com",
    type: "hospital" as const,
    isActive: true
  },
  {
    name: "Skin Care Clinic",
    address: "789 IT Park",
    city: "Cebu City",
    province: "Cebu", 
    zipCode: "6000",
    phone: "+63 32 345 6789",
    email: "info@skincareclinic.com",
    type: "private_clinic" as const,
    isActive: true
  }
];

const sampleDoctors = [
  {
    firstName: "Maria",
    lastName: "Santos",
    middleName: "Cruz",
    email: "maria.santos@email.com",
    phone: "+63 917 123 4567",
    dateOfBirth: "1985-03-15",
    gender: "female" as const,
    civilStatus: "married" as const,
    prcId: "PRC-123456",
    prcExpiry: "2025-12-31",
    specialty: "Cardiology",
    subSpecialty: "Interventional Cardiology",
    yearsOfExperience: 10,
    status: "verified" as const,
    isActive: true,
    bio: "Experienced cardiologist specializing in interventional procedures."
  },
  {
    firstName: "Juan",
    lastName: "Dela Cruz", 
    email: "juan.delacruz@email.com",
    phone: "+63 917 234 5678",
    dateOfBirth: "1980-07-22",
    gender: "male" as const,
    civilStatus: "single" as const,
    prcId: "PRC-234567",
    prcExpiry: "2024-06-30",
    specialty: "Pediatrics",
    yearsOfExperience: 8,
    status: "pending" as const,
    isActive: true,
    bio: "Dedicated pediatrician with focus on child development."
  },
  {
    firstName: "Ana",
    lastName: "Rodriguez",
    email: "ana.rodriguez@email.com", 
    phone: "+63 917 345 6789",
    dateOfBirth: "1988-11-10",
    gender: "female" as const,
    civilStatus: "married" as const,
    prcId: "PRC-345678",
    prcExpiry: "2025-09-15",
    specialty: "Dermatology",
    yearsOfExperience: 6,
    status: "verified" as const,
    isActive: true,
    bio: "Dermatologist specializing in cosmetic and medical dermatology."
  }
];

const sampleFeedback = [
  {
    patientName: "Juan Carlos",
    patientEmail: "juan.carlos@email.com",
    doctorId: "", // Will be set after creating doctors
    clinicId: "", // Will be set after creating clinics
    rating: 5 as const,
    comment: "Excellent service! Dr. Santos was very thorough and explained everything clearly. The clinic staff was also very accommodating.",
    tags: ["professional", "thorough", "excellent"],
    status: "reviewed" as const,
    appointmentDate: "2024-01-20",
    treatmentType: "Consultation",
    isAnonymous: false
  },
  {
    patientName: "Maria Lopez",
    patientEmail: "maria.lopez@email.com", 
    doctorId: "",
    clinicId: "",
    rating: 4 as const,
    comment: "Good doctor, my child felt comfortable during the consultation. However, the waiting time was quite long.",
    tags: ["good", "comfortable", "long wait"],
    status: "pending" as const,
    appointmentDate: "2024-01-19",
    treatmentType: "Pediatric Checkup",
    isAnonymous: false
  },
  {
    patientName: "Robert Chen",
    patientEmail: "robert.chen@email.com",
    doctorId: "",
    clinicId: "",
    rating: 5 as const,
    comment: "Amazing results! Dr. Rodriguez solved my skin problem that I've had for years. Highly recommend!",
    tags: ["amazing", "effective", "recommended"],
    status: "reviewed" as const,
    appointmentDate: "2024-01-18", 
    treatmentType: "Dermatology Treatment",
    isAnonymous: false
  }
];

const sampleActivityLogs = [
  {
    userId: "admin-1",
    userEmail: "admin@unihealth.com",
    action: "Doctor verified",
    category: "verification" as const,
    targetType: "doctor" as const,
    details: {
      doctorName: "Dr. Maria Santos",
      specialty: "Cardiology"
    }
  },
  {
    userId: "admin-1", 
    userEmail: "admin@unihealth.com",
    action: "New feedback received",
    category: "feedback" as const,
    targetType: "feedback" as const,
    details: {
      patientName: "Juan Carlos",
      rating: 5
    }
  },
  {
    userId: "admin-1",
    userEmail: "admin@unihealth.com", 
    action: "Doctor profile updated",
    category: "profile" as const,
    targetType: "doctor" as const,
    details: {
      doctorName: "Dr. Ana Rodriguez",
      changes: ["bio", "specialty"]
    }
  }
];

async function seedData() {
  try {
    console.log("🌱 Starting data seeding...");

    // Seed clinics first
    console.log("📍 Seeding clinics...");
    const clinicIds: string[] = [];
    for (const clinic of sampleClinics) {
      const clinicRef = push(ref(db, 'clinics'));
      const clinicData = {
        ...clinic,
        id: clinicRef.key,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await set(clinicRef, clinicData);
      clinicIds.push(clinicRef.key!);
      console.log(`✅ Created clinic: ${clinic.name}`);
    }

    // Seed doctors
    console.log("👨‍⚕️ Seeding doctors...");
    const doctorIds: string[] = [];
    for (const doctor of sampleDoctors) {
      const doctorRef = push(ref(db, 'doctors'));
      const doctorData = {
        ...doctor,
        id: doctorRef.key,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await set(doctorRef, doctorData);
      doctorIds.push(doctorRef.key!);
      console.log(`✅ Created doctor: Dr. ${doctor.firstName} ${doctor.lastName}`);
    }

    // Seed feedback with proper doctor and clinic IDs
    console.log("💬 Seeding feedback...");
    for (let i = 0; i < sampleFeedback.length; i++) {
      const feedback = sampleFeedback[i];
      const feedbackRef = push(ref(db, 'feedback'));
      const feedbackData = {
        ...feedback,
        id: feedbackRef.key,
        doctorId: doctorIds[i % doctorIds.length],
        clinicId: clinicIds[i % clinicIds.length],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await set(feedbackRef, feedbackData);
      console.log(`✅ Created feedback for ${feedback.patientName}`);
    }

    // Seed activity logs with proper target IDs
    console.log("📊 Seeding activity logs...");
    for (let i = 0; i < sampleActivityLogs.length; i++) {
      const log = sampleActivityLogs[i];
      const logRef = push(ref(db, 'activity-logs'));
      const logData = {
        ...log,
        id: logRef.key,
        targetId: log.targetType === 'doctor' ? doctorIds[i % doctorIds.length] : 
                  log.targetType === 'feedback' ? 'feedback-id' : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await set(logRef, logData);
      console.log(`✅ Created activity log: ${log.action}`);
    }

    // Seed sample schedules
    console.log("📅 Seeding schedules...");
    for (let i = 0; i < doctorIds.length; i++) {
      const scheduleRef = push(ref(db, 'schedules'));
      const scheduleData = {
        id: scheduleRef.key,
        doctorId: doctorIds[i],
        clinicId: clinicIds[i % clinicIds.length],
        dayOfWeek: (i % 5) + 1, // Monday to Friday
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
        notes: "Regular consultation hours",
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await set(scheduleRef, scheduleData);
      console.log(`✅ Created schedule for doctor ${i + 1}`);
    }

    console.log("🎉 Data seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - ${sampleClinics.length} clinics`);
    console.log(`   - ${sampleDoctors.length} doctors`);
    console.log(`   - ${sampleFeedback.length} feedback entries`);
    console.log(`   - ${sampleActivityLogs.length} activity logs`);
    console.log(`   - ${doctorIds.length} schedules`);

  } catch (error) {
    console.error("❌ Error seeding data:", error);
  }
}

// Run the seeding function
if (require.main === module) {
  seedData().then(() => {
    console.log("✅ Seeding script completed");
    process.exit(0);
  }).catch((error) => {
    console.error("❌ Seeding script failed:", error);
    process.exit(1);
  });
}

export { seedData };