"use client";

import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, User, Calendar, MapPin, Edit, Eye, X } from "lucide-react";
import Link from "next/link";

// For now, use static patient data. Replace with real data fetching later.
const patients = [
  {
    id: "1",
    firstName: "Juan",
    lastName: "Dela Cruz",
    gender: "Male",
    dateOfBirth: "1990-01-01",
    contactNumber: "09171234567",
    email: "juan.delacruz@email.com",
    emergencyContact: {
      name: "Maria Dela Cruz",
      relationship: "Mother",
      contactNumber: "09181234567",
    },
    address: "123 Main St, Manila, Philippines",
    profileImageUrl: "",
    status: "active",
  },
  // Add more static patients as needed
];

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;
  const patient = patients.find((p) => p.id === patientId);

  if (!patient) {
    return (
      <DashboardLayout title="Patient Details">
        <div className="p-8 text-center text-muted-foreground">Patient not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${patient.firstName} ${patient.lastName} - Patient Details`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={patient.profileImageUrl || ""} />
              <AvatarFallback className="text-lg">
                {`${patient.firstName} ${patient.lastName}`
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{`${patient.firstName} ${patient.lastName}`}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <Badge className={patient.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {patient.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="#">
                <Eye className="h-4 w-4 mr-2" /> View Details
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="#">
                <Edit className="h-4 w-4 mr-2" /> Edit Details
              </Link>
            </Button>
            <Button variant="destructive">
              <X className="h-4 w-4 mr-2" /> Deactivate Account
            </Button>
          </div>
        </div>

        {/* Patient Info */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Basic details and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-2">
                  <span className="font-medium">Full Name:</span> {patient.firstName} {patient.lastName}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Gender:</span> {patient.gender}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Date of Birth:</span> {patient.dateOfBirth}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Contact Number:</span> {patient.contactNumber}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Email:</span> {patient.email}
                </div>
              </div>
              <div>
                <div className="mb-2">
                  <span className="font-medium">Emergency Contact:</span>
                  <div className="ml-2">
                    <div>Name: {patient.emergencyContact.name}</div>
                    <div>Relationship: {patient.emergencyContact.relationship}</div>
                    <div>Contact Number: {patient.emergencyContact.contactNumber}</div>
                  </div>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Address:</span> {patient.address}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 