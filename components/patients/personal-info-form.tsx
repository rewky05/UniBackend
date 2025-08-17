'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, Calendar, MapPin, Heart, AlertTriangle, GraduationCap } from 'lucide-react';

interface PersonalInfoFormProps {
  data?: any;
  onUpdate?: (data: any) => void;
  disabled?: boolean;
}

export function PersonalInfoForm({ data, onUpdate, disabled }: PersonalInfoFormProps) {

  const handleInputChange = (field: string, value: any) => {
    if (onUpdate) {
      onUpdate({ [field]: value });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Enter the patient's basic personal information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
            <Input
              id="firstName"
              value={data?.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter first name"
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name <span className="text-destructive">*</span></Label>
            <Input
              id="middleName"
              value={data?.middleName || ''}
              onChange={(e) => handleInputChange('middleName', e.target.value)}
              placeholder="Enter middle name"
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
            <Input
              id="lastName"
              value={data?.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Enter last name"
              required
              disabled={disabled}
            />
          </div>
        </div>

        {/* Date of Birth and Gender */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date of Birth <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={data?.dateOfBirth || ''}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
            <Select value={data?.gender || ''} onValueChange={(value) => handleInputChange('gender', value)} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Educational Attainment */}
        <div className="space-y-2">
          <Label htmlFor="educationalAttainment" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Educational Attainment
          </Label>
          <Select
            value={data?.educationalAttainment || ''}
            onValueChange={(value) => handleInputChange('educationalAttainment', value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select educational attainment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elementary">Elementary</SelectItem>
              <SelectItem value="junior-high-school">Junior High School</SelectItem>
              <SelectItem value="senior-high-school">Senior High School</SelectItem>
              <SelectItem value="vocational">Vocational</SelectItem>
              <SelectItem value="associate-degree">Associate Degree</SelectItem>
              <SelectItem value="bachelors-degree">Bachelor's Degree</SelectItem>
              <SelectItem value="masters-degree">Master's Degree</SelectItem>
              <SelectItem value="doctorate">Doctorate</SelectItem>
              <SelectItem value="post-graduate">Post Graduate</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Address <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="address"
            value={data?.address || ''}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Enter complete address (e.g., 123 Main St, Cebu City, Cebu, 6000)"
            rows={3}
            disabled={disabled}
          />
        </div>





      </CardContent>
    </Card>
  );
} 