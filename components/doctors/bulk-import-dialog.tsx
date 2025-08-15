'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Users, UserCheck, UserX, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RealDataService } from '@/lib/services/real-data.service';
import { authService } from '@/lib/auth/auth.service';
import * as XLSX from 'xlsx';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface SpecialistData {
  // Personal Information (Required)
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  temporaryPassword: string;
  contactNumber: string; // ✅ Changed from phone
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  civilStatus: 'single' | 'married' | 'divorced' | 'widowed' | 'separated';
  address: string;
  
  // Professional Information (Required)
  specialty: string;
  medicalLicenseNumber: string; // ✅ Changed from medicalLicense
  prcId: string;
  prcExpiryDate: string; // ✅ Changed from prcExpiry
  professionalFee: number;
  
  // Schedule Information (Required)
  clinicName: string;
  roomOrUnit: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  validFrom: string;
}

// Mapping from Excel headers to database fields
const headerMapping: Record<string, keyof SpecialistData> = {
  'First Name*': 'firstName',
  'Middle Name*': 'middleName',
  'Last Name*': 'lastName',
  'Suffix*': 'suffix',
  'Email*': 'email',
  'Temporary Password*': 'temporaryPassword',
  'Phone*': 'contactNumber', // ✅ Map to correct field
  'Date of Birth*': 'dateOfBirth',
  'Gender*': 'gender',
  'Civil Status*': 'civilStatus',
  'Address*': 'address',
  'Specialty*': 'specialty',
  'Medical License*': 'medicalLicenseNumber', // ✅ Map to correct field
  'PRC ID*': 'prcId',
  'PRC Expiry*': 'prcExpiryDate', // ✅ Map to correct field
  'Professional Fee*': 'professionalFee',
  'Clinic Name*': 'clinicName',
  'Room/Unit*': 'roomOrUnit',
  'Day of Week*': 'dayOfWeek',
  'Start Time*': 'startTime',
  'End Time*': 'endTime',
  'Valid From*': 'validFrom'
};

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  credentials: Array<{ email: string; password: string }>;
}

