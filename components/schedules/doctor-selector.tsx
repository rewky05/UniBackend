"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

interface DoctorSelectorProps {
  doctors: Doctor[];
  selectedDoctor: string;
  onDoctorSelect: (doctorId: string) => void;
}

export function DoctorSelector({
  doctors,
  selectedDoctor,
  onDoctorSelect,
}: DoctorSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <Select value={selectedDoctor} onValueChange={onDoctorSelect}>
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder="Choose a doctor..." />
        </SelectTrigger>
        <SelectContent>
          {doctors.map((doctor) => (
            <SelectItem key={doctor.id} value={doctor.id}>
              {doctor.name} - {doctor.specialty}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
