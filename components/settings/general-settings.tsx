'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface GeneralSettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

interface GeneralSettingsData {
  systemName: string;
  defaultTimezone: string;
  defaultCurrency: string;
  enablePatientFeedback: boolean;
  defaultAppointmentDuration: number;
  appointmentDurationUnit: string;
}

const TIMEZONES = [
  { value: 'Asia/Manila', label: 'Asia/Manila (GMT+8)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong Kong (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
  { value: 'UTC', label: 'UTC (GMT+0)' }
];

const CURRENCIES = [
  { value: 'PHP', label: 'PHP (Philippine Peso)' },
  { value: 'USD', label: 'USD (US Dollar)' },
  { value: 'EUR', label: 'EUR (Euro)' },
  { value: 'SGD', label: 'SGD (Singapore Dollar)' }
];

const DURATION_UNITS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' }
];

export function GeneralSettings({ onUnsavedChanges }: GeneralSettingsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [originalData, setOriginalData] = useState<GeneralSettingsData | null>(null);
  
  // Confirmation dialog state
  const [saveDialog, setSaveDialog] = useState(false);
  const [formData, setFormData] = useState<GeneralSettingsData>({
    systemName: 'UniHealth Philippines',
    defaultTimezone: 'Asia/Manila',
    defaultCurrency: 'PHP',
    enablePatientFeedback: true,
    defaultAppointmentDuration: 30,
    appointmentDurationUnit: 'minutes'
  });

  useEffect(() => {
    // Load initial data (would be from Firebase in real implementation)
    const loadSettings = async () => {
      // Simulate API call
      const data = {
        systemName: 'UniHealth Philippines',
        defaultTimezone: 'Asia/Manila',
        defaultCurrency: 'PHP',
        enablePatientFeedback: true,
        defaultAppointmentDuration: 30,
        appointmentDurationUnit: 'minutes'
      };
      setFormData(data);
      setOriginalData(data);
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (originalData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
      onUnsavedChanges(hasChanges);
    }
  }, [formData, originalData, onUnsavedChanges]);

  const handleInputChange = (field: keyof GeneralSettingsData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    setSaveDialog(true);
  };

  const confirmSave = async () => {
    setIsSaving(true);
    
    try {
      // Simulate API call to Firebase
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setOriginalData(formData);
      onUnsavedChanges(false);
      
      toast({
        title: "Settings saved",
        description: "General system settings have been updated successfully.",
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
    <>
      <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          General System Settings
        </CardTitle>
        <CardDescription>
          Configure global parameters that affect the entire UniHealth platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Identity */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            System Identity
          </h4>
          <div className="space-y-2">
            <Label htmlFor="systemName">System Name</Label>
            <Input
              id="systemName"
              placeholder="Enter system name"
              value={formData.systemName}
              onChange={(e) => handleInputChange('systemName', e.target.value)}
            />
          </div>
        </div>

        {/* Regional Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Regional Settings
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Default Timezone</Label>
              <Select
                value={formData.defaultTimezone}
                onValueChange={(value) => handleInputChange('defaultTimezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((timezone) => (
                    <SelectItem key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select
                value={formData.defaultCurrency}
                onValueChange={(value) => handleInputChange('defaultCurrency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Feature Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Feature Settings
          </h4>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="patientFeedback" className="text-base font-medium">
                Enable Patient Feedback
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow patients to submit feedback and ratings for doctors
              </p>
            </div>
            <Switch
              id="patientFeedback"
              checked={formData.enablePatientFeedback}
              onCheckedChange={(checked) => handleInputChange('enablePatientFeedback', checked)}
            />
          </div>
        </div>

        {/* Appointment Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Appointment Settings
          </h4>
          <div className="space-y-2">
            <Label>Default Appointment Duration</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                min="1"
                max="480"
                value={formData.defaultAppointmentDuration}
                onChange={(e) => handleInputChange('defaultAppointmentDuration', parseInt(e.target.value) || 30)}
                className="w-24"
              />
              <Select
                value={formData.appointmentDurationUnit}
                onValueChange={(value) => handleInputChange('appointmentDurationUnit', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
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

    {/* Confirmation Dialog */}
    <ConfirmationDialog
      open={saveDialog}
      onOpenChange={setSaveDialog}
      title="Save System Settings"
      description="Are you sure you want to save these changes? This will update the system configuration and may affect how the platform operates."
      confirmText="Save Changes"
      cancelText="Cancel"
      variant="default"
      loading={isSaving}
      onConfirm={confirmSave}
    />
    </>
  );
}