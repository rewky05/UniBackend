'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, FileText } from 'lucide-react';

interface ProfessionalDetailsData {
  specialty: string;
  subSpecialty: string;
  medicalLicense: string;
  prcId: string;
  prcExpiry: string;
  professionalFee: number; // Professional fee in Philippine pesos
}

interface ProfessionalDetailsFormProps {
  data: ProfessionalDetailsData;
  onUpdate: (data: Partial<ProfessionalDetailsData>) => void;
}

const SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Emergency Medicine',
  'Family Medicine',
  'Internal Medicine',
  'Neurology',
  'Obstetrics and Gynecology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Urology'
];

export function ProfessionalDetailsForm({ data, onUpdate }: ProfessionalDetailsFormProps) {
  const handleInputChange = (field: keyof ProfessionalDetailsData, value: string) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Specialization */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Medical Specialization
          </CardTitle>
          <CardDescription>
            Define the doctor&apos;s area of expertise and specialization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="specialty">
                Primary Specialty <span className="text-destructive">*</span>
              </Label>
              <Select value={data.specialty || undefined} onValueChange={(value) => handleInputChange('specialty', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary specialty" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subSpecialty">Sub-Specialty (Optional)</Label>
              <Input
                id="subSpecialty"
                placeholder="e.g., Interventional Cardiology"
                value={data.subSpecialty || undefined}
                onChange={(e) => handleInputChange('subSpecialty', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licenses & Credentials */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Professional Licenses & IDs
          </CardTitle>
          <CardDescription>
            Enter the doctor&apos;s professional license numbers and credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medicalLicense">
              Medical License Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="medicalLicense"
              placeholder="ML-123456789"
              value={data.medicalLicense || undefined}
              onChange={(e) => handleInputChange('medicalLicense', e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prcId">
                PRC ID Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prcId"
                placeholder="PRC-123456"
                value={data.prcId || undefined}
                onChange={(e) => handleInputChange('prcId', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prcExpiry">
                PRC Expiry Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prcExpiry"
                type="date"
                value={data.prcExpiry || undefined}
                onChange={(e) => handleInputChange('prcExpiry', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="professionalFee">
              Professional Fee (₱) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="professionalFee"
              type="number"
              placeholder="e.g., 2500"
              value={data.professionalFee || undefined}
              onChange={(e) => handleInputChange('professionalFee', parseFloat(e.target.value) || 0)}
              min="0"
              step="100"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the consultation fee in Philippine pesos
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> All license numbers and credentials will be verified during the approval process. 
              Please ensure all information is accurate and up-to-date.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}