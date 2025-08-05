'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, Save, Loader2, Clock, Phone, Mail, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface ClinicSpecificSettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

interface OperatingHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

interface ClinicSettings {
  operatingHours: OperatingHours;
  contactEmail: string;
  phoneNumber: string;
  servicesOffered: string[];
  defaultGeneralist: string;
}

const mockClinics = [
  { id: 'clinic_1', name: 'UniHealth Central Clinic' },
  { id: 'clinic_2', name: 'Cebu Doctors\' University Hospital' },
  { id: 'clinic_3', name: 'Lahug Urban Health Center' },
  { id: 'clinic_4', name: 'Perpetual Succour Hospital' }
];

const mockServices = [
  { id: 'general_consultation', name: 'General Consultation' },
  { id: 'pediatrics', name: 'Pediatrics' },
  { id: 'cardiology', name: 'Cardiology' },
  { id: 'dermatology', name: 'Dermatology' },
  { id: 'orthopedics', name: 'Orthopedics' },
  { id: 'neurology', name: 'Neurology' },
  { id: 'laboratory', name: 'Laboratory Tests' },
  { id: 'imaging', name: 'Medical Imaging' }
];

const mockDoctors = [
  { id: 'doc_1', name: 'Dr. Maria Santos' },
  { id: 'doc_2', name: 'Dr. Juan Rodriguez' },
  { id: 'doc_3', name: 'Dr. Ana Villanueva' }
];

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

const defaultOperatingHours: OperatingHours = {
  monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
  tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
  wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
  thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
  friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
  saturday: { isOpen: true, openTime: '08:00', closeTime: '12:00' },
  sunday: { isOpen: false, openTime: '08:00', closeTime: '17:00' }
};

export function ClinicSpecificSettings({ onUnsavedChanges }: ClinicSpecificSettingsProps) {
  const { toast } = useToast();
  const [selectedClinic, setSelectedClinic] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [originalData, setOriginalData] = useState<ClinicSettings | null>(null);
  const [formData, setFormData] = useState<ClinicSettings>({
    operatingHours: defaultOperatingHours,
    contactEmail: '',
    phoneNumber: '',
    servicesOffered: [],
    defaultGeneralist: ''
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingClinic, setPendingClinic] = useState<string | null>(null);

  useEffect(() => {
    if (selectedClinic) {
      // Load clinic-specific data (would be from Firebase in real implementation)
      const loadClinicSettings = async () => {
        // Simulate API call
        const data: ClinicSettings = {
          operatingHours: defaultOperatingHours,
          contactEmail: 'info@unihealth.ph',
          phoneNumber: '+63 32 123 4567',
          servicesOffered: ['general_consultation', 'pediatrics', 'cardiology'],
          defaultGeneralist: 'doc_1'
        };
        setFormData(data);
        setOriginalData(data);
      };

      loadClinicSettings();
    }
  }, [selectedClinic]);

  useEffect(() => {
    if (originalData && selectedClinic) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
      onUnsavedChanges(hasChanges);
    }
  }, [formData, originalData, selectedClinic, onUnsavedChanges]);

  const handleClinicSelect = (clinicId: string) => {
    if (originalData && JSON.stringify(formData) !== JSON.stringify(originalData)) {
      setPendingClinic(clinicId);
      setShowConfirmDialog(true);
      return;
    }
    setSelectedClinic(clinicId);
  };

  const confirmClinicChange = () => {
    if (pendingClinic) {
      setSelectedClinic(pendingClinic);
      setPendingClinic(null);
    }
    setShowConfirmDialog(false);
  };

  const cancelClinicChange = () => {
    setPendingClinic(null);
    setShowConfirmDialog(false);
  };

  const handleOperatingHoursChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: checked
        ? [...prev.servicesOffered, serviceId]
        : prev.servicesOffered.filter(id => id !== serviceId)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Simulate API call to Firebase
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setOriginalData(formData);
      onUnsavedChanges(false);
      
      toast({
        title: "Clinic settings saved",
        description: "Clinic-specific settings have been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (originalData) {
      setFormData(originalData);
    }
  };

  const hasChanges = originalData && JSON.stringify(formData) !== JSON.stringify(originalData);

  return (
    <div className="space-y-6">
      {/* Clinic Selector */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Clinic-Specific Settings
          </CardTitle>
          <CardDescription>
            Configure operational details and services for individual clinics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="clinicSelect">Select Clinic</Label>
            <Select value={selectedClinic} onValueChange={handleClinicSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a clinic to configure..." />
              </SelectTrigger>
              <SelectContent>
                {mockClinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clinic Settings Content */}
      {selectedClinic && (
        <div className="space-y-6">
          {/* Operating Hours */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Operating Hours
              </CardTitle>
              <CardDescription>
                Configure clinic hours for each day of the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {daysOfWeek.map((day) => (
                  <div key={day.key} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="w-24">
                      <Checkbox
                        id={`${day.key}-open`}
                        checked={formData.operatingHours[day.key]?.isOpen || false}
                        onCheckedChange={(checked) => 
                          handleOperatingHoursChange(day.key, 'isOpen', checked)
                        }
                      />
                      <Label htmlFor={`${day.key}-open`} className="ml-2 font-medium">
                        {day.label}
                      </Label>
                    </div>
                    
                    {formData.operatingHours[day.key]?.isOpen && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={formData.operatingHours[day.key]?.openTime || '08:00'}
                          onChange={(e) => 
                            handleOperatingHoursChange(day.key, 'openTime', e.target.value)
                          }
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={formData.operatingHours[day.key]?.closeTime || '17:00'}
                          onChange={(e) => 
                            handleOperatingHoursChange(day.key, 'closeTime', e.target.value)
                          }
                          className="w-32"
                        />
                      </div>
                    )}
                    
                    {!formData.operatingHours[day.key]?.isOpen && (
                      <span className="text-muted-foreground italic">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Configure clinic contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Clinic Contact Email
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="clinic@unihealth.ph"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Clinic Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+63 32 123 4567"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services & Staff Defaults */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Services & Staff Defaults
              </CardTitle>
              <CardDescription>
                Configure available services and default staff assignments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Services Offered */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Services Offered</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  {mockServices.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={formData.servicesOffered.includes(service.id)}
                        onCheckedChange={(checked) => 
                          handleServiceToggle(service.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={service.id}>{service.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Default Generalist */}
              <div className="space-y-2">
                <Label htmlFor="defaultGeneralist">Default Generalist</Label>
                <Select 
                  value={formData.defaultGeneralist} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, defaultGeneralist: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default generalist doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDoctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="card-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges || isSaving}
                >
                  Reset Changes
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="min-w-32"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to switch clinics?"
        confirmText="Switch Clinic"
        cancelText="Stay"
        variant="destructive"
        loading={false}
        onConfirm={confirmClinicChange}
        onCancel={cancelClinicChange}
      />
    </div>
  );
}