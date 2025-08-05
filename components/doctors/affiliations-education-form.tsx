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
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock,
} from "lucide-react";
import { ClinicScheduleDialog } from "./clinic-schedule-dialog";
import type {
  SpecialistSchedule,
} from "@/app/doctors/add/page";
import { useRealClinics } from "@/hooks/useRealData";
import { formatDateToText } from "@/lib/utils";

interface SchedulesData {
  schedules: SpecialistSchedule[];
}

interface SchedulesFormProps {
  data: SchedulesData;
  onUpdate: (data: Partial<SchedulesData>) => void;
}

export function AffiliationsEducationForm({
  data,
  onUpdate,
}: SchedulesFormProps) {
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  
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

  const handleAddSchedule = () => {
    setIsScheduleDialogOpen(true);
  };

  const handleEditSchedule = (schedule: SpecialistSchedule) => {
    // For now, we'll just open the dialog with all schedules
    // The dialog will handle editing individual schedules
    setIsScheduleDialogOpen(true);
  };

  const removeSchedule = (index: number) => {
    const updatedSchedules = data.schedules.filter((_, i) => i !== index);
    onUpdate({ schedules: updatedSchedules });
  };

  const getDayNames = (dayNumbers: number[]) => {
    if (!dayNumbers || !Array.isArray(dayNumbers)) {
      return 'No days specified';
    }
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return dayNumbers
      .sort()
      .map((num) => dayNames[num])
      .join(", ");
  };

  return (
    <div className="space-y-6">
      {/* Schedule Management */}
      <Card className="card-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Schedule Management
              </CardTitle>
              <CardDescription>
                Add doctor&apos;s availability and clinic schedules
              </CardDescription>
            </div>
            <Button onClick={handleAddSchedule} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.schedules.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">
                No schedules configured
              </p>
              <p className="text-sm text-muted-foreground">
                Click &quot;Add Schedule&quot; to set up doctor availability
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.schedules.map((schedule, index) => (
                <div
                  key={schedule.id || index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{schedule.practiceLocation?.roomOrUnit || 'No room specified'}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getClinicName(schedule.practiceLocation?.clinicId || '')}
                        </Badge>
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
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {getDayNames(schedule.recurrence?.dayOfWeek || [])}
                      </div>
                      {schedule.slotTemplate && Object.keys(schedule.slotTemplate).length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>
                              {Object.keys(schedule.slotTemplate).length} time slots
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                                                         <span>
                               Valid from {schedule.validFrom ? formatDateToText(schedule.validFrom) : 'Not set'}
                             </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditSchedule(schedule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSchedule(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      {isScheduleDialogOpen && (
        <ClinicScheduleDialog
          open={isScheduleDialogOpen}
          onOpenChange={setIsScheduleDialogOpen}
          existingSchedules={data.schedules}
          onSave={(schedules) => {
            // Update all schedules at once
            onUpdate({ schedules });
          }}
        />
      )}
    </div>
  );
}
