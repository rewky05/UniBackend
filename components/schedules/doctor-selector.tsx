"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Doctor {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  specialty: string;
}

interface DoctorSelectorProps {
  doctors: Doctor[];
  selectedDoctor: string | null | undefined;
  onDoctorSelect: (doctorId: string) => void;
}

export function DoctorSelector({
  doctors,
  selectedDoctor,
  onDoctorSelect,
}: DoctorSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <Select value={selectedDoctor || undefined} onValueChange={onDoctorSelect}>
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder="Choose a doctor..." />
        </SelectTrigger>
        <SelectContent>
          {doctors.map((doctor) => {
            const doctorId = doctor.id || '';
            const doctorName = doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Unknown';
            return (
              <SelectItem key={doctorId} value={doctorId}>
                {doctorName} - {doctor.specialty}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
