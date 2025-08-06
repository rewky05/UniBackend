'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Users, UserCheck, UserX } from 'lucide-react';
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
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  civilStatus: 'single' | 'married' | 'divorced' | 'widowed' | 'separated';
  address: string;
  
  // Professional Information (Required)
  specialty: string;
  medicalLicense: string;
  prcId: string;
  prcExpiry: string;
  professionalFee: number;
  
  // Schedule Information (Required)
  clinicName: string;
  roomOrUnit: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  validFrom: string;
}

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

  const downloadTemplate = async () => {
    try {
      // Fetch clinics from database
      const realDataService = new RealDataService();
      const clinics = await realDataService.getClinics();
      
             // Create template data with all required fields
       const templateData = [
         {
           // Personal Information Section
           'First Name*': 'John',
           'Middle Name*': 'Michael',
           'Last Name*': 'Doe',
           'Suffix*': 'MD',
           'Email*': 'john.doe@example.com',
           'Phone*': '+639123456789',
           'Date of Birth*': '1985-03-15',
           'Gender*': 'male',
           'Civil Status*': 'married',
           'Address*': '123 Medical Center, Metro Manila, Philippines',
           
           // Professional Information Section
           'Specialty*': 'Cardiology',
           'Medical License*': 'MD123456789',
           'PRC ID*': 'PRC123456',
           'PRC Expiry*': '2025-12-31',
           'Professional Fee*': 2500,
           
           // Schedule Information Section
           'Clinic Name*': clinics.length > 0 ? clinics[0].name : 'Select Clinic',
           'Room/Unit*': 'Room 201',
           'Day of Week*': 'monday,wednesday,friday',
           'Start Time*': '09:00',
           'End Time*': '17:00',
           'Valid From*': '2025-01-01'
         },
         {
           // Personal Information Section
           'First Name*': 'Jane',
           'Middle Name*': 'Santos',
           'Last Name*': 'Smith',
           'Suffix*': 'MD',
           'Email*': 'jane.smith@example.com',
           'Phone*': '+639987654321',
           'Date of Birth*': '1990-07-22',
           'Gender*': 'female',
           'Civil Status*': 'single',
           'Address*': '456 Children\'s Hospital, Quezon City, Philippines',
           
           // Professional Information Section
           'Specialty*': 'Pediatrics',
           'Medical License*': 'MD789012345',
           'PRC ID*': 'PRC789012',
           'PRC Expiry*': '2026-06-30',
           'Professional Fee*': 2000,
           
           // Schedule Information Section
           'Clinic Name*': clinics.length > 1 ? clinics[1].name : 'Select Clinic',
           'Room/Unit*': 'Room 305',
           'Day of Week*': 'tuesday,thursday,saturday',
           'Start Time*': '08:00',
           'End Time*': '16:00',
           'Valid From*': '2025-01-01'
         }
       ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

         // Add headers - Organized by sections for easy navigation
     const headers = [
       // Personal Information Section
       'First Name*',
       'Middle Name*', 
       'Last Name*',
       'Suffix*',
       'Email*',
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

         XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });

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
      ['PERSONAL INFORMATION SECTION (Columns A-J):'],
      ['• firstName*: First name (minimum 2 characters)'],
      ['• middleName*: Middle name (minimum 2 characters)'],
      ['• lastName*: Last name (minimum 2 characters)'],
      ['• suffix*: Name suffix (e.g., MD, PhD, Jr., Sr.)'],
      ['• email*: Unique email address (e.g., doctor@hospital.com)'],
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
       'First Name*', 'Middle Name*', 'Last Name*', 'Suffix*', 'Email*', 'Phone*', 
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
       if (isNaN(date.getTime())) {
         errors.push(`Row ${row}: Invalid date format for Date of Birth`);
       }
     }

     if (data['PRC Expiry*']) {
       const date = new Date(String(data['PRC Expiry*']));
       if (isNaN(date.getTime())) {
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

     // Suffix validation
     if (data['Suffix*'] && String(data['Suffix*']).trim().length === 0) {
       errors.push(`Row ${row}: Suffix is required`);
     }

    

                        // Professional fee validation
     if (data['Professional Fee*']) {
       const fee = parseFloat(String(data['Professional Fee*']));
       if (isNaN(fee) || fee < 0) {
         errors.push(`Row ${row}: Professional fee must be a positive number`);
       }
     }
      
           // Schedule validation
     if (data['Valid From*']) {
       const date = new Date(String(data['Valid From*']));
       if (isNaN(date.getTime())) {
         errors.push(`Row ${row}: Invalid date format for Valid From`);
       }
     }
      
           // Time format validation - Accept both 7:00 and 07:00 formats, and Excel decimal format
     if (data['Start Time*']) {
       const timeValue = data['Start Time*'];
       console.log(`Validating start time: "${timeValue}" (type: ${typeof timeValue})`);
       
       let isValidTime = false;
       
       if (typeof timeValue === 'string') {
         // Handle string format (HH:MM)
         const timeRegex = /^([0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
         isValidTime = timeRegex.test(timeValue);
       } else if (typeof timeValue === 'number') {
         // Handle Excel decimal format (fraction of day)
         // Convert decimal to hours and validate
         const hours = timeValue * 24;
         const wholeHours = Math.floor(hours);
         const minutes = Math.round((hours - wholeHours) * 60);
         
         isValidTime = wholeHours >= 0 && wholeHours <= 23 && minutes >= 0 && minutes <= 59;
         console.log(`Converted decimal ${timeValue} to ${wholeHours}:${minutes.toString().padStart(2, '0')}`);
       }
       
       if (!isValidTime) {
         console.log(`Time validation failed for: "${timeValue}"`);
         errors.push(`Row ${row}: Start time must be in HH:MM format (e.g., 09:00 or 9:00)`);
       }
     }
     
     if (data['End Time*']) {
       const timeValue = data['End Time*'];
       console.log(`Validating end time: "${timeValue}" (type: ${typeof timeValue})`);
       
       let isValidTime = false;
       
       if (typeof timeValue === 'string') {
         // Handle string format (HH:MM)
         const timeRegex = /^([0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
         isValidTime = timeRegex.test(timeValue);
       } else if (typeof timeValue === 'number') {
         // Handle Excel decimal format (fraction of day)
         // Convert decimal to hours and validate
         const hours = timeValue * 24;
         const wholeHours = Math.floor(hours);
         const minutes = Math.round((hours - wholeHours) * 60);
         
         isValidTime = wholeHours >= 0 && wholeHours <= 23 && minutes >= 0 && minutes <= 59;
         console.log(`Converted decimal ${timeValue} to ${wholeHours}:${minutes.toString().padStart(2, '0')}`);
       }
       
       if (!isValidTime) {
         console.log(`Time validation failed for: "${timeValue}"`);
         errors.push(`Row ${row}: End time must be in HH:MM format (e.g., 17:00 or 5:00)`);
       }
     }
      
           // Day of week validation
     if (data['Day of Week*']) {
       const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
       const days = String(data['Day of Week*']).toLowerCase().split(',').map(d => d.trim());
       const invalidDays = days.filter(day => !validDays.includes(day));
       if (invalidDays.length > 0) {
         errors.push(`Row ${row}: Invalid day(s) in Day of Week: ${invalidDays.join(', ')}`);
       }
     }

             // Clinic name validation
       if (data['Clinic Name*']) {
         try {
           const realDataService = new RealDataService();
           const clinics = await realDataService.getClinics();
           const clinicName = String(data['Clinic Name*']).trim();
           const foundClinic = clinics.find(c => 
             c.name.toLowerCase() === clinicName.toLowerCase()
           );
           
           if (!foundClinic) {
             const clinicNames = clinics.map(c => c.name);
             errors.push(`Row ${row}: Invalid clinic name. Available clinics: ${clinicNames.join(', ')}`);
           }
         } catch (error) {
           errors.push(`Row ${row}: Unable to validate clinic name. Please try again.`);
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

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const data = await readExcelFile(file);
      const validationResults = await validateBulkData(data);
      
      if (validationResults.totalErrors > 0) {
        toast({
          title: "Validation errors found",
          description: `${validationResults.totalErrors} errors found. Please fix them and try again.`,
          variant: "destructive",
        });
        setImportResult({
          total: data.length,
          successful: 0,
          failed: data.length,
          errors: validationResults.errors,
          credentials: []
        });
        setIsProcessing(false);
        return;
      }

      // Show admin authentication dialog
      setShowAdminAuth(true);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error processing file",
        description: "Please check the file format and try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
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

    setIsProcessing(true);
    setAdminAuthError('');
    setProgress(0);

    try {
      // Re-read the file to get the data
      const file = fileInputRef.current?.files?.[0];
      if (!file) throw new Error('No file selected');

             const specialists = await readExcelFile(file);
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
           // Validate clinic name exists and get clinic ID
           const clinics = await realDataService.getClinics();
           const clinicName = specialist['Clinic Name*'].trim();
           const foundClinic = clinics.find(c => 
             c.name.toLowerCase() === clinicName.toLowerCase()
           );
           
           if (!foundClinic) {
             const clinicNames = clinics.map(c => c.name);
             throw new Error(`Clinic name "${clinicName}" not found. Available clinics: ${clinicNames.join(', ')}`);
           }

                       // Transform Excel data to expected format
            const transformedSpecialist = {
              firstName: String(specialist['First Name*'] || ''),
              middleName: String(specialist['Middle Name*'] || ''),
              lastName: String(specialist['Last Name*'] || ''),
              suffix: String(specialist['Suffix*'] || ''),
              email: String(specialist['Email*'] || ''),
              phone: String(specialist['Phone*'] || ''),
              dateOfBirth: String(specialist['Date of Birth*'] || ''),
              gender: String(specialist['Gender*'] || ''),
              civilStatus: String(specialist['Civil Status*'] || ''),
              address: String(specialist['Address*'] || ''),
              specialty: String(specialist['Specialty*'] || ''),
              medicalLicense: String(specialist['Medical License*'] || ''),
              prcId: String(specialist['PRC ID*'] || ''),
              prcExpiry: String(specialist['PRC Expiry*'] || ''),
              professionalFee: parseFloat(String(specialist['Professional Fee*'] || '0')),
                           schedules: [{
                practiceLocation: {
                  clinicId: foundClinic.id, // Save clinic's unique ID
                  roomOrUnit: String(specialist['Room/Unit*'] || '')
                },
                recurrence: {
                  dayOfWeek: String(specialist['Day of Week*'] || '').split(',').map((day: string) => day.trim().toLowerCase())
                },
                                 slotTemplate: {
                   startTime: (() => {
                     const timeValue = specialist['Start Time*'];
                     if (typeof timeValue === 'string') {
                       return timeValue;
                     } else if (typeof timeValue === 'number') {
                       // Convert Excel decimal format to HH:MM
                       const hours = timeValue * 24;
                       const wholeHours = Math.floor(hours);
                       const minutes = Math.round((hours - wholeHours) * 60);
                       return `${wholeHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                     }
                     return '';
                   })(),
                   endTime: (() => {
                     const timeValue = specialist['End Time*'];
                     if (typeof timeValue === 'string') {
                       return timeValue;
                     } else if (typeof timeValue === 'number') {
                       // Convert Excel decimal format to HH:MM
                       const hours = timeValue * 24;
                       const wholeHours = Math.floor(hours);
                       const minutes = Math.round((hours - wholeHours) * 60);
                       return `${wholeHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                     }
                     return '';
                   })()
                 },
                validFrom: String(specialist['Valid From*'] || ''),
               isActive: true,
               scheduleType: 'regular'
             }]
           };

           const { doctorId, temporaryPassword } = await realDataService.createDoctor(transformedSpecialist);
           results.successful++;
                       results.credentials.push({
              email: specialist['Email*'],
              password: temporaryPassword
            });
         } catch (error) {
           results.failed++;
           results.errors.push({
             row: i + 2,
             error: error instanceof Error ? error.message : 'Unknown error'
           });
         }
       }

      // Re-authenticate admin
      await authService.reauthenticateAdmin('admin@unihealth.ph', adminPassword);

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
    setShowAdminAuth(false);
    setAdminAuthError('');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        resetDialog();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Import Specialists
          </DialogTitle>
          <DialogDescription>
            Import multiple specialists using an Excel template. Download the template, fill in the data, and upload it back.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Step 1: Download Template
              </CardTitle>
              <CardDescription>
                Download the Excel template and fill in the specialist information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Excel Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Step 2: Upload Filled Template
              </CardTitle>
              <CardDescription>
                Upload the completed Excel file with specialist data
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
                disabled={isProcessing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Excel File
              </Button>
            </CardContent>
          </Card>

          {/* Progress */}
          {isProcessing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Processing...</h3>
                    <span className="text-sm text-muted-foreground">
                      {progress}% Complete
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importResult.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-600">Errors:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600">
                          Row {error.row}: {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importResult.credentials.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-600">Created Specialists:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResult.credentials.map((cred, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{cred.email}</span>
                          <span className="text-muted-foreground ml-2">Password: {cred.password}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Admin Authentication Dialog */}
          <Dialog open={showAdminAuth} onOpenChange={setShowAdminAuth}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Admin Authentication Required</DialogTitle>
                <DialogDescription>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Security Verification Required</p>
                        <p>
                          To create multiple specialist accounts, we need to verify your admin credentials. 
                          This ensures your session remains active after the import.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Admin Password
                        </label>
                        <input
                          type="password"
                          placeholder="Enter your admin password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAdminAuth();
                            }
                          }}
                          className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                        />
                      </div>
                      {adminAuthError && (
                        <div className="flex items-center space-x-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                          <XCircle className="h-4 w-4 flex-shrink-0" />
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
                  disabled={isProcessing || !adminPassword.trim()}
                  className="min-w-[120px]"
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Start Import'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 