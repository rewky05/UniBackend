'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, Calendar, MapPin, Heart, AlertTriangle } from 'lucide-react';

interface PersonalInfoFormProps {
  formData: {
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  onFormDataChange: (field: string, value: any) => void;
}

export function PersonalInfoForm({ formData, onFormDataChange }: PersonalInfoFormProps) {

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
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => onFormDataChange('firstName', e.target.value)}
              placeholder="Enter first name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              value={formData.middleName}
              onChange={(e) => onFormDataChange('middleName', e.target.value)}
              placeholder="Enter middle name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => onFormDataChange('lastName', e.target.value)}
              placeholder="Enter last name"
              required
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onFormDataChange('email', e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => onFormDataChange('phone', e.target.value)}
              placeholder="Enter phone number"
              required
            />
          </div>
        </div>


      </CardContent>
    </Card>
  );
} 