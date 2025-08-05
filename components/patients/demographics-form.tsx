'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Heart, MapPin, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface DemographicsFormProps {
  formData: {
    dateOfBirth: string;
    gender: string;
    bloodType: string;
    address: string;
    allergies: string[];
    medicalConditions: string[];
  };
  onFormDataChange: (field: string, value: any) => void;
}

export function DemographicsForm({ formData, onFormDataChange }: DemographicsFormProps) {
  const [allergiesInput, setAllergiesInput] = useState('');
  const [medicalConditionsInput, setMedicalConditionsInput] = useState('');

  const handleAllergiesChange = (value: string) => {
    const allergies = value.split(',').map(item => item.trim()).filter(item => item);
    onFormDataChange('allergies', allergies);
  };

  const handleMedicalConditionsChange = (value: string) => {
    const conditions = value.split(',').map(item => item.trim()).filter(item => item);
    onFormDataChange('medicalConditions', conditions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Demographics
        </CardTitle>
        <CardDescription>
          Enter the patient's demographic and medical information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date of Birth and Gender */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date of Birth *
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => onFormDataChange('dateOfBirth', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select value={formData.gender} onValueChange={(value) => onFormDataChange('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Blood Type */}
        <div className="space-y-2">
          <Label htmlFor="bloodType" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Blood Type
          </Label>
          <Select value={formData.bloodType} onValueChange={(value) => onFormDataChange('bloodType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select blood type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="AB+">AB+</SelectItem>
              <SelectItem value="AB-">AB-</SelectItem>
              <SelectItem value="O+">O+</SelectItem>
              <SelectItem value="O-">O-</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Address
          </Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => onFormDataChange('address', e.target.value)}
            placeholder="Enter complete address"
            rows={3}
          />
        </div>

        {/* Medical Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="allergies" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Allergies
            </Label>
            <Input
              id="allergies"
              value={allergiesInput}
              onChange={(e) => setAllergiesInput(e.target.value)}
              onBlur={() => handleAllergiesChange(allergiesInput)}
              placeholder="Enter allergies separated by commas"
            />
            {formData.allergies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalConditions">Medical Conditions</Label>
            <Input
              id="medicalConditions"
              value={medicalConditionsInput}
              onChange={(e) => setMedicalConditionsInput(e.target.value)}
              onBlur={() => handleMedicalConditionsChange(medicalConditionsInput)}
              placeholder="Enter medical conditions separated by commas"
            />
            {formData.medicalConditions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.medicalConditions.map((condition, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {condition}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 