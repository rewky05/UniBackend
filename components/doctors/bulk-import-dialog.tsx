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
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  civilStatus: 'single' | 'married' | 'divorced' | 'widowed';
  prcId: string;
  prcExpiry: string;
  specialty: string;
  subSpecialty?: string;
  yearsOfExperience: number;
  bio?: string;
  address?: string;
  professionalFee?: number;
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

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+639123456789',
        dateOfBirth: '1985-03-15',
        gender: 'male',
        civilStatus: 'married',
        prcId: '123456',
        prcExpiry: '2025-12-31',
        specialty: 'Cardiology',
        subSpecialty: 'Interventional Cardiology',
        yearsOfExperience: 10,
        bio: 'Experienced cardiologist with expertise in interventional procedures.',
        address: '123 Medical Center, Metro Manila',
        professionalFee: 2500
      },
      {
        firstName: 'Jane',
        middleName: '',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+639987654321',
        dateOfBirth: '1990-07-22',
        gender: 'female',
        civilStatus: 'single',
        prcId: '789012',
        prcExpiry: '2026-06-30',
        specialty: 'Pediatrics',
        subSpecialty: 'Neonatology',
        yearsOfExperience: 8,
        bio: 'Specialized in neonatal care and pediatric medicine.',
        address: '456 Children\'s Hospital, Quezon City',
        professionalFee: 2000
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Add headers
    const headers = [
      'firstName*',
      'middleName',
      'lastName*',
      'email*',
      'phone*',
      'dateOfBirth*',
      'gender*',
      'civilStatus*',
      'prcId*',
      'prcExpiry*',
      'specialty*',
      'subSpecialty',
      'yearsOfExperience*',
      'bio',
      'address',
      'professionalFee'
    ];

    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });

    // Set column widths
    const colWidths = [
      { wch: 15 }, // firstName
      { wch: 15 }, // middleName
      { wch: 15 }, // lastName
      { wch: 25 }, // email
      { wch: 15 }, // phone
      { wch: 12 }, // dateOfBirth
      { wch: 10 }, // gender
      { wch: 12 }, // civilStatus
      { wch: 10 }, // prcId
      { wch: 12 }, // prcExpiry
      { wch: 20 }, // specialty
      { wch: 25 }, // subSpecialty
      { wch: 8 },  // yearsOfExperience
      { wch: 40 }, // bio
      { wch: 30 }, // address
      { wch: 12 }  // professionalFee
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Specialists Template');

    // Create instructions sheet
    const instructions = [
      ['Instructions:'],
      ['1. Fill in the required fields marked with *'],
      ['2. Do not modify the column headers'],
      ['3. Use the exact format for dates (YYYY-MM-DD)'],
      ['4. Gender must be: male, female, or other'],
      ['5. Civil Status must be: single, married, divorced, or widowed'],
      ['6. Email addresses must be unique'],
      ['7. Phone numbers should include country code (+63 for Philippines)'],
      ['8. PRC ID must be unique'],
      ['9. Years of Experience should be a number'],
      ['10. Professional Fee should be a number (in PHP)'],
      [''],
      ['Required Fields:'],
      ['- firstName: First name of the specialist'],
      ['- lastName: Last name of the specialist'],
      ['- email: Unique email address'],
      ['- phone: Contact phone number'],
      ['- dateOfBirth: Date of birth (YYYY-MM-DD)'],
      ['- gender: male, female, or other'],
      ['- civilStatus: single, married, divorced, or widowed'],
      ['- prcId: PRC license number'],
      ['- prcExpiry: PRC expiry date (YYYY-MM-DD)'],
      ['- specialty: Medical specialty'],
      ['- yearsOfExperience: Number of years of experience'],
      [''],
      ['Optional Fields:'],
      ['- middleName: Middle name (if any)'],
      ['- subSpecialty: Sub-specialty area'],
      ['- bio: Professional biography'],
      ['- address: Practice address'],
      ['- professionalFee: Consultation fee in PHP']
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
  };

  const validateSpecialistData = (data: any, row: number): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender', 'civilStatus', 'prcId', 'prcExpiry', 'specialty', 'yearsOfExperience'];
    
    requiredFields.forEach(field => {
      if (!data[field] || data[field].toString().trim() === '') {
        errors.push(`Row ${row}: ${field} is required`);
      }
    });

    // Email validation
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push(`Row ${row}: Invalid email format`);
      }
    }

    // Phone validation
    if (data.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
        errors.push(`Row ${row}: Invalid phone number format`);
      }
    }

    // Date validation
    if (data.dateOfBirth) {
      const date = new Date(data.dateOfBirth);
      if (isNaN(date.getTime())) {
        errors.push(`Row ${row}: Invalid date format for dateOfBirth`);
      }
    }

    if (data.prcExpiry) {
      const date = new Date(data.prcExpiry);
      if (isNaN(date.getTime())) {
        errors.push(`Row ${row}: Invalid date format for prcExpiry`);
      }
    }

    // Gender validation
    if (data.gender && !['male', 'female', 'other'].includes(data.gender.toLowerCase())) {
      errors.push(`Row ${row}: Gender must be male, female, or other`);
    }

    // Civil status validation
    if (data.civilStatus && !['single', 'married', 'divorced', 'widowed'].includes(data.civilStatus.toLowerCase())) {
      errors.push(`Row ${row}: Civil status must be single, married, divorced, or widowed`);
    }

    // Years of experience validation
    if (data.yearsOfExperience) {
      const years = parseInt(data.yearsOfExperience);
      if (isNaN(years) || years < 0) {
        errors.push(`Row ${row}: Years of experience must be a positive number`);
      }
    }

    // Professional fee validation
    if (data.professionalFee) {
      const fee = parseFloat(data.professionalFee);
      if (isNaN(fee) || fee < 0) {
        errors.push(`Row ${row}: Professional fee must be a positive number`);
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
      const validationResults = validateBulkData(data);
      
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

  const validateBulkData = (data: SpecialistData[]) => {
    const errors: Array<{ row: number; error: string }> = [];
    let totalErrors = 0;

    data.forEach((specialist, index) => {
      const row = index + 2; // +2 because Excel is 1-indexed and we have headers
      const validation = validateSpecialistData(specialist, row);
      
      validation.errors.forEach(error => {
        errors.push({ row, error });
        totalErrors++;
      });
    });

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
          const { doctorId, temporaryPassword } = await realDataService.createDoctor(specialist);
          results.successful++;
          results.credentials.push({
            email: specialist.email,
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