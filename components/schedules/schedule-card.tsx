"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Edit, Trash2, Clock, MapPin, Building } from "lucide-react";
import { ClinicScheduleDialog } from "../doctors/clinic-schedule-dialog";
import { useRealClinics } from "@/hooks/useRealData";
import { formatDateToText } from "@/lib/utils";

export interface SpecialistSchedule {
  id?: string;
  specialistId: string;
  createdAt?: string;
  isActive: boolean;
  lastUpdated?: string;
  practiceLocation: {
    clinicId: string;
    roomOrUnit: string;
  };
  recurrence: {
    dayOfWeek: number[];
    type: string;
  };
  scheduleType: string;
  slotTemplate: {
    [timeSlot: string]: {
      defaultStatus: string;
      durationMinutes: number;
    };
  };
  validFrom: string;
}

interface ScheduleCardProps {
  schedules: SpecialistSchedule[];
  onScheduleAdd: (schedule: Omit<SpecialistSchedule, "id">) => void;
  onScheduleEdit: (schedule: SpecialistSchedule) => void;
  onScheduleDelete: (scheduleId: string) => void;
  specialistId?: string; // Add specialistId prop
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' }
];

export function ScheduleCard({
  schedules,
  onScheduleAdd,
  onScheduleEdit,
  onScheduleDelete,
  specialistId,
}: ScheduleCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<SpecialistSchedule | null>(null);
  
  // Get clinics data for clinic name lookup
  const { clinics, loading: clinicsLoading } = useRealClinics();

  // Function to get clinic name from clinic ID
  const getClinicName = (clinicId: string) => {
    if (clinicsLoading) {
      return 'Loading...';
    }
    
    // Fallback mapping for old hardcoded clinic IDs
    const clinicIdMapping: { [key: string]: string } = {
      'clin_cebu_central_id': 'Cebu Medical Center',
      'clin_cebu_doctors_id': 'Metro Cebu Hospital',
      'clin_lahug_uhc_id': 'Skin Care Clinic',
      'clin_perpetual_succour_id': 'Cebu Medical Center'
    };
    
    const clinic = clinics.find(c => c.id === clinicId);
    
    if (clinic) {
      return clinic.name;
    } else if (clinicId && clinicIdMapping[clinicId]) {
      return clinicIdMapping[clinicId];
    } else {
      return `Clinic ID: ${clinicId}`;
    }
  };

  // Helper function to format date consistently
  const formatDate = (dateString: string) => {
    return formatDateToText(dateString);
  };

  const handleAdd = () => {
    setEditingSchedule(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (schedule: SpecialistSchedule) => {
    setEditingSchedule(schedule);
    setIsDialogOpen(true);
  };

  const handleSave = (schedulesData: SpecialistSchedule[]) => {
    // Handle multiple schedules from the dialog
    schedulesData.forEach(schedule => {
      if (schedule.id && schedule.id.startsWith('sch_')) {
        // This is a new schedule (has temporary ID)
        const { id, ...scheduleWithoutId } = schedule;
        onScheduleAdd(scheduleWithoutId);
      } else if (schedule.id) {
        // This is an existing schedule being edited
        onScheduleEdit(schedule);
      }
    });
    setIsDialogOpen(false);
  };

  const getDayNames = (dayNumbers: number[]) => {
    if (!dayNumbers || !Array.isArray(dayNumbers)) {
      return 'No days specified';
    }
    return dayNumbers
      .map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label)
      .filter(Boolean)
      .join(', ');
  };

  const getTimeRange = (slotTemplate: any) => {
    if (!slotTemplate || typeof slotTemplate !== 'object') {
      return 'No time slots';
    }
    
    const timeSlots = Object.keys(slotTemplate);
    if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return 'No time slots';
    }
    
    const sortedTimeSlots = [...timeSlots].sort();
    const firstSlot = sortedTimeSlots[0];
    const lastSlot = sortedTimeSlots[sortedTimeSlots.length - 1];
    return `${firstSlot} - ${lastSlot}`;
  };

  const getSlotCount = (slotTemplate: any) => {
    if (!slotTemplate || typeof slotTemplate !== 'object') {
      return 0;
    }
    return Object.keys(slotTemplate).length;
  };

  const getDurationMinutes = (slotTemplate: any) => {
    if (!slotTemplate || typeof slotTemplate !== 'object') {
      return 30;
    }
    const firstSlot = Object.values(slotTemplate)[0] as any;
    return firstSlot?.durationMinutes || 30;
  };

  return (
    <>
      <Card className="card-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Weekly Schedule
              </CardTitle>
              <CardDescription>
                Manage doctor&apos;s availability and clinic schedules
              </CardDescription>
            </div>
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!schedules || schedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No schedules configured</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add a schedule to set up doctor availability
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-primary" /> 
                      <span className="font-medium text-sm">{schedule.practiceLocation?.roomOrUnit || 'No room specified'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(schedule)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onScheduleDelete(schedule.id!)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Building className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {getClinicName(schedule.practiceLocation?.clinicId || '')}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {getDayNames(schedule.recurrence?.dayOfWeek)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {getTimeRange(schedule.slotTemplate)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {getSlotCount(schedule.slotTemplate)} slots ({getDurationMinutes(schedule.slotTemplate)} min each)
                      </Badge>
                      {schedule.validFrom && (
                        <Badge variant="secondary" className="text-xs">
                          From {formatDate(schedule.validFrom)} 
                          {/* (raw: {schedule.validFrom}) */}
                        </Badge>
                      )}
                      {schedule.isActive ? (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      {isDialogOpen && (
        <ClinicScheduleDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          existingSchedules={schedules}
          onSave={handleSave}
          specialistId={specialistId}
          editingSchedule={editingSchedule}
          isEditMode={!!editingSchedule}
        />
      )}
    </>
  );
}
