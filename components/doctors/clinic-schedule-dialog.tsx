'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Building, Plus, Trash2, Calendar, Clock, MapPin, Check, ChevronsUpDown, Edit } from 'lucide-react';
import { cn, formatDateToText } from '@/lib/utils';
import type { SpecialistSchedule } from '@/app/doctors/add/page';
import { useRealClinics } from '@/hooks/useRealData';
import { ClinicsService } from '@/lib/services/schedules.service';
import { toast } from '@/hooks/use-toast';

interface ClinicScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSchedules: SpecialistSchedule[];
  onSave: (schedules: SpecialistSchedule[]) => void;
  specialistId?: string; // Add specialistId prop
  editingSchedule?: SpecialistSchedule | null; // Add editing schedule prop
  isEditMode?: boolean; // Add edit mode flag
}



const CLINIC_TYPES = ['hospital', 'multi_specialty_clinic', 'community_clinic', 'private_clinic'];
const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' }
];

export function ClinicScheduleDialog({ open, onOpenChange, existingSchedules, onSave, specialistId, editingSchedule, isEditMode }: ClinicScheduleDialogProps) {
  const [clinicSearchOpen, setClinicSearchOpen] = useState(false);
  const [clinicSearchValue, setClinicSearchValue] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [isNewClinic, setIsNewClinic] = useState(false);
  const [showClinicDialog, setShowClinicDialog] = useState(false);
  
  // Get real clinic data from Firebase
  const { clinics, loading: clinicsLoading } = useRealClinics();
  
  // Clinic creation form state
  const [clinicFormData, setClinicFormData] = useState({
    name: '',
    address: '',
    city: '',
    province: '',
    zipCode: '',
    email: '',
    phone: '',
    type: '' as 'hospital' | 'multi_specialty_clinic' | 'community_clinic' | 'private_clinic'
  });
  
  const clinicsService = new ClinicsService();
  

  
  // Fallback mapping for old hardcoded clinic IDs
  const clinicIdMapping: { [key: string]: string } = {
    'clin_cebu_central_id': 'Cebu Medical Center',
    'clin_cebu_doctors_id': 'Metro Cebu Hospital',
    'clin_lahug_uhc_id': 'Skin Care Clinic',
    'clin_perpetual_succour_id': 'Cebu Medical Center'
  };
  
  // Local state for managing schedule blocks during editing
  const [localSchedules, setLocalSchedules] = useState<SpecialistSchedule[]>([]);
  
  const [formData, setFormData] = useState({
    clinicId: '',
    roomOrUnit: '',
    dayOfWeek: [] as number[],
    startTime: '',
    endTime: '',
    slotDurationMinutes: 30,
    validFrom: '',
    isActive: true,
    newClinicDetails: {
      name: '',
      addressLine: '',
      contactNumber: '',
      type: ''
    }
  });

  // Helper function to test slotTemplate generation
  const testSlotTemplateGeneration = () => {
    // Test case: 8 AM to 10 AM with 30-minute slots
    const testStartTime = '08:00';
    const testEndTime = '10:00';
    const testDuration = 30;
    
    const startHour = parseInt(testStartTime.split(':')[0]);
    const startMinute = parseInt(testStartTime.split(':')[1]);
    const endHour = parseInt(testEndTime.split(':')[0]);
    const endMinute = parseInt(testEndTime.split(':')[1]);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    const testSlotTemplate: { [key: string]: { defaultStatus: string; durationMinutes: number } } = {};
    
    for (let time = startMinutes; time < endMinutes; time += testDuration) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      const time24h = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const time12h = convertTo12Hour(time24h);
      
      const slotEndTime = time + testDuration;
      if (slotEndTime <= endMinutes) {
        testSlotTemplate[time12h] = {
          defaultStatus: 'available',
          durationMinutes: testDuration
        };
      }
    }
    

    
    return testSlotTemplate;
  };

  // Initialize local schedules when dialog opens
  useEffect(() => {
    if (open) {
      if (isEditMode && editingSchedule) {
        // Edit mode: populate form with existing schedule data
        setLocalSchedules([editingSchedule]);
        
        // Find the clinic for the editing schedule
        const clinic = clinics.find(c => c.id === editingSchedule.practiceLocation?.clinicId);
        if (clinic) {
          setSelectedClinic(clinic);
          setClinicSearchValue(clinic.name);
        }
        
        // Populate form data with existing schedule
        setFormData({
          clinicId: editingSchedule.practiceLocation?.clinicId || '',
          roomOrUnit: editingSchedule.practiceLocation?.roomOrUnit || '',
          dayOfWeek: editingSchedule.recurrence?.dayOfWeek || [],
          startTime: '', // Will be calculated from slotTemplate
          endTime: '', // Will be calculated from slotTemplate
          slotDurationMinutes: getDurationFromSlotTemplate(editingSchedule.slotTemplate),
          validFrom: editingSchedule.validFrom || new Date().toISOString().split('T')[0],
          isActive: editingSchedule.isActive || true,
          newClinicDetails: {
            name: '',
            addressLine: '',
            contactNumber: '',
            type: ''
          }
        });
        
        // Calculate start and end times from slotTemplate
        const { startTime, endTime } = calculateTimeRangeFromSlotTemplate(editingSchedule.slotTemplate);
        setFormData(prev => ({
          ...prev,
          startTime,
          endTime
        }));
      } else {
        // Add mode: start with empty form
        setLocalSchedules([...existingSchedules]);
        resetForm();
      }
      
      // Test slotTemplate generation (for development only)
      testSlotTemplateGeneration();
    }
  }, [open, existingSchedules, isEditMode, editingSchedule, clinics]);

  // Helper function to convert 12-hour format to 24-hour format
  const convertTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = modifier === 'PM' ? '12' : '00';
    } else if (modifier === 'PM') {
      hours = (parseInt(hours) + 12).toString();
    } else {
      hours = hours.padStart(2, '0');
    }
    
    return `${hours}:${minutes}`;
  };

  // Helper function to convert 24-hour format to 12-hour format
  const convertTo12Hour = (time24h: string): string => {
    const [hours, minutes] = time24h.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Helper function to convert 12-hour format to 24-hour format
  const convert12HourTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = modifier === 'PM' ? '12' : '00';
    } else if (modifier === 'PM') {
      hours = (parseInt(hours) + 12).toString();
    } else {
      hours = hours.padStart(2, '0');
    }
    
    return `${hours}:${minutes}`;
  };

  // Helper function to calculate time range from slotTemplate
  const calculateTimeRangeFromSlotTemplate = (slotTemplate: any): { startTime: string; endTime: string } => {
    if (!slotTemplate || typeof slotTemplate !== 'object') {
      return { startTime: '', endTime: '' };
    }
    
    const timeSlots = Object.keys(slotTemplate).sort();
    if (timeSlots.length === 0) {
      return { startTime: '', endTime: '' };
    }
    
    const firstSlot = timeSlots[0];
    const lastSlot = timeSlots[timeSlots.length - 1];
    
    // Convert 12-hour format to 24-hour format for the time inputs
    const startTime = convert12HourTo24Hour(firstSlot);
    const endTime = convert12HourTo24Hour(lastSlot);
    
    // Add duration to end time
    const duration = getDurationFromSlotTemplate(slotTemplate);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const endMinutes = endHour * 60 + endMinute + duration;
    const finalEndHour = Math.floor(endMinutes / 60);
    const finalEndMinute = endMinutes % 60;
    const finalEndTime = `${finalEndHour.toString().padStart(2, '0')}:${finalEndMinute.toString().padStart(2, '0')}`;
    
    return { startTime, endTime: finalEndTime };
  };

  // Helper function to get duration from slotTemplate
  const getDurationFromSlotTemplate = (slotTemplate: any): number => {
    if (!slotTemplate || typeof slotTemplate !== 'object') {
      return 30;
    }
    const firstSlot = Object.values(slotTemplate)[0] as any;
    return firstSlot?.durationMinutes || 30;
  };

  // Helper function to format date consistently
  const formatDate = (dateString: string) => {
    return formatDateToText(dateString);
  };

  const resetForm = () => {
    setSelectedClinic(null);
    setIsNewClinic(false);
    setClinicSearchValue('');
    setFormData({
      clinicId: '',
      roomOrUnit: '',
      dayOfWeek: [],
      startTime: '',
      endTime: '',
      slotDurationMinutes: 30,
      validFrom: new Date().toISOString().split('T')[0],
      isActive: true,
      newClinicDetails: {
        name: '',
        addressLine: '',
        contactNumber: '',
        type: ''
      }
    });
  };

  const handleClinicSelect = (clinic: any) => {
    if (clinic) {
      setSelectedClinic(clinic);
      setIsNewClinic(false);
      setClinicSearchValue(clinic.name);
    }
    setClinicSearchOpen(false);
  };

  const handleNewClinicSelect = (name: string) => {
    setClinicSearchValue(name);
    setClinicFormData(prev => ({ ...prev, name }));
    setShowClinicDialog(true);
    setClinicSearchOpen(false);
  };

  const handleCreateClinic = async () => {
    try {
      // Validate required fields
      if (!clinicFormData.name || !clinicFormData.address || !clinicFormData.city || 
          !clinicFormData.province || !clinicFormData.zipCode || !clinicFormData.email || 
          !clinicFormData.phone || !clinicFormData.type) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Create the clinic
      const clinicId = await clinicsService.createClinic({
        ...clinicFormData,
        isActive: true
      });
      
      // Get the created clinic data
      const createdClinic = {
        id: clinicId,
        ...clinicFormData,
        isActive: true
      };

      // Set as selected clinic
      setSelectedClinic(createdClinic);
      setClinicSearchValue(createdClinic.name);
      setShowClinicDialog(false);
      
      // Reset form
      setClinicFormData({
        name: '',
        address: '',
        city: '',
        province: '',
        zipCode: '',
        email: '',
        phone: '',
        type: '' as 'hospital' | 'multi_specialty_clinic' | 'community_clinic' | 'private_clinic'
      });

      toast({
        title: "Clinic created successfully",
        description: `${createdClinic.name} has been added to the system.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error creating clinic:', error);
      toast({
        title: "Error creating clinic",
        description: "Failed to create clinic. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isClinicFormValid = () => {
    return clinicFormData.name.trim() && 
           clinicFormData.address.trim() && 
           clinicFormData.city.trim() && 
           clinicFormData.province.trim() && 
           clinicFormData.zipCode.trim() && 
           clinicFormData.email.trim() && 
           clinicFormData.phone.trim() && 
           clinicFormData.type;
  };

  const addScheduleBlock = () => {
    if (selectedClinic && 
        formData.roomOrUnit && 
        formData.dayOfWeek && formData.dayOfWeek.length > 0 &&
        formData.startTime && 
        formData.endTime && 
        formData.validFrom) {
      
      // Generate slot template from start/end times in 12-hour format
      const slotTemplate: { [key: string]: { defaultStatus: string; durationMinutes: number } } = {};
      
      // Parse start and end times (they come in 24-hour format from the time input)
      const startHour = parseInt(formData.startTime.split(':')[0]);
      const startMinute = parseInt(formData.startTime.split(':')[1]);
      const endHour = parseInt(formData.endTime.split(':')[0]);
      const endMinute = parseInt(formData.endTime.split(':')[1]);
      
      // Convert start and end times to minutes for easier calculation
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      // Generate time slots based on duration
      for (let time = startMinutes; time < endMinutes; time += formData.slotDurationMinutes) {
        const hour = Math.floor(time / 60);
        const minute = time % 60;
        const time24h = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const time12h = convertTo12Hour(time24h);
        
        // Only add slot if it doesn't exceed the end time
        const slotEndTime = time + formData.slotDurationMinutes;
        if (slotEndTime <= endMinutes) {
          slotTemplate[time12h] = {
            defaultStatus: 'available',
            durationMinutes: formData.slotDurationMinutes
          };
        }
      }
      
      if (isEditMode && editingSchedule) {
        // Edit mode: update the existing schedule
        const updatedSchedule: SpecialistSchedule = {
          ...editingSchedule,
          practiceLocation: {
            clinicId: selectedClinic?.id || '',
            roomOrUnit: formData.roomOrUnit
          },
          recurrence: {
            dayOfWeek: formData.dayOfWeek,
            type: 'weekly'
          },
          scheduleType: 'Weekly',
          slotTemplate: slotTemplate,
          validFrom: formData.validFrom,
          isActive: formData.isActive,
          lastUpdated: new Date().toISOString()
        };
        
        // Replace the existing schedule with the updated one
        setLocalSchedules([updatedSchedule]);
      } else {
        // Add mode: create new schedule with temporary ID for local state
        // The actual unique key will be generated when saving to Firebase
        const newSchedule: SpecialistSchedule = {
          id: `temp_${Date.now()}`, // Temporary ID for local state management
          specialistId: specialistId || 'temp_specialist_id',
          practiceLocation: {
            clinicId: selectedClinic?.id || '',
            roomOrUnit: formData.roomOrUnit
          },
          recurrence: {
            dayOfWeek: formData.dayOfWeek,
            type: 'weekly'
          },
          scheduleType: 'Weekly',
          slotTemplate: slotTemplate,
          validFrom: formData.validFrom,
          isActive: formData.isActive,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        // Add to local schedules instead of saving immediately
        setLocalSchedules(prev => [...prev, newSchedule]);
        
        // Reset form for next schedule block
        resetForm();
      }
    }
  };

  const removeScheduleBlock = (scheduleId: string) => {
    setLocalSchedules(prev => prev.filter(sch => sch.id && sch.id !== scheduleId));
  };

  const handleDayToggle = (dayValue: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dayOfWeek: checked 
        ? [...(prev.dayOfWeek || []), dayValue]
        : (prev.dayOfWeek || []).filter(d => d !== dayValue)
    }));
  };

  const getDayNames = (dayNumbers: number[]) => {
    if (!dayNumbers || !Array.isArray(dayNumbers)) {
      return 'No days specified';
    }
    return dayNumbers
      .sort()
      .map(num => DAYS_OF_WEEK.find(d => d.value === num)?.label)
      .filter(Boolean)
      .join(', ');
  };

  const handleSave = () => {
    // Save all local schedules at once
    onSave(localSchedules);
    onOpenChange(false);
  };

  const isFormValid = () => {
    // In edit mode, we always have at least one schedule (the one being edited)
    if (isEditMode) {
      return localSchedules.length > 0;
    }
    
    // Allow saving if there's at least one schedule block
    if (localSchedules.length > 0) {
      return true;
    }
    
    // If no schedule blocks yet, require form to be filled
    const hasClinic = selectedClinic || (isNewClinic && clinicSearchValue);
    const hasBasicInfo = formData.roomOrUnit && formData.dayOfWeek.length > 0 && formData.startTime && formData.endTime && formData.validFrom;
    
    return hasClinic && hasBasicInfo;
  };

  const isScheduleValid = () => {
    return selectedClinic && 
           !clinicsLoading &&
           formData.roomOrUnit && 
           formData.dayOfWeek && formData.dayOfWeek.length > 0 &&
           formData.startTime && 
           formData.endTime && 
           formData.validFrom;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Schedule Block' : 'Manage Schedule Blocks'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Edit the selected schedule block for this doctor. Make your changes and click "Save" when done.'
              : 'Add and manage multiple schedule blocks for this doctor. Click "Add Schedule Block" to add a new block, then "Save" when done.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Clinic Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Clinic Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Clinic *</Label>
                <Popover open={clinicSearchOpen} onOpenChange={setClinicSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clinicSearchOpen}
                      disabled={clinicsLoading}
                      className={cn(
                        "w-full justify-between",
                        !selectedClinic && "border-red-300 focus:border-red-500"
                      )}
                    >
                      {clinicsLoading ? "Loading clinics..." : clinicSearchValue || "Search or add clinic..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search clinics..." 
                        value={clinicSearchValue}
                        onValueChange={setClinicSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-2">
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => handleNewClinicSelect(clinicSearchValue)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add new clinic: &quot;{clinicSearchValue}&quot;
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {clinics
                            .filter(clinic => 
                              clinic.name.toLowerCase().includes(clinicSearchValue.toLowerCase())
                            )
                            .map((clinic) => (
                              <CommandItem
                                key={clinic.id}
                                onSelect={() => handleClinicSelect(clinic)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedClinic?.id === clinic.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div>
                                  <div className="font-medium">{clinic.name}</div>
                                  <div className="text-sm text-muted-foreground">{clinic.address}</div>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedClinic && (
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    <span>Selected: {selectedClinic.name}</span>
                  </div>
                )}
                {!selectedClinic && (
                  <div className="text-sm text-red-600">
                    Please select a clinic to continue
                  </div>
                )}
              </div>

              {/* New Clinic Details - Only show when adding new clinic */}
              {isNewClinic && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">New Clinic Details</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Clinic Name</Label>
                      <Input
                        placeholder="Enter clinic name"
                        value={formData.newClinicDetails.name}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          newClinicDetails: { ...prev.newClinicDetails, name: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Clinic Type</Label>
                      <Select 
                        value={formData.newClinicDetails.type} 
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          newClinicDetails: { ...prev.newClinicDetails, type: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select clinic type" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Hospital', 'Clinic', 'Medical Center', 'Specialty Center'].map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Schedule Configuration
              </CardTitle>
              <CardDescription>
                Add new schedule blocks for this doctor. Each block represents a different clinic or time slot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Show existing schedules */}
              {localSchedules.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Current Schedule Blocks ({localSchedules.length})</h4>
                  {localSchedules.map((schedule, index) => (
                    <div key={schedule.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium">Schedule Block {index + 1}</h5>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => schedule.id && removeScheduleBlock(schedule.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                                             <div className="grid gap-2 text-sm">
                         <div><strong>Clinic:</strong> {
                           (() => {
                             const clinic = clinics.find(c => c.id === schedule.practiceLocation?.clinicId);
                             
                             if (clinic) {
                               return clinic.name;
                             } else if (schedule.practiceLocation?.clinicId && clinicIdMapping[schedule.practiceLocation.clinicId]) {
                               return clinicIdMapping[schedule.practiceLocation.clinicId];
                             } else {
                               return `Unknown Clinic (ID: ${schedule.practiceLocation?.clinicId})`;
                             }
                           })()
                         }</div>
                         <div><strong>Room:</strong> {schedule.practiceLocation?.roomOrUnit || 'Not specified'}</div>
                         <div><strong>Days:</strong> {getDayNames(schedule.recurrence?.dayOfWeek || [])}</div>
                         <div><strong>Time Slots:</strong> {Object.keys(schedule.slotTemplate || {}).length} slots</div>
                                                   <div><strong>Valid From:</strong> {schedule.validFrom ? formatDateToText(schedule.validFrom) : 'Not set'}</div>
                       </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new schedule block */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">{isEditMode ? 'Edit Schedule Block' : 'Add New Schedule Block'}</h4>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Room/Unit</Label>
                    <Input
                      placeholder="e.g., Cardiology Clinic, Rm 501"
                      value={formData.roomOrUnit || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, roomOrUnit: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid From</Label>
                    <Input
                      type="date"
                      value={formData.validFrom || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={(formData.dayOfWeek || []).includes(day.value)}
                          onCheckedChange={(checked) => handleDayToggle(day.value, checked as boolean)}
                        />
                        <Label htmlFor={`day-${day.value}`} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={formData.startTime || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={formData.endTime || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slot Duration (minutes)</Label>
                    <Select 
                      value={formData.slotDurationMinutes?.toString() || '30'} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, slotDurationMinutes: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={addScheduleBlock} 
                  disabled={!isScheduleValid()}
                  className="w-full"
                >
                  {isEditMode ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Schedule Block
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add This Schedule Block
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid()}>
            {isEditMode ? 'Save Changes' : 'Save All Schedule Blocks'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Clinic Creation Dialog */}
      <Dialog open={showClinicDialog} onOpenChange={setShowClinicDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Clinic</DialogTitle>
            <DialogDescription>
              Add a new clinic to the system. All fields are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-name">Clinic Name *</Label>
                <Input
                  id="clinic-name"
                  value={clinicFormData.name}
                  onChange={(e) => setClinicFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter clinic name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clinic-type">Clinic Type *</Label>
                <Select value={clinicFormData.type} onValueChange={(value) => setClinicFormData(prev => ({ ...prev, type: value as any }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select clinic type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">Hospital</SelectItem>
                    <SelectItem value="multi_specialty_clinic">Multi-Specialty Clinic</SelectItem>
                    <SelectItem value="community_clinic">Community Clinic</SelectItem>
                    <SelectItem value="private_clinic">Private Clinic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinic-address">Address *</Label>
              <Input
                id="clinic-address"
                value={clinicFormData.address}
                onChange={(e) => setClinicFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter complete address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-city">City *</Label>
                <Input
                  id="clinic-city"
                  value={clinicFormData.city}
                  onChange={(e) => setClinicFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clinic-province">Province *</Label>
                <Input
                  id="clinic-province"
                  value={clinicFormData.province}
                  onChange={(e) => setClinicFormData(prev => ({ ...prev, province: e.target.value }))}
                  placeholder="Enter province"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clinic-zipcode">Zip Code *</Label>
                <Input
                  id="clinic-zipcode"
                  value={clinicFormData.zipCode}
                  onChange={(e) => setClinicFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="Enter zip code"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-email">Email *</Label>
                <Input
                  id="clinic-email"
                  type="email"
                  value={clinicFormData.email}
                  onChange={(e) => setClinicFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clinic-phone">Phone *</Label>
                <Input
                  id="clinic-phone"
                  value={clinicFormData.phone}
                  onChange={(e) => setClinicFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClinicDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateClinic} disabled={!isClinicFormValid()}>
              Create Clinic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}