export function BulkImportDialog({ open, onOpenChange, onSuccess }: BulkImportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // ✅ Add file state

  const downloadTemplate = async () => {
    try {
      // Fetch clinics from database
      const realDataService = new RealDataService();
      const clinics = await realDataService.getClinics();
      
      // Create workbook and worksheet with headers only (no sample data)
      const wb = XLSX.utils.book_new();
      
      // Define headers - Organized by sections for easy navigation
      const headers = [
        // Personal Information Section
        'First Name*',
        'Middle Name*', 
        'Last Name*',
        'Suffix*',
        'Email*',
        'Temporary Password*',
        'Phone*',
        'Date of Birth*',
        'Gender*',
        'Civil Status*',
        'Address*',
        
        // Professional Information Section
        'Specialty*',
        'Medical License*',
        'PRC ID*',
        'PRC Expiry*',
        'Professional Fee*',
        
        // Schedule Information Section
        'Clinic Name*',
        'Room/Unit*',
        'Day of Week*',
        'Start Time*',
        'End Time*',
        'Valid From*'
      ];

      // Create worksheet with headers only (no sample data)
      const ws = XLSX.utils.aoa_to_sheet([headers]);

      // Make headers bold
      for (let i = 0; i < headers.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
        if (!ws[cellRef]) {
          ws[cellRef] = { v: headers[i] };
        }
        ws[cellRef].s = { font: { bold: true } };
      }

      // Set column widths - Optimized for readability
      const colWidths = [
        // Personal Information Section
        { wch: 15 }, // firstName
        { wch: 15 }, // middleName
        { wch: 15 }, // lastName
        { wch: 12 }, // suffix
        { wch: 25 }, // email
        { wch: 20 }, // temporaryPassword
        { wch: 18 }, // phone
        { wch: 12 }, // dateOfBirth
        { wch: 10 }, // gender
        { wch: 12 }, // civilStatus
        { wch: 35 }, // address
        
        // Professional Information Section
        { wch: 20 }, // specialty
        { wch: 15 }, // medicalLicense
        { wch: 12 }, // prcId
        { wch: 12 }, // prcExpiry
        { wch: 15 }, // professionalFee
        
        // Schedule Information Section
        { wch: 25 }, // clinicName
        { wch: 15 }, // roomOrUnit
        { wch: 25 }, // dayOfWeek
        { wch: 10 }, // startTime
        { wch: 10 }, // endTime
        { wch: 12 }  // validFrom
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Specialists Template');

      // Create comprehensive instructions sheet
      const instructions = [
        ['BULK IMPORT SPECIALIST TEMPLATE - INSTRUCTIONS'],
        [''],
        ['GENERAL INSTRUCTIONS:'],
        ['1. Fill in ALL required fields marked with * (asterisk)'],
        ['2. Do NOT modify or delete any column headers'],
        ['3. Use exact formats as specified for each field type'],
        ['4. Each row represents one specialist to be created'],
        ['5. Save file as .xlsx format before uploading'],
        [''],
        ['FIELD FORMAT REQUIREMENTS:'],
        ['• Dates: Use YYYY-MM-DD format (e.g., 1985-03-15)'],
        ['• Phone: Include country code (+63 for Philippines)'],
        ['• Email: Must be unique and valid format'],
        ['• Numbers: Use digits only (no commas or currency symbols)'],
        ['• Text: Use proper capitalization and spelling'],
        [''],
        ['PERSONAL INFORMATION SECTION (Columns A-K):'],
        ['• firstName*: First name (minimum 2 characters)'],
        ['• middleName*: Middle name (minimum 2 characters)'],
        ['• lastName*: Last name (minimum 2 characters)'],
        ['• suffix*: Name suffix (e.g., MD, PhD, Jr., Sr.)'],
        ['• email*: Unique email address (e.g., doctor@hospital.com)'],
        ['• temporaryPassword*: Temporary password for account creation (minimum 6 characters)'],
        ['• phone*: Contact number with country code (+639123456789)'],
        ['• dateOfBirth*: Birth date in YYYY-MM-DD format'],
        ['• gender*: Choose from: male, female, other, prefer-not-to-say'],
        ['• civilStatus*: Choose from: single, married, divorced, widowed, separated'],
        ['• address*: Complete address (minimum 10 characters)'],
        [''],
        ['PROFESSIONAL INFORMATION SECTION (Columns K-O):'],
        ['• specialty*: Medical specialty (minimum 3 characters)'],
        ['• medicalLicense*: Medical license number (minimum 5 characters)'],
        ['• prcId*: PRC license ID (minimum 6 characters)'],
        ['• prcExpiry*: PRC expiry date (YYYY-MM-DD, must be future date)'],
        ['• professionalFee*: Consultation fee in PHP (positive number)'],
        [''],
        ['SCHEDULE INFORMATION SECTION (Columns P-U):'],
        ['• clinicName*: Clinic name (case-insensitive, must match available clinics)'],
        ['• roomOrUnit*: Room or unit number (e.g., Room 201)'],
        ['• dayOfWeek*: Days of week (comma-separated: monday,wednesday,friday)'],
        ['• startTime*: Start time in HH:MM format (e.g., 09:00 or 9:00)'],
        ['• endTime*: End time in HH:MM format (e.g., 17:00 or 5:00)'],
        ['• validFrom*: Schedule start date (YYYY-MM-DD format)'],
        [''],
        ['AVAILABLE CLINICS:'],
        ...clinics.map(clinic => [`• ${clinic.name}`]),
        [''],
        ['VALIDATION RULES:'],
        ['• All required fields (*) must be filled'],
        ['• Email addresses must be unique across all specialists'],
        ['• PRC IDs must be unique across all specialists'],
        ['• Phone numbers must include country code'],
        ['• Dates must be valid and in correct format'],
        ['• Professional fee must be between 0 and 100,000 PHP'],
        ['• Clinic name must match available clinics (case-insensitive)'],
        [''],
        ['COMMON SPECIALTIES:'],
        ['Cardiology, Dermatology, Emergency Medicine, Family Medicine,'],
        ['Internal Medicine, Neurology, Obstetrics and Gynecology,'],
        ['Oncology, Orthopedics, Pediatrics, Psychiatry, Radiology, Surgery, Urology'],
        [''],
        ['TROUBLESHOOTING:'],
        ['• If upload fails, check all required fields are filled'],
        ['• Ensure email and PRC ID are unique'],
        ['• Verify date formats are YYYY-MM-DD'],
        ['• Check phone numbers include country code'],
        ['• Ensure professional fee is a number without symbols'],
        ['• Verify clinic name matches available clinics (case-insensitive)']
      ];

      const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
      XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

      // Save the file
      XLSX.writeFile(wb, 'specialists_import_template.xlsx');
      
      toast({
        title: "Template downloaded",
        description: "Excel template has been downloaded. Fill in the data and upload it back.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Error downloading template",
        description: "Failed to download template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validateSpecialistData = async (data: any, row: number): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation - All required fields
    const requiredFields = [
      'First Name*', 'Middle Name*', 'Last Name*', 'Suffix*', 'Email*', 'Temporary Password*', 'Phone*', 
      'Date of Birth*', 'Gender*', 'Civil Status*', 'Address*', 'Specialty*', 
      'Medical License*', 'PRC ID*', 'PRC Expiry*', 'Professional Fee*',
      'Clinic Name*', 'Room/Unit*', 'Day of Week*', 'Start Time*', 'End Time*', 'Valid From*'
    ];
    
    requiredFields.forEach(field => {
      const value = data[field];
      if (!value || String(value).trim() === '') {
        errors.push(`Row ${row}: ${field} is required`);
      }
    });

    // Email validation
    if (data['Email*']) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(data['Email*']))) {
        errors.push(`Row ${row}: Invalid email format`);
      }
    }

    // Phone validation
    if (data['Phone*']) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const phoneString = String(data['Phone*']).replace(/\s/g, '');
      if (!phoneRegex.test(phoneString)) {
        errors.push(`Row ${row}: Invalid phone number format`);
      }
    }

    // Date validation
    if (data['Date of Birth*']) {
      const date = new Date(String(data['Date of Birth*']));
      if (!date || isNaN(date.getTime())) {
        errors.push(`Row ${row}: Invalid date format for Date of Birth`);
      }
    }

    if (data['PRC Expiry*']) {
      const date = new Date(String(data['PRC Expiry*']));
      if (!date || isNaN(date.getTime())) {
        errors.push(`Row ${row}: Invalid date format for PRC Expiry`);
      }
    }

    // Gender validation
    if (data['Gender*'] && !['male', 'female', 'other', 'prefer-not-to-say'].includes(String(data['Gender*']).toLowerCase())) {
      errors.push(`Row ${row}: Gender must be male, female, other, or prefer-not-to-say`);
    }

    // Civil status validation
    if (data['Civil Status*'] && !['single', 'married', 'divorced', 'widowed', 'separated'].includes(String(data['Civil Status*']).toLowerCase())) {
      errors.push(`Row ${row}: Civil status must be single, married, divorced, widowed, or separated`);
    }

    // Address validation
    if (data['Address*'] && String(data['Address*']).trim().length < 10) {
      errors.push(`Row ${row}: Address must be at least 10 characters long`);
    }

    // Medical license validation
    if (data['Medical License*'] && String(data['Medical License*']).trim().length < 5) {
      errors.push(`Row ${row}: Medical license must be at least 5 characters long`);
    }

    // PRC ID validation
    if (data['PRC ID*'] && String(data['PRC ID*']).trim().length < 6) {
      errors.push(`Row ${row}: PRC ID must be at least 6 characters long`);
    }

    // Professional fee validation
    if (data['Professional Fee*']) {
      const fee = parseFloat(String(data['Professional Fee*']));
      if (isNaN(fee) || fee < 0 || fee > 100000) {
        errors.push(`Row ${row}: Professional fee must be between 0 and 100,000 PHP`);
      }
    }

    // Specialty validation
    if (data['Specialty*'] && String(data['Specialty*']).trim().length < 3) {
      errors.push(`Row ${row}: Specialty must be at least 3 characters long`);
    }

    // Time validation
    if (data['Start Time*']) {
      const timeValue = data['Start Time*'];
      console.log('Validating start time:', timeValue, '(type:', typeof timeValue, ')');
      
      if (typeof timeValue === 'string') {
        const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(timeValue)) {
          console.log('Time validation failed for:', timeValue);
          errors.push(`Row ${row}: Start time must be in HH:MM format (e.g., 09:00 or 9:00)`);
        }
      } else if (typeof timeValue === 'number') {
        // Excel decimal time format - this is valid
        console.log('Excel decimal time format detected:', timeValue);
      } else {
        errors.push(`Row ${row}: Invalid start time format`);
      }
    }

    if (data['End Time*']) {
      const timeValue = data['End Time*'];
      console.log('Validating end time:', timeValue, '(type:', typeof timeValue, ')');
      
      if (typeof timeValue === 'string') {
        const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(timeValue)) {
          console.log('Time validation failed for:', timeValue);
          errors.push(`Row ${row}: End time must be in HH:MM format (e.g., 17:00 or 5:00)`);
        }
      } else if (typeof timeValue === 'number') {
        // Excel decimal time format - this is valid
        console.log('Excel decimal time format detected:', timeValue);
      } else {
        errors.push(`Row ${row}: Invalid end time format`);
      }
    }

    // Valid from date validation
    if (data['Valid From*']) {
      const date = new Date(String(data['Valid From*']));
      if (!date || isNaN(date.getTime())) {
        errors.push(`Row ${row}: Invalid date format for Valid From`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file); // ✅ Store the file
    setShowAdminAuth(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const readExcelFile = (file: File): Promise<SpecialistData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Remove header row and convert to objects
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          const specialists: SpecialistData[] = rows.map(row => {
            const specialist: any = {};
            headers.forEach((header, index) => {
              if (header && row[index] !== undefined) {
                specialist[header] = row[index];
              }
            });
            return specialist as SpecialistData;
          });

          resolve(specialists);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const validateBulkData = async (data: SpecialistData[]) => {
    const errors: Array<{ row: number; error: string }> = [];
    let totalErrors = 0;

    for (let i = 0; i < data.length; i++) {
      const specialist = data[i];
      const row = i + 2; // +2 because Excel is 1-indexed and we have headers
      const validation = await validateSpecialistData(specialist, row);
      
      validation.errors.forEach(error => {
        errors.push({ row, error });
        totalErrors++;
      });
    }

    return { errors, totalErrors };
  };

  const handleAdminAuth = async () => {
    if (!adminPassword.trim()) {
      setAdminAuthError('Please enter your password');
      return;
    }

    if (!selectedFile) {
      setAdminAuthError('No file selected. Please upload a file first.');
      return;
    }

    setIsProcessing(true);
    setAdminAuthError('');
    setProgress(0);

    try {
      // Re-authenticate admin first
      console.log('Authenticating admin...');
      await authService.reauthenticateAdmin('admin@unihealth.ph', adminPassword);
      console.log('Admin authenticated successfully');

      const specialists = await readExcelFile(selectedFile);
      console.log('Excel data read:', specialists.length, 'specialists');
      
      const realDataService = new RealDataService();
      
      const results: ImportResult = {
        total: specialists.length,
        successful: 0,
        failed: 0,
        errors: [],
        credentials: []
      };

      for (let i = 0; i < specialists.length; i++) {
        const specialist = specialists[i];
        setProgress(Math.round(((i + 1) / specialists.length) * 100));

        try {
          console.log(`Processing specialist ${i + 1}/${specialists.length}:`, specialist);
          
          // Convert Excel data to SpecialistData using mapping
          const specialistData: SpecialistData = {} as SpecialistData;
          
          // Map Excel headers to database fields
          Object.keys(specialist).forEach(header => {
            const dbField = headerMapping[header as keyof typeof headerMapping];
            if (dbField) {
              (specialistData as any)[dbField] = String((specialist as any)[header] || '');
            }
          });
          
          console.log('Mapped specialist data:', specialistData);
          
          // Convert professional fee to number
          specialistData.professionalFee = parseFloat(String(specialistData.professionalFee || '0'));
          
          // Validate clinic name exists and get clinic ID
          const clinics = await realDataService.getClinics();
          const clinicName = specialistData.clinicName.trim();
          const foundClinic = clinics.find(c => 
            c.name.toLowerCase() === clinicName.toLowerCase()
          );
          
          if (!foundClinic) {
            const clinicNames = clinics.map(c => c.name);
            throw new Error(`Clinic name "${clinicName}" not found. Available clinics: ${clinicNames.join(', ')}`);
          }

          console.log('Found clinic:', foundClinic);

          // Transform to expected format with schedules
          const transformedSpecialist = {
            // Personal Information
            firstName: specialistData.firstName,
            middleName: specialistData.middleName,
            lastName: specialistData.lastName,
            suffix: specialistData.suffix,
            email: specialistData.email,
            temporaryPassword: specialistData.temporaryPassword,
            contactNumber: specialistData.contactNumber,
            dateOfBirth: specialistData.dateOfBirth,
            gender: specialistData.gender,
            civilStatus: specialistData.civilStatus,
            address: specialistData.address,
            
            // Professional Information
            specialty: specialistData.specialty,
            medicalLicenseNumber: specialistData.medicalLicenseNumber,
            prcId: specialistData.prcId,
            prcExpiryDate: specialistData.prcExpiryDate,
            professionalFee: specialistData.professionalFee,
            
            // Schedule Information
            schedules: [{
              practiceLocation: {
                clinicId: foundClinic.id,
                roomOrUnit: specialistData.roomOrUnit
              },
              recurrence: {
                dayOfWeek: specialistData.dayOfWeek.split(',').map((day: string) => {
                  const dayMap: { [key: string]: number } = {
                    'monday': 0, 'mon': 0,
                    'tuesday': 1, 'tue': 1,
                    'wednesday': 2, 'wed': 2,
                    'thursday': 3, 'thu': 3,
                    'friday': 4, 'fri': 4,
                    'saturday': 5, 'sat': 5,
                    'sunday': 6, 'sun': 6
                  };
                  return dayMap[day.trim().toLowerCase()] ?? 0;
                }),
                type: 'weekly'
              },
              slotTemplate: (() => {
                // Generate time slots every 30 minutes
                const slots: any = {};
                const startTime = (() => {
                  const timeValue = specialistData.startTime;
                  if (typeof timeValue === 'string') {
                    return timeValue;
                  } else if (typeof timeValue === 'number') {
                    // Convert Excel decimal format to HH:MM
                    const hours = timeValue * 24;
                    const wholeHours = Math.floor(hours);
                    const minutes = Math.round((hours - wholeHours) * 60);
                    return `${wholeHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                  }
                  return specialistData.startTime;
                })();
                
                const endTime = (() => {
                  const timeValue = specialistData.endTime;
                  if (typeof timeValue === 'string') {
                    return timeValue;
                  } else if (typeof timeValue === 'number') {
                    // Convert Excel decimal format to HH:MM
                    const hours = timeValue * 24;
                    const wholeHours = Math.floor(hours);
                    const minutes = Math.round((hours - wholeHours) * 60);
                    return `${wholeHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                  }
                  return specialistData.endTime;
                })();
                
                console.log('Time conversion:', { startTime, endTime });
                
                // Generate time slots every 30 minutes
                const start = new Date(`2000-01-01T${startTime}:00`);
                const end = new Date(`2000-01-01T${endTime}:00`);
                
                while (start < end) {
                  const timeString = start.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  });
                  slots[timeString] = {
                    defaultStatus: 'available',
                    durationMinutes: 30
                  };
                  start.setMinutes(start.getMinutes() + 30);
                }
                
                return slots;
              })(),
              validFrom: specialistData.validFrom,
              isActive: true,
              scheduleType: 'Weekly'
            }]
          };

          console.log('About to create doctor with data:', transformedSpecialist);
          
          // Check if createDoctor method exists
          if (typeof realDataService.createDoctor !== 'function') {
            throw new Error('createDoctor method not found in realDataService');
          }
          
          // Add delay between requests to prevent rate limiting
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          }
          
          const result = await realDataService.createDoctor(transformedSpecialist);
          console.log('Create doctor result:', result);
          
          // ✅ Fix linter errors - use proper destructuring
          const { doctorId, temporaryPassword } = result;
          
          console.log('Doctor created successfully:', { doctorId, temporaryPassword });
          
          results.successful++;
          results.credentials.push({
            email: specialistData.email,
            password: temporaryPassword
          });
        } catch (error) {
          console.error('Error creating doctor:', error);
          
          // Handle network errors specifically
          if (error instanceof Error && error.message.includes('network-request-failed')) {
            results.errors.push({
              row: i + 2,
              error: 'Network error - please check your internet connection and try again'
            });
          } else {
            results.errors.push({
              row: i + 2,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          
          results.failed++;
        }
      }

      setImportResult(results);
      setShowAdminAuth(false);
      setAdminPassword('');

      toast({
        title: "Bulk import completed",
        description: `${results.successful} specialists created successfully, ${results.failed} failed.`,
        variant: "default",
      });

      if (results.successful > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error during bulk import:', error);
      setAdminAuthError('Failed to process bulk import. Please try again.');
      toast({
        title: "Bulk import failed",
        description: "Please check your admin credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialog = () => {
    setImportResult(null);
    setAdminPassword('');
    setAdminAuthError('');
    setProgress(0);
    setShowAdminAuth(false);
    setSelectedFile(null); // ✅ Clear stored file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Specialists
          </DialogTitle>
          <DialogDescription>
            Import multiple specialists from an Excel file. Download the template first, fill it with data, then upload it back.
          </DialogDescription>
        </DialogHeader>

        {!showAdminAuth && !importResult && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Step 1: Download Template
                </CardTitle>
                <CardDescription>
                  Download the Excel template with all required fields and instructions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={downloadTemplate} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Excel Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Step 2: Upload Filled Template
                </CardTitle>
                <CardDescription>
                  Upload your filled Excel file to import specialists.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Excel File
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {showAdminAuth && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please enter your admin password to proceed with the bulk import.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label htmlFor="adminPassword" className="text-sm font-medium">
                Admin Password
              </label>
              <input
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your admin password"
              />
            </div>

            {adminAuthError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{adminAuthError}</AlertDescription>
              </Alert>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdminAuth(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleAdminAuth} disabled={isProcessing || !adminPassword.trim()}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Start Import
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {importResult && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importResult.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>

                {importResult.successful > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Created Accounts:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResult.credentials.map((cred, index) => (
                        <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                          <span className="font-medium">Email:</span> {cred.email} | 
                          <span className="font-medium ml-2">Password:</span> {cred.password}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-600">Errors:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm p-2 bg-red-50 text-red-700 rounded">
                          <span className="font-medium">Row {error.row}:</span> {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button onClick={resetDialog}>
                Import Another File
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}   