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
import { Building, Plus, Edit, Trash2, Calendar, Clock, MapPin, User } from "lucide-react";
import { ClinicScheduleDialog } from "../doctors/clinic-schedule-dialog";
import { type SpecialistSchedule } from "./schedule-card";
import { formatDateToText } from "@/lib/utils";

export interface ClinicAffiliation {
  id?: string;
  clinicId?: string; // For existing clinics
  name: string;
  since: string;
  schedules: any[]; // ClinicScheduleBlock[]
  resolvedAddress?: string;
  newClinicDetails?: {
    name: string;
    addressLine: string;
    contactNumber: string;
    type: string;
  };
}

interface ClinicCardProps {
  clinics: ClinicAffiliation[];
  onClinicAdd: (clinic: Omit<ClinicAffiliation, "id">) => void;
  onClinicEdit: (clinic: ClinicAffiliation) => void;
  onClinicDelete: (clinicId: string) => void;
}

export function ClinicCard({
  clinics,
  onClinicAdd,
  onClinicEdit,
  onClinicDelete,
}: ClinicCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<ClinicAffiliation | null>(null);

  const handleAdd = () => {
    setEditingClinic(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (clinic: ClinicAffiliation) => {
    setEditingClinic(clinic);
    setIsDialogOpen(true);
  };

  const handleSave = (schedules: SpecialistSchedule[]) => {
    // Convert schedules to clinic data format
    const clinicData: Omit<ClinicAffiliation, "id"> = editingClinic 
      ? {
          ...editingClinic,
          schedules: schedules
        }
      : {
          name: 'New Clinic',
          since: new Date().toISOString(),
          schedules: schedules
        };
    
    if (editingClinic) {
      onClinicEdit({ ...clinicData, id: editingClinic.id });
    } else {
      onClinicAdd(clinicData);
    }
    setIsDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDateToText(dateString);
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Card className="card-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Clinic Affiliations
              </CardTitle>
              <CardDescription>
                Manage clinic partnerships
              </CardDescription>
            </div>
            <Button onClick={handleAdd} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Clinic
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!clinics || clinics.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No clinic affiliations</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add a clinic to establish partnerships
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clinics.map((clinic) => (
                <div
                  key={clinic.id}
                  className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{clinic.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(clinic)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onClinicDelete(clinic.id!)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Since {formatDate(clinic.since)}
                      </span>
                    </div>

                    {clinic.schedules && clinic.schedules.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {clinic.schedules.length} schedule{clinic.schedules.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {clinic.newClinicDetails && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {clinic.resolvedAddress || clinic.newClinicDetails?.addressLine || 'Address not available'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clinic Dialog */}
      {isDialogOpen && (
        <ClinicScheduleDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          existingSchedules={(editingClinic?.schedules as SpecialistSchedule[]) || []}
          onSave={handleSave}
        />
      )}
    </>
  );
}
