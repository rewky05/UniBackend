'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Heart } from 'lucide-react';
import { useState } from 'react';

interface DemographicsData {
  dateOfBirth: string;
  gender: string;
}

interface DemographicsFormProps {
  data: DemographicsData;
  onUpdate: (data: Partial<DemographicsData>) => void;
}

export function DemographicsForm({ data, onUpdate }: DemographicsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Demographics
        </CardTitle>
        <CardDescription>
          Enter the patient's demographic information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
              value={data.dateOfBirth}
              onChange={(e) => onUpdate({ dateOfBirth: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
            <Select value={data.gender} onValueChange={(value) => onUpdate({ gender: value })}>
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
      </CardContent>
    </Card>
  );
} 