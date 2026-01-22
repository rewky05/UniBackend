"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DoctorSelector } from "@/components/schedules/doctor-selector";
import { EmptyState } from "@/components/schedules/empty-state";
import { DoctorInfoBanner } from "@/components/schedules/doctor-info-banner";
import { ScheduleCard } from "@/components/schedules/schedule-card";
import { ClinicCard, type ClinicAffiliation } from "@/components/schedules/clinic-card";
import { type SpecialistSchedule } from "@/components/schedules/schedule-card";
import { useRealDoctors, useRealClinics } from "@/hooks/useRealData";
import { useState } from "react";

export default function SchedulePage() {
  const { doctors, loading: doctorsLoading, error: doctorsError } = useRealDoctors();
  const { clinics, loading: clinicsLoading, error: clinicsError } = useRealClinics();
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

  // Show loading state
  if (doctorsLoading || clinicsLoading) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading schedule data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (doctorsError || clinicsError) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-red-600 mb-2">Failed to load schedule data</p>
            <p className="text-muted-foreground text-sm">{doctorsError || clinicsError}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedDoctorData = selectedDoctor ? doctors.find(d => d.id === selectedDoctor) : null;
  // Handle schedules - could be string, string[], or SpecialistSchedule[]
  const schedules: SpecialistSchedule[] = selectedDoctorData && Array.isArray(selectedDoctorData.schedules) 
    ? (typeof selectedDoctorData.schedules[0] === 'string' ? [] : selectedDoctorData.schedules as SpecialistSchedule[])
    : [];
  // Handle clinicAffiliations - convert string[] to ClinicAffiliation[]
  const doctorClinics: ClinicAffiliation[] = selectedDoctorData && Array.isArray(selectedDoctorData.clinicAffiliations)
    ? selectedDoctorData.clinicAffiliations.map((clinicId: string, index: number) => ({
        id: clinicId,
        clinicId: clinicId,
        name: `Clinic ${index + 1}`,
        since: new Date().toISOString(),
        schedules: []
      }))
    : [];

  return (
    <DashboardLayout title="">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Schedule Management</h2>
            <p className="text-muted-foreground">
              Manage doctor availability and clinic schedules
            </p>
          </div>
          <DoctorSelector
            doctors={doctors.filter(d => d.id)}
            selectedDoctor={selectedDoctor ?? null}
            onDoctorSelect={setSelectedDoctor}
          />
        </div>

        {/* Content */}
        {!selectedDoctor ? (
          <EmptyState />
        ) : (
          selectedDoctorData && (
            <div className="space-y-6">
              {selectedDoctorData && <DoctorInfoBanner doctor={selectedDoctorData} />}

              <div className="grid gap-6 lg:grid-cols-2">
                <ScheduleCard
                  schedules={schedules}
                  onScheduleAdd={() => {}}
                  onScheduleEdit={() => {}}
                  onScheduleDelete={() => {}}
                />

                <ClinicCard
                  clinics={doctorClinics}
                  onClinicAdd={() => {}}
                  onClinicEdit={() => {}}
                  onClinicDelete={() => {}}
                />
              </div>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}
