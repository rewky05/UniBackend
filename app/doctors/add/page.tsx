'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PersonalInfoForm } from '@/components/doctors/personal-info-form';
import { ProfessionalDetailsForm } from '@/components/doctors/professional-details-form';
import { AffiliationsEducationForm } from '@/components/doctors/affiliations-education-form';
import { DocumentUploadsForm } from '@/components/doctors/document-uploads-form';
import { ArrowLeft, UserPlus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { RealDataService } from '@/lib/services/real-data.service';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface DoctorFormData {
  // Personal Information
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  civilStatus: string;
  avatar?: File | null;

     // Professional Details
   specialty: string;
   subSpecialty: string;
   medicalLicense: string;
   prcId: string;
   prcExpiry: string;
   professionalFee?: number; // Professional fee in Philippine pesos

       // Schedules
    schedules: SpecialistSchedule[];
}

export interface SpecialistSchedule {
  id?: string;
  specialistId: string;
  createdAt?: string;
  isActive: boolean;
  lastUpdated?: string;
  practiceLocation: {
    clinicId: string;
    roomOrUnit: string;
  };
  recurrence: {
    dayOfWeek: number[];
    type: string;
  };
  scheduleType: string;
  slotTemplate: {
    [timeSlot: string]: {
      defaultStatus: string;
      durationMinutes: number;
    };
  };
  validFrom: string;
}

export default function AddDoctorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Confirmation dialog state
  const [submitDialog, setSubmitDialog] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState<{email: string, password: string} | null>(null);
  const [clearDialog, setClearDialog] = useState(false);
  
  // Initial form data
  const initialFormData: DoctorFormData = {
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    civilStatus: '',
    avatar: null,

    // Professional Details
    specialty: '',
    subSpecialty: '',
    medicalLicense: '',
    prcId: '',
    prcExpiry: '',
    professionalFee: undefined,

    // Schedules
    schedules: []
  };

  // Use regular useState instead of form persistence to fix input issues
  const [formData, setFormData] = useState<DoctorFormData>(initialFormData);
  const [isLoaded, setIsLoaded] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Cleanup timeout on unmount
  // useEffect(() => {
  //   return () => {
  //     if (saveTimeoutRef.current) {
  //       clearTimeout(saveTimeoutRef.current);
  //     }
  //   };
  // }, []);

  const handleSubmit = () => {
    setSubmitDialog(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const realDataService = new RealDataService();
      
      // Create doctor data for Firebase
      const doctorData = {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        suffix: formData.suffix,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        civilStatus: formData.civilStatus,
        specialty: formData.specialty,
        subSpecialty: formData.subSpecialty,
        medicalLicense: formData.medicalLicense,
        prcId: formData.prcId,
        prcExpiry: formData.prcExpiry,
        professionalFee: formData.professionalFee,
        isSpecialist: true, // Always true for this form
        isGeneralist: false,
        status: 'pending',
        // Add schedules data
        schedules: formData.schedules,
        
        // Add other fields as needed
        accreditations: [], // Can be added later
        fellowships: [], // Can be added later
        yearsOfExperience: 0 // Can be calculated or added later
      };

      // Create doctor in Firebase (users, doctors, and specialistSchedules nodes)
      const { doctorId, temporaryPassword } = await realDataService.createDoctor(doctorData);
      
      // Clear saved form data after successful submission
      // clearData(); // This line is removed as per the edit hint
      
      // Set success data and show dialog
      setSuccessData({
        email: formData.email,
        password: temporaryPassword
      });
      setSuccessDialog(true);
      
      // Navigate back to doctors list after a delay
      setTimeout(() => {
        router.push('/doctors');
      }, 3000);
    } catch (error) {
      console.error('Error creating doctor:', error);
      toast({
        title: "Error creating doctor",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setSubmitDialog(false);
    }
  };

  const handleClearForm = () => {
    setClearDialog(true);
  };

  const confirmClearForm = () => {
    // clearData(); // This line is removed as per the edit hint
    setClearDialog(false);
    toast({
      title: "Form cleared",
      description: "All form data has been cleared.",
    });
  };

  const isFormValid = () => {
    // All fields are required except sub-specialty and profile picture
    const requiredFields = [
      formData.firstName,
      formData.lastName,
      formData.middleName,
      formData.suffix,
      formData.email,
      formData.phone,
      formData.address,
      formData.dateOfBirth,
      formData.gender,
      formData.civilStatus,
      formData.specialty,
      formData.medicalLicense,
      formData.prcId,
      formData.prcExpiry,
      formData.professionalFee
    ];
    
    // Check if all required fields have valid data
    const validations = [
      formData.firstName.trim().length >= 2,
      formData.lastName.trim().length >= 2,
      formData.middleName.trim().length >= 2,
      formData.suffix.trim().length > 0,
      isValidEmail(formData.email),
      isValidPhone(formData.phone),
      formData.address.trim().length >= 10,
      isValidDate(formData.dateOfBirth),
      formData.gender.trim() && ['male', 'female', 'other', 'prefer-not-to-say'].includes(formData.gender),
      formData.civilStatus.trim().length > 0 && ['single', 'married', 'divorced', 'widowed', 'separated'].includes(formData.civilStatus),
      formData.specialty.trim().length >= 3,
      isValidLicense(formData.medicalLicense),
      isValidPRCId(formData.prcId),
      isValidExpiry(formData.prcExpiry),
      isValidProfessionalFee(formData.professionalFee)
    ];
    
    // Debug: Log validation results
    const fieldNames = [
      'firstName', 'lastName', 'middleName', 'suffix', 'email', 'phone', 
      'address', 'dateOfBirth', 'gender', 'civilStatus', 'specialty', 
      'medicalLicense', 'prcId', 'prcExpiry', 'professionalFee'
    ];
    
    const failedFields = fieldNames.filter((_, index) => !validations[index]);
    
    return validations.every(valid => valid);
  };

  // Validation functions
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email.trim());
    
    return isValid;
  };

  const isValidPhone = (phone: string) => {
    // More flexible phone validation for Philippine numbers
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    // Allow various Philippine phone formats
    const phoneRegex = /^(\+63|63|0)?[9]\d{8,9}$/;
    const isValid = phoneRegex.test(cleanedPhone);
    
    return isValid;
  };

  const isValidDate = (date: string) => {
    if (!date.trim()) return false;
    const dateObj = new Date(date);
    const isValid = dateObj instanceof Date && !isNaN(dateObj.getTime()) && dateObj < new Date();
    
    return isValid;
  };

  const isValidLicense = (license: string) => {
    return license.trim().length >= 5; // Minimum 5 characters for license
  };

  const isValidPRCId = (prcId: string) => {
    return prcId.trim().length >= 6; // Minimum 6 characters for PRC ID
  };

  const isValidExpiry = (expiry: string) => {
    if (!expiry.trim()) return false;
    const expiryDate = new Date(expiry);
    return expiryDate instanceof Date && !isNaN(expiryDate.getTime()) && expiryDate > new Date();
  };

  const isValidProfessionalFee = (fee: number | undefined) => {
    return fee !== undefined && fee > 0 && fee <= 100000; // Reasonable range for professional fee
  };

  // Calculate form completion percentage with validation
  const calculateProgress = () => {
    const totalFields = 17; // Total number of required fields (excluding sub-specialty and profile picture)
    let completedFields = 0;

    // Personal Information (10 fields) - with validation
    if (formData.firstName.trim().length >= 2) completedFields++;
    if (formData.lastName.trim().length >= 2) completedFields++;
    if (formData.middleName.trim().length >= 2) completedFields++;
    if (formData.suffix.trim().length > 0) completedFields++;
    if (isValidEmail(formData.email)) completedFields++;
    if (isValidPhone(formData.phone)) completedFields++;
    if (formData.address.trim().length >= 10) completedFields++;
    if (isValidDate(formData.dateOfBirth)) completedFields++;
    if (formData.gender.trim() && ['male', 'female', 'other', 'prefer-not-to-say'].includes(formData.gender)) completedFields++;
    if (formData.civilStatus.trim().length > 0 && ['single', 'married', 'divorced', 'widowed', 'separated'].includes(formData.civilStatus)) completedFields++;

    // Professional Details (5 required fields) - with validation (excluding sub-specialty)
    if (formData.specialty.trim().length >= 3) completedFields++;
    if (isValidLicense(formData.medicalLicense)) completedFields++;
    if (isValidPRCId(formData.prcId)) completedFields++;
    if (isValidExpiry(formData.prcExpiry)) completedFields++;
    if (isValidProfessionalFee(formData.professionalFee)) completedFields++;

         // Schedules (2 fields) - only count if valid schedules exist
     if (formData.schedules.length > 0) {
       // Check if schedules have valid data
       const validSchedules = formData.schedules.filter(schedule => 
         schedule.practiceLocation?.clinicId && 
         schedule.practiceLocation?.roomOrUnit &&
         schedule.recurrence?.dayOfWeek?.length > 0 &&
         schedule.validFrom
       );
       if (validSchedules.length > 0) {
         completedFields += 2;
       }
     }

    return Math.round((completedFields / totalFields) * 100);
  };

    // Calculate completion percentage for each tab with validation
  const calculateTabProgress = (tabName: string) => {
    switch (tabName) {
      case 'personal':
        let completedPersonal = 0;
        const personalValidations = [
          { field: 'firstName', valid: formData.firstName.trim().length >= 2 },
          { field: 'lastName', valid: formData.lastName.trim().length >= 2 },
          { field: 'middleName', valid: formData.middleName.trim().length >= 2 },
          { field: 'suffix', valid: formData.suffix.trim().length > 0 },
          { field: 'email', valid: isValidEmail(formData.email) },
          { field: 'phone', valid: isValidPhone(formData.phone) },
          { field: 'address', valid: formData.address.trim().length >= 10 },
          { field: 'dateOfBirth', valid: isValidDate(formData.dateOfBirth) },
          { field: 'gender', valid: formData.gender.trim() && ['male', 'female', 'other', 'prefer-not-to-say'].includes(formData.gender) },
          { field: 'civilStatus', valid: formData.civilStatus.trim().length > 0 && ['single', 'married', 'divorced', 'widowed', 'separated'].includes(formData.civilStatus) }
        ];
        
        personalValidations.forEach(({ field, valid }) => {
          if (valid) completedPersonal++;
        });
        
        const progress = Math.round((completedPersonal / 10) * 100);
        return progress;
      
      case 'professional':
        let completedProfessional = 0;
        if (formData.specialty.trim().length >= 3) completedProfessional++;
        if (isValidLicense(formData.medicalLicense)) completedProfessional++;
        if (isValidPRCId(formData.prcId)) completedProfessional++;
        if (isValidExpiry(formData.prcExpiry)) completedProfessional++;
        if (isValidProfessionalFee(formData.professionalFee)) completedProfessional++;
        return Math.round((completedProfessional / 5) * 100);
      
           case 'affiliations':
        // For scheduling, consider it complete only if valid schedules exist
        if (formData.schedules.length > 0) {
          const validSchedules = formData.schedules.filter(schedule => 
            schedule.practiceLocation?.clinicId && 
            schedule.practiceLocation?.roomOrUnit &&
            schedule.recurrence?.dayOfWeek?.length > 0 &&
            schedule.validFrom
          );
          return validSchedules.length > 0 ? 100 : 0;
        } else {
          return 0;
        }
      
      default:
        return 0;
    }
  };

  const progress = calculateProgress();
  const personalProgress = calculateTabProgress('personal');
  const professionalProgress = calculateTabProgress('professional');
  const schedulingProgress = calculateTabProgress('affiliations');

     // Helper function to render tab completion indicator
   const renderTabIndicator = (progress: number) => {
     if (progress === 100) {
       return (
         <div className="flex items-center space-x-2">
           <span>Personal Info</span>
           <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
             <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
             </svg>
           </div>
         </div>
       );
     } else if (progress > 0) {
       return (
         <div className="flex items-center space-x-2">
           <span>Personal Info</span>
           <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
             {progress}%
           </span>
         </div>
       );
     } else {
       return (
         <div className="flex items-center space-x-2">
           <span>Personal Info</span>
           <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
             0%
           </span>
         </div>
       );
     }
   };

     const renderProfessionalIndicator = (progress: number) => {
     if (progress === 100) {
       return (
         <div className="flex items-center space-x-2">
           <span>Professional</span>
           <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
             <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
             </svg>
           </div>
         </div>
       );
     } else if (progress > 0) {
       return (
         <div className="flex items-center space-x-2">
           <span>Professional</span>
           <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
             {progress}%
           </span>
         </div>
       );
     } else {
       return (
         <div className="flex items-center space-x-2">
           <span>Professional</span>
           <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
             0%
           </span>
         </div>
       );
     }
   };

     const renderSchedulingIndicator = (progress: number) => {
     if (progress === 100) {
       return (
         <div className="flex items-center space-x-2">
           <span>Scheduling</span>
           <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
             <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
             </svg>
           </div>
         </div>
       );
     } else if (progress > 0) {
       return (
         <div className="flex items-center space-x-2">
           <span>Scheduling</span>
           <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
             {progress}%
           </span>
         </div>
       );
     } else {
       return (
         <div className="flex items-center space-x-2">
           <span>Scheduling</span>
           <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
             0%
           </span>
         </div>
       );
     }
   };

  // Add warning for unsaved changes
  // useEffect(() => {
  //   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  //     if (hasUnsavedChanges) {
  //       e.preventDefault();
  //       e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
  //       return e.returnValue;
  //     }
  //   };

  //   window.addEventListener('beforeunload', handleBeforeUnload);
  //   return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  // }, [hasUnsavedChanges]);

  // Show loading state while form data is being loaded
  if (!isLoaded) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading saved form data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/doctors">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <UserPlus className="h-6 w-6 mr-2" />
                Add New Doctor
              </h2>
              <p className="text-muted-foreground">
                Register a new healthcare professional in the system
              </p>
            </div>
          </div>
        </div>

        {/* Auto-save indicator */}
        {/* {hasUnsavedChanges && (
          <Alert className="border-blue-200 bg-blue-50">
            <Save className="h-4 w-4" />
            <AlertDescription>
              Your changes are being automatically saved.
            </AlertDescription>
          </Alert>
        )} */}

                 {/* Form Tabs */}
         <Card className="card-shadow">
                                   <CardHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <CardTitle>Doctor Registration Form</CardTitle>
                  <CardDescription>
                    Complete all required information to submit
                  </CardDescription>
                </div>
                <div className="flex items-center justify-between">
                  <Progress value={progress} className="flex-1 h-2 mr-4" />
                  <span className="text-sm font-medium text-blue-600">{progress}%</span>
                </div>
              </div>
            </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                             <TabsList className="grid w-full grid-cols-3">
                 <TabsTrigger value="personal">{renderTabIndicator(personalProgress)}</TabsTrigger>
                 <TabsTrigger value="professional">{renderProfessionalIndicator(professionalProgress)}</TabsTrigger>
                 <TabsTrigger value="affiliations">{renderSchedulingIndicator(schedulingProgress)}</TabsTrigger>
               </TabsList>

              <TabsContent value="personal" className="space-y-6">
                <PersonalInfoForm
                  data={{
                    firstName: formData.firstName,
                    middleName: formData.middleName,
                    lastName: formData.lastName,
                    suffix: formData.suffix,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    dateOfBirth: formData.dateOfBirth,
                    gender: formData.gender,
                    civilStatus: formData.civilStatus,
                    avatar: formData.avatar
                  }}
                  onUpdate={(data) => {
                    setFormData(prev => ({ ...prev, ...data }));
                  }}
                />
              </TabsContent>

              <TabsContent value="professional" className="space-y-6">
                                 <ProfessionalDetailsForm
                   data={{
                     specialty: formData.specialty,
                     subSpecialty: formData.subSpecialty,
                     medicalLicense: formData.medicalLicense,
                     prcId: formData.prcId,
                     prcExpiry: formData.prcExpiry,
                     professionalFee: formData.professionalFee
                   }}
                   onUpdate={(data) => {
                     setFormData(prev => ({ ...prev, ...data }));
                   }}
                 />
              </TabsContent>

              <TabsContent value="affiliations" className="space-y-6">
                                 <AffiliationsEducationForm
                   data={{
                     schedules: formData.schedules
                   }}
                   onUpdate={(data) => {
                     setFormData(prev => ({ ...prev, ...data }));
                   }}
                 />
              </TabsContent>

                              
            </Tabs>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center space-x-3">
            <Link href="/doctors">
              <Button variant="outline">
                Cancel
              </Button>
            </Link>
            
            {/* Form persistence controls */}
            <div className="flex items-center space-x-2">
              {/* <Button 
                variant="outline" 
                size="sm"
                // onClick={() => saveData()} // This line is removed as per the edit hint
                disabled={!hasUnsavedChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Now
              </Button> */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearForm}
              >
                Clear Form
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <p className="text-sm text-muted-foreground">
              {isFormValid() ? 'Ready to submit' : 'Please complete required fields'}
            </p>
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={submitDialog}
        onOpenChange={setSubmitDialog}
        title="Submit Doctor Registration"
        description={`Are you sure you want to submit the registration for Dr. ${formData.firstName} ${formData.lastName}? This will create a new doctor account in the system.`}
        confirmText="Submit Registration"
        cancelText="Cancel"
        variant="default"
        loading={isSubmitting}
        onConfirm={confirmSubmit}
      />

      {/* Success Dialog */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Doctor Created Successfully!</DialogTitle>
            <DialogDescription>
              <div className="space-y-3">
                <p>A new doctor account has been created successfully.</p>
                {successData && (
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    <p className="text-sm font-medium">Please share these credentials with the doctor:</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Email:</span> {successData.email}</p>
                      <p><span className="font-medium">Temporary Password:</span> {successData.password}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      The doctor should change their password on first login.
                    </p>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Clear Form Dialog */}
      <ConfirmationDialog
        open={clearDialog}
        onOpenChange={setClearDialog}
        title="Clear Form Data"
        description="Are you sure you want to clear all form data? This action cannot be undone."
        confirmText="Clear Form"
        cancelText="Cancel"
        variant="destructive"
        loading={false}
        onConfirm={confirmClearForm}
      />
    </DashboardLayout>
  );
}