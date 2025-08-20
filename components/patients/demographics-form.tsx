'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DemographicsData {
  gender: string;
}

interface DemographicsFormProps {
  data: any;
  onUpdate: (data: any) => void;
  disabled?: boolean;
}

export function DemographicsForm({ data, onUpdate, disabled }: DemographicsFormProps) {
  // Reset internal state when demographics data is cleared
  useEffect(() => {
    // If gender field is empty, clear any internal state
    const isFormEmpty = !data?.gender;
    if (isFormEmpty) {
      // Reset any internal state here if needed
      // For now, the form is controlled by props, so no internal state to reset
    }
  }, [data?.gender]);

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
        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
          <Select value={data.gender} onValueChange={(value) => onUpdate({ gender: value })} disabled={disabled}>
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
      </CardContent>
    </Card>
  );
} 