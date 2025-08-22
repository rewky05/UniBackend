'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PersonalInfoForm } from '@/components/patients/personal-info-form';
import { EmergencyContactForm } from '@/components/patients/emergency-contact-form';
import { ArrowLeft, UserPlus, AlertTriangle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { RealDataService } from '@/lib/services/real-data.service';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { authService } from '@/lib/auth/auth.service';
import { clearFormCompletely } from '@/lib/utils/form-reset';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface PatientFormData {
  // Personal Information
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  educationalAttainment: string;
  bloodType: string;
  allergies: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  // Required for account creation
  temporaryPassword: string;
}

export default function AddPatientPage() {
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
  
  // Admin authentication state
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');
  
  // Initial form data
  const initialFormData: PatientFormData = {
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    educationalAttainment: '',
    bloodType: '',
    allergies: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    // Required for account creation
    temporaryPassword: ''
  };

  // Use form persistence hook for better form management
  const {
    formData,
    setFormData,
    clearForm,
    isLoaded
  } = useFormPersistence<PatientFormData>({
    storageKey: 'patient-form-data',
    initialData: initialFormData,
    autoSave: true,
    autoLoad: true
  });

  // Form reset key to force re-render of form components
  const [formResetKey, setFormResetKey] = useState(0);

  // Optimized update function to prevent unnecessary re-renders
  const handleFormUpdate = useCallback((updates: Partial<PatientFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []); // Empty dependency array since setFormData is now stable
  


  const handleSubmit = () => {
    setSubmitDialog(true);
  };

  const confirmSubmit = async () => {
    // Show admin authentication dialog first
    setShowAdminAuth(true);
    setSubmitDialog(false);
  };

  const handleAdminAuth = async () => {
    if (!adminPassword.trim()) {
      setAdminAuthError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    setAdminAuthError('');
    
    // Clear previous logs
    localStorage.removeItem('patientAuthLogs');
    const logs = [];
    
    try {
      logs.push('=== Starting Enhanced Individual Patient Creation ===');
      logs.push(`Current user before patient creation: ${user?.email}`);
      logs.push(`Admin password length: ${adminPassword.length}`);
      logs.push(`Timestamp: ${new Date().toISOString()}`);
      
      console.log('=== Starting Enhanced Individual Patient Creation ===');
      console.log('Current user before patient creation:', user);
      console.log('Admin email:', user?.email);
      console.log('Admin password length:', adminPassword.length);
      console.log('Timestamp:', new Date().toISOString());
      
      const realDataService = new RealDataService();
      
      // Step 1: Validate form data before creation
      logs.push('Step 1: Validating form data...');
      if (!isLoaded || !formData) {
        throw new Error('Form data is not properly loaded. Please refresh the page and try again.');
      }
      if (!isFormValid()) {
        throw new Error('Form validation failed. Please complete all required fields.');
      }
      logs.push('Form validation passed');
      
      // Step 2: Create patient in Firebase (users and patients nodes)
      logs.push('Step 2: Creating patient in Firebase...');
      console.log('About to create patient with email:', formData.email);
      logs.push(`About to create patient with email: ${formData.email}`);
      
      const { patientId, temporaryPassword } = await realDataService.createPatient(formData);
      
      console.log('Patient created successfully:', { patientId, temporaryPassword });
      console.log('Temporary password type:', typeof temporaryPassword);
      console.log('Temporary password length:', temporaryPassword?.length);
      console.log('Current auth user after patient creation:', auth.currentUser);
      
      logs.push(`Patient created successfully. ID: ${patientId}`);
      logs.push(`Temporary password: ${temporaryPassword}`);
      logs.push(`Temporary password type: ${typeof temporaryPassword}`);
      logs.push(`Temporary password length: ${temporaryPassword?.length || 0}`);
      logs.push(`Current auth user after patient creation: ${auth.currentUser?.email || 'null'}`);
      
      // Step 3: Enhanced re-authentication with progress tracking
      logs.push('Step 3: Starting enhanced re-authentication...');
      console.log('About to reauthenticate admin with enhanced system...');
      
      logs.push(`About to reauthenticate admin with email: ${user?.email}`);
      logs.push(`Admin password provided: ${adminPassword ? 'Yes' : 'No'}`);
      
      const reauthenticatedAdmin = await authService.reauthenticateAdmin(user?.email || '', adminPassword);
      
      console.log('Enhanced reauthentication successful:', reauthenticatedAdmin);
      console.log('Current auth user after reauthentication:', auth.currentUser);
      console.log('Reauthentication result email:', reauthenticatedAdmin?.email);
      console.log('Current auth user email:', auth.currentUser?.email);
      
      logs.push(`Enhanced reauthentication successful: ${reauthenticatedAdmin?.email || 'null'}`);
      logs.push(`Current auth user after reauthentication: ${auth.currentUser?.email || 'null'}`);
      logs.push(`Reauthentication result email: ${reauthenticatedAdmin?.email || 'null'}`);
      logs.push(`Current auth user email: ${auth.currentUser?.email || 'null'}`);
      
      // Step 4: Cleanup and success handling
      logs.push('Step 4: Cleaning up and handling success...');
      
      // Clear admin password from state
      setAdminPassword('');
      setShowAdminAuth(false);
      
      // Set success data and show dialog
      const successDataObj = {
        email: formData.email,
        password: temporaryPassword
      };
      console.log('Setting success data:', successDataObj);
      console.log('Success data email:', successDataObj.email);
      console.log('Success data password:', successDataObj.password);
      
      logs.push(`Setting success data: ${JSON.stringify(successDataObj)}`);
      logs.push('=== Enhanced Individual Patient Creation completed successfully ===');
      
      // Store logs in localStorage
      localStorage.setItem('patientAuthLogs', JSON.stringify(logs));
      
      setSuccessData(successDataObj);
      setSuccessDialog(true);
      
      // Clear form data after successful creation
      handleFormClear();
      
      // Show a success toast with enhanced messaging
      toast({
        title: "Patient created successfully! 🎉",
        description: "Your admin session has been restored automatically with enhanced security.",
        variant: "default",
      });
      
    } catch (error: any) {
      console.error('=== Error in Enhanced Individual Patient Creation ===');
      console.error('Error creating patient:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Current auth user after error:', auth.currentUser);
      console.error('Error stack:', error.stack);
      
      logs.push(`=== Error in Enhanced Individual Patient Creation ===`);
      logs.push(`Error code: ${error.code || 'N/A'}`);
      logs.push(`Error message: ${error.message}`);
      logs.push(`Current auth user after error: ${auth.currentUser?.email || 'null'}`);
      logs.push(`Error stack: ${error.stack || 'N/A'}`);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to create patient. Please try again.';
      
      if (error.message) {
        if (error.message.includes('email-already-in-use')) {
          errorMessage = 'A patient with this email already exists. Please use a different email address.';
        } else if (error.message.includes('invalid-email')) {
          errorMessage = 'Please enter a valid email address for the patient.';
        } else if (error.message.includes('weak-password')) {
          errorMessage = 'The temporary password is too weak. Please use a stronger password.';
        } else if (error.message.includes('wrong-password')) {
          errorMessage = 'Incorrect admin password. Please verify your credentials and try again.';
        } else if (error.message.includes('user-not-found')) {
          errorMessage = 'Admin user not found. Please check your credentials and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error occurred. Please check your connection and try again.';
        } else if (error.message.includes('too-many-requests')) {
          errorMessage = 'Too many authentication attempts. Please wait a moment and try again.';
        } else if (error.message.includes('session')) {
          errorMessage = 'Session management error. Please refresh the page and try again.';
        } else if (error.message.includes('Form validation failed')) {
          errorMessage = 'Please complete all required fields before submitting.';
        } else if (error.message.includes('Failed to restore admin session')) {
          errorMessage = 'Patient created but admin session could not be restored. Please sign in again.';
        }
      }
      
      // Store error logs in localStorage
      localStorage.setItem('patientAuthErrorLogs', JSON.stringify(logs));
      
      setAdminAuthError(errorMessage);
      toast({
        title: "Error creating patient",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Comprehensive form clearing function that resets all form data and internal component state
   */
  const handleFormClear = () => {
    // Use the clearForm function from useFormPersistence hook
    clearForm();
    
    // Reset to first tab
    setActiveTab('personal');
    
    // Force re-render of all form components by incrementing reset key
    setFormResetKey(prev => prev + 1);
    
    // Show toast notification
    toast({
      title: "Form cleared",
      description: "All form data has been cleared successfully.",
      variant: "default",
    });
  };

  const isFormValid = () => {
    // Don't validate if form is not loaded yet
    if (!isLoaded || !formData) {
      return false;
    }

    // Personal Information validation
    const personalValid = 
      formData.firstName?.trim().length >= 2 &&
      formData.lastName?.trim().length >= 2 &&
      formData.middleName?.trim().length >= 2 &&
      isValidEmail(formData.email || '') &&
      isValidPhone(formData.phone || '') &&
      formData.address?.trim().length >= 10 &&
      formData.educationalAttainment?.trim().length > 0 &&
      isValidDate(formData.dateOfBirth || '') &&
      formData.gender?.trim() && ['male', 'female', 'other', 'prefer-not-to-say'].includes(formData.gender) &&
      formData.bloodType?.trim().length > 0 &&
      formData.temporaryPassword && formData.temporaryPassword.trim().length >= 6;
    
    // Emergency Contact validation
    const emergencyValid = 
      formData.emergencyContact?.name?.trim().length >= 2 &&
      isValidPhone(formData.emergencyContact?.phone || '') &&
      formData.emergencyContact?.relationship?.trim().length >= 2;

    return personalValid && emergencyValid;
  };

  // Validation functions
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const isValidPhone = (phone: string) => {
    // More flexible phone validation for Philippine numbers
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    // Allow various Philippine phone formats
    const phoneRegex = /^(\+63|63|0)?[9]\d{8,9}$/;
    return phoneRegex.test(cleanedPhone);
  };

  const isValidDate = (date: string) => {
    if (!date.trim()) return false;
    const dateObj = new Date(date);
    const isValid = dateObj instanceof Date && !isNaN(dateObj.getTime()) && dateObj < new Date();
    return isValid;
  };

  const handleClearForm = () => {
    setClearDialog(true);
  };

  const confirmClearForm = () => {
    handleFormClear();
    setClearDialog(false);
  };

  // Calculate form completion percentage with validation
  const calculateProgress = () => {
    // Don't calculate if form is not loaded yet
    if (!isLoaded || !formData) {
      return 0;
    }

    const totalFields = 14; // Total number of required fields (11 personal + 3 emergency contact)
    let completedFields = 0;

    // Personal Information (11 fields) - with validation
    if (formData.firstName?.trim().length >= 2) completedFields++;
    if (formData.lastName?.trim().length >= 2) completedFields++;
    if (formData.middleName?.trim().length >= 2) completedFields++;
    if (isValidEmail(formData.email || '')) completedFields++;
    if (formData.temporaryPassword && formData.temporaryPassword.trim().length >= 6) completedFields++;
    if (isValidPhone(formData.phone || '')) completedFields++;
    if (formData.address?.trim().length >= 10) completedFields++;
    if (formData.educationalAttainment?.trim().length > 0) completedFields++;
    if (isValidDate(formData.dateOfBirth || '')) completedFields++;
    if (formData.gender?.trim() && ['male', 'female', 'other', 'prefer-not-to-say'].includes(formData.gender)) completedFields++;
    if (formData.bloodType?.trim().length > 0) completedFields++;

    // Emergency Contact (3 required fields) - with validation
    if (formData.emergencyContact?.name?.trim().length >= 2) completedFields++;
    if (isValidPhone(formData.emergencyContact?.phone || '')) completedFields++;
    if (formData.emergencyContact?.relationship?.trim().length >= 2) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  // Calculate completion percentage for each tab with validation
  const calculateTabProgress = (tabName: string) => {
    // Don't calculate if form is not loaded yet
    if (!isLoaded || !formData) {
      return 0;
    }

    switch (tabName) {
      case 'personal':
        let completedPersonal = 0;
        const personalValidations = [
          { field: 'firstName', valid: formData.firstName?.trim().length >= 2 },
          { field: 'lastName', valid: formData.lastName?.trim().length >= 2 },
          { field: 'middleName', valid: formData.middleName?.trim().length >= 2 },
          { field: 'email', valid: isValidEmail(formData.email || '') },
          { field: 'temporaryPassword', valid: formData.temporaryPassword && formData.temporaryPassword.trim().length >= 6 },
          { field: 'phone', valid: isValidPhone(formData.phone || '') },
          { field: 'address', valid: formData.address?.trim().length >= 10 },
          { field: 'educationalAttainment', valid: formData.educationalAttainment?.trim().length > 0 },
          { field: 'dateOfBirth', valid: isValidDate(formData.dateOfBirth || '') },
          { field: 'gender', valid: formData.gender?.trim() && ['male', 'female', 'other', 'prefer-not-to-say'].includes(formData.gender) },
          { field: 'bloodType', valid: formData.bloodType?.trim().length > 0 }
        ];
        
        personalValidations.forEach(({ field, valid }) => {
          if (valid) completedPersonal++;
        });
        
        return Math.round((completedPersonal / 11) * 100);
      
      case 'emergency':
        let completedEmergency = 0;
        if (formData.emergencyContact?.name?.trim().length >= 2) completedEmergency++;
        if (isValidPhone(formData.emergencyContact?.phone || '')) completedEmergency++;
        if (formData.emergencyContact?.relationship?.trim().length >= 2) completedEmergency++;
        return Math.round((completedEmergency / 3) * 100);
      
      default:
        return 0;
    }
  };

  // Helper function to render tab completion indicator
  const renderTabIndicator = (progress: number, tabName: string) => {
    if (progress === 100) {
      return (
        <div className="flex items-center space-x-2">
          <span>{tabName}</span>
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
          <span>{tabName}</span>
          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
            {progress}%
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2">
          <span>{tabName}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
            0%
          </span>
        </div>
      );
    }
  };

  const progress = calculateProgress();
  const personalProgress = calculateTabProgress('personal');
  const emergencyProgress = calculateTabProgress('emergency');

  // Show loading state while form data is being loaded
  if (!isLoaded) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading form...</p>
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
            <Link href="/patients">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <UserPlus className="h-6 w-6 mr-2" />
                Add New Patient
              </h2>
              <p className="text-muted-foreground">
                Register a new patient in the healthcare system
              </p>
            </div>
          </div>

        </div>

        {/* Form Tabs */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <CardTitle>Patient Registration Form</CardTitle>
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">{renderTabIndicator(personalProgress, 'Personal Info')}</TabsTrigger>
                <TabsTrigger value="emergency">{renderTabIndicator(emergencyProgress, 'Emergency')}</TabsTrigger>
              </TabsList>

                <TabsContent value="personal" className="space-y-6">
                  {isLoaded && formData && (
                    <PersonalInfoForm
                      key={formResetKey} // Add key to force re-render
                      data={formData}
                      onUpdate={handleFormUpdate}
                    />
                  )}
                </TabsContent>

                <TabsContent value="emergency" className="space-y-6">
                  {isLoaded && formData && (
                    <EmergencyContactForm
                      key={formResetKey} // Add key to force re-render
                      data={formData}
                      onUpdate={handleFormUpdate}
                    />
                  )}
                </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center space-x-3">
            <Link href="/patients">
              <Button variant="outline">
                Cancel
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearForm}
            >
              Clear Form
            </Button>
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

      {/* Admin Authentication Dialog */}
      <Dialog open={showAdminAuth} onOpenChange={setShowAdminAuth}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Authentication Required</DialogTitle>
            <DialogDescription>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Security Verification Required</p>
                    <p>
                      To create a new patient account, we need to verify your admin credentials. 
                      This ensures your session remains active after the patient is created.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="text-sm font-medium">
                      Admin Password
                    </Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Enter your admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAdminAuth();
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                  {adminAuthError && (
                    <div className="flex items-center space-x-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{adminAuthError}</span>
                    </div>
                  )}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAdminAuth(false);
                setAdminPassword('');
                setAdminAuthError('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAdminAuth}
              disabled={isSubmitting || !adminPassword.trim()}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Patient'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={submitDialog}
        onOpenChange={setSubmitDialog}
        title="Submit Patient Registration"
        description={`Are you sure you want to submit the registration for ${formData.firstName || ''} ${formData.lastName || ''}? This will create a new patient account in the system.`}
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
            <DialogTitle>Patient Created Successfully!</DialogTitle>
            <DialogDescription>
              <div className="space-y-3">
                <p>A new patient account has been created successfully.</p>
                {successData && (
                  <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        Credentials Generated Successfully
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Email:</span>
                        <span className="text-sm font-mono bg-background px-2 py-1 rounded border">
                          {successData.email}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Temporary Password:</span>
                        <span className="text-sm font-mono bg-background px-2 py-1 rounded border">
                          {successData.password}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3 w-3" />
                      <span>The patient should change their password on first login.</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        const credentials = `Email: ${successData.email}\nTemporary Password: ${successData.password}`;
                        navigator.clipboard.writeText(credentials);
                        toast({
                          title: "Credentials copied",
                          description: "Email and password copied to clipboard",
                          variant: "default",
                        });
                      }}
                    >
                      Copy Credentials
                    </Button>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => router.push('/patients')}
              className="w-full"
            >
              Go to Patients List
            </Button>
          </DialogFooter>
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