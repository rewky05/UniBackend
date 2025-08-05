'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PersonalInfoForm } from '@/components/patients/personal-info-form';
import { DemographicsForm } from '@/components/patients/demographics-form';
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
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  address: string;
  allergies: string[];
  medicalConditions: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
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
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    address: '',
    allergies: [],
    medicalConditions: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  };

  const [formData, setFormData] = useState<PatientFormData>(initialFormData);

  // Form persistence
  useEffect(() => {
    const savedData = localStorage.getItem('patientFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('patientFormData', JSON.stringify(formData));
  }, [formData]);

  const handleFormDataChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
    
    try {
      const realDataService = new RealDataService();
      
      // Create patient in Firebase (users and patients nodes)
      const { patientId, temporaryPassword } = await realDataService.createPatient(formData);
      
      // Re-authenticate the admin user using their credentials
      await authService.reauthenticateAdmin(user?.email || '', adminPassword);
      
      // Clear admin password from state
      setAdminPassword('');
      setShowAdminAuth(false);
      
      // Clear saved form data after successful submission (if needed, currently commented out)
      // clearData();
      
      // Set success data and show dialog
      setSuccessData({
        email: formData.email,
        password: temporaryPassword
      });
      setSuccessDialog(true);
      
      // Show a success toast
      toast({
        title: "Patient created successfully",
        description: "Your admin session has been restored automatically.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error creating patient:', error);
      setAdminAuthError('Failed to create patient or restore admin session. Please try again.');
      toast({
        title: "Error creating patient",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearForm = () => {
    setClearDialog(true);
  };

  const confirmClearForm = () => {
    setFormData(initialFormData);
    localStorage.removeItem('patientFormData');
    setClearDialog(false);
    toast({
      title: "Form cleared",
      description: "All form data has been cleared.",
      variant: "default",
    });
  };

  const isFormValid = () => {
    // Personal Information validation
    const personalValid = 
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.phone.trim() !== '';
    
    // Demographics validation
    const demographicsValid = 
      formData.dateOfBirth !== '' &&
      formData.gender !== '';
    
    // Emergency Contact validation
    const emergencyValid = 
      formData.emergencyContact.name.trim() !== '' &&
      formData.emergencyContact.phone.trim() !== '' &&
      formData.emergencyContact.relationship.trim() !== '';

    return personalValid && demographicsValid && emergencyValid;
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const isValidDate = (date: string) => {
    const selectedDate = new Date(date);
    const today = new Date();
    return selectedDate <= today;
  };

  const calculateProgress = () => {
    let completedFields = 0;
    let totalFields = 0;

    // Personal Information (4 required fields)
    const personalFields = [
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.phone
    ];

    // Demographics (2 required fields)
    const demographicsFields = [
      formData.dateOfBirth,
      formData.gender
    ];

    // Emergency Contact (3 required fields)
    const emergencyFields = [
      formData.emergencyContact.name,
      formData.emergencyContact.phone,
      formData.emergencyContact.relationship
    ];

    totalFields += personalFields.length + demographicsFields.length + emergencyFields.length;
    completedFields += personalFields.filter(field => field.trim() !== '').length;
    completedFields += demographicsFields.filter(field => field.trim() !== '').length;
    completedFields += emergencyFields.filter(field => field.trim() !== '').length;

    return Math.round((completedFields / totalFields) * 100);
  };

  const calculateTabProgress = (tabName: string) => {
    switch (tabName) {
      case 'personal':
        const personalFields = [
          formData.firstName,
          formData.lastName,
          formData.email,
          formData.phone
        ];
        const completedPersonal = personalFields.filter(field => field.trim() !== '').length;
        return Math.round((completedPersonal / personalFields.length) * 100);
      case 'demographics':
        const demographicsFields = [
          formData.dateOfBirth,
          formData.gender
        ];
        const completedDemographics = demographicsFields.filter(field => field.trim() !== '').length;
        return Math.round((completedDemographics / demographicsFields.length) * 100);
      case 'emergency':
        const emergencyFields = [
          formData.emergencyContact.name,
          formData.emergencyContact.phone,
          formData.emergencyContact.relationship
        ];
        const completedEmergency = emergencyFields.filter(field => field.trim() !== '').length;
        return Math.round((completedEmergency / emergencyFields.length) * 100);
      default:
        return 0;
    }
  };

  const renderTabIndicator = (progress: number) => {
    if (progress === 0) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-muted"></div>
          <span className="text-xs">Not started</span>
        </div>
      );
    } else if (progress === 100) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-xs">Complete</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-xs">{progress}% complete</span>
        </div>
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/patients">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Add New Patient</h1>
              <p className="text-muted-foreground">
                Create a new patient account with temporary credentials
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleClearForm}
              disabled={!(
                formData.firstName.trim() !== '' ||
                formData.middleName.trim() !== '' ||
                formData.lastName.trim() !== '' ||
                formData.email.trim() !== '' ||
                formData.phone.trim() !== '' ||
                formData.dateOfBirth !== '' ||
                formData.gender !== '' ||
                formData.bloodType !== '' ||
                formData.address.trim() !== '' ||
                formData.allergies.length > 0 ||
                formData.medicalConditions.length > 0 ||
                formData.emergencyContact.name.trim() !== '' ||
                formData.emergencyContact.phone.trim() !== '' ||
                formData.emergencyContact.relationship.trim() !== ''
              )}
            >
              Clear Form
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? 'Creating Patient...' : 'Create Patient'}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Form Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {calculateProgress()}% Complete
                </span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Form Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <span>Personal Information</span>
              {renderTabIndicator(calculateTabProgress('personal'))}
            </TabsTrigger>
            <TabsTrigger value="demographics" className="flex items-center gap-2">
              <span>Demographics</span>
              {renderTabIndicator(calculateTabProgress('demographics'))}
            </TabsTrigger>
            <TabsTrigger value="emergency" className="flex items-center gap-2">
              <span>Emergency Contact</span>
              {renderTabIndicator(calculateTabProgress('emergency'))}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <PersonalInfoForm
              formData={formData}
              onFormDataChange={handleFormDataChange}
            />
          </TabsContent>

          <TabsContent value="demographics" className="space-y-6">
            <DemographicsForm
              formData={formData}
              onFormDataChange={handleFormDataChange}
            />
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6">
            <EmergencyContactForm
              formData={formData}
              onFormDataChange={handleFormDataChange}
            />
          </TabsContent>
        </Tabs>

        {/* Validation Alerts */}
        {!isFormValid() && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please complete all required fields before submitting the form.
            </AlertDescription>
          </Alert>
        )}

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
          title="Create Patient Account"
          description="Are you sure you want to create a new patient account? This will generate temporary credentials that should be shared with the patient."
          confirmText="Create Patient"
          onConfirm={confirmSubmit}
        />

        {/* Clear Form Dialog */}
        <ConfirmationDialog
          open={clearDialog}
          onOpenChange={setClearDialog}
          title="Clear Form Data"
          description="Are you sure you want to clear all form data? This action cannot be undone."
          confirmText="Clear Form"
          onConfirm={confirmClearForm}
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
                            description: "Patient credentials have been copied to clipboard.",
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
                variant="outline"
                onClick={() => {
                  setSuccessDialog(false);
                  setFormData(initialFormData);
                  localStorage.removeItem('patientFormData');
                }}
              >
                Create Another Patient
              </Button>
              <Button
                onClick={() => {
                  setSuccessDialog(false);
                  router.push('/patients');
                }}
              >
                Go to Patients List
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 