'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, User, Users } from 'lucide-react';

interface EmergencyContactFormProps {
  formData: {
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  onFormDataChange: (field: string, value: any) => void;
}

export function EmergencyContactForm({ formData, onFormDataChange }: EmergencyContactFormProps) {
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
                Contact Name *
              </Label>
              <Input
                id="emergencyName"
                value={formData.emergencyContact.name}
                onChange={(e) => onFormDataChange('emergencyContact', {
                  ...formData.emergencyContact,
                  name: e.target.value
                })}
                placeholder="Enter contact name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Phone *
              </Label>
              <Input
                id="emergencyPhone"
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => onFormDataChange('emergencyContact', {
                  ...formData.emergencyContact,
                  phone: e.target.value
                })}
                placeholder="Enter contact phone"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyRelationship">Relationship *</Label>
              <Input
                id="emergencyRelationship"
                value={formData.emergencyContact.relationship}
                onChange={(e) => onFormDataChange('emergencyContact', {
                  ...formData.emergencyContact,
                  relationship: e.target.value
                })}
                placeholder="e.g., Spouse, Parent, Sibling"
                required
              />
            </div>
          </div>
        </div>

        {/* Additional Emergency Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyAddress">Contact Address (Optional)</Label>
              <Input
                id="emergencyAddress"
                placeholder="Enter contact address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyEmail">Contact Email (Optional)</Label>
              <Input
                id="emergencyEmail"
                type="email"
                placeholder="Enter contact email"
              />
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