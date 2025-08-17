'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { settingsService } from '@/lib/services/settings.service';
import { SystemSettings } from '@/lib/types/database';
import { useAuth } from '@/hooks/useAuth';

interface GeneralSettingsProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
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
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [originalData, setOriginalData] = useState<SystemSettings | null>(null);
  
  // Confirmation dialog state
  const [saveDialog, setSaveDialog] = useState(false);
  const [formData, setFormData] = useState<SystemSettings>({
    defaultAppointmentDuration: 30,
    appointmentDurationUnit: 'minutes'
  });

  useEffect(() => {
    // Load initial data from Firebase
    const loadSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        setFormData(data);
        setOriginalData(data);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error loading settings",
          description: "Failed to load system settings. Using default values.",
          variant: "destructive",
        });
      }
    };

    loadSettings();
  }, [toast]);

  useEffect(() => {
    if (originalData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
      onUnsavedChanges(hasChanges);
    }
  }, [formData, originalData, onUnsavedChanges]);

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
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
      const reviewerId = (user as any)?.uid || 'current-user';
      
      await settingsService.updateSettings({
        defaultAppointmentDuration: formData.defaultAppointmentDuration,
        appointmentDurationUnit: formData.appointmentDurationUnit
      }, reviewerId);
      
      setOriginalData(formData);
      onUnsavedChanges(false);
      
      toast({
        title: "Settings saved",
        description: "Appointment duration settings have been updated successfully.",
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
        {/* System Identity - Read Only */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            System Identity
          </h4>
          <div className="space-y-2">
            <Label htmlFor="systemName">System Name</Label>
            <div className="px-3 py-2 bg-background border border-input rounded-md text-sm">
              UniHealth Philippines
            </div>
          </div>
        </div>

        {/* Regional Settings - Read Only */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Regional Settings
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Default Timezone</Label>
              <div className="px-3 py-2 bg-background border border-input rounded-md text-sm">
                Asia/Manila (GMT+8)
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <div className="px-3 py-2 bg-background border border-input rounded-md text-sm">
                PHP (Philippine Peso)
              </div>
            </div>
          </div>
        </div>

        {/* Feature Settings - Read Only */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Feature Settings
          </h4>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
            <div className="space-y-1">
              <Label htmlFor="patientFeedback" className="text-base font-medium">
                Enable Patient Feedback
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow patients to submit feedback and ratings for doctors
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">Enabled</span>
            </div>
          </div>
        </div>

        {/* Appointment Settings - Editable */}
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
            <p className="text-sm text-muted-foreground">
              This duration will be used as the default when creating new schedule blocks.
            </p>
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