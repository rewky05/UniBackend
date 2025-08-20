'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, User, Users } from 'lucide-react';

interface EmergencyContactData {
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface EmergencyContactFormProps {
  data: any;
  onUpdate: (data: any) => void;
  disabled?: boolean;
}

export function EmergencyContactForm({ data, onUpdate, disabled }: EmergencyContactFormProps) {
  // Reset internal state when emergency contact data is cleared
  useEffect(() => {
    // If all emergency contact fields are empty, clear any internal state
    const isFormEmpty = !data?.emergencyContact?.name && !data?.emergencyContact?.phone && !data?.emergencyContact?.relationship;
    if (isFormEmpty) {
      // Reset any internal state here if needed
      // For now, the form is controlled by props, so no internal state to reset
    }
  }, [data?.emergencyContact?.name, data?.emergencyContact?.phone, data?.emergencyContact?.relationship]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Emergency Contact
        </CardTitle>
        <CardDescription>
          Enter the patient's emergency contact information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Emergency Contact Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emergencyName"
                value={data.emergencyContact.name}
                onChange={(e) => onUpdate({
                  emergencyContact: {
                    ...data.emergencyContact,
                    name: e.target.value
                  }
                })}
                placeholder="Enter contact name"
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emergencyPhone"
                type="tel"
                value={data.emergencyContact.phone}
                onChange={(e) => onUpdate({
                  emergencyContact: {
                    ...data.emergencyContact,
                    phone: e.target.value
                  }
                })}
                placeholder="Enter contact phone"
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyRelationship" className="flex items-center gap-2 h-4 w-4">
                Relationship <span className="text-destructive">*</span></Label>
              <Select
                value={data.emergencyContact.relationship}
                onValueChange={(value) => onUpdate({
                  emergencyContact: {
                    ...data.emergencyContact,
                    relationship: value
                  }
                })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="grandparent">Grandparent</SelectItem>
                  <SelectItem value="uncle-aunt">Uncle/Aunt</SelectItem>
                  <SelectItem value="cousin">Cousin</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Emergency Contact Notes */}
        <div className="space-y-2">
          <Label htmlFor="emergencyNotes">Additional Notes</Label>
          <textarea
            id="emergencyNotes"
            className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
            placeholder="Any additional information about the emergency contact..."
          />
        </div>
      </CardContent>
    </Card>
  );
} 