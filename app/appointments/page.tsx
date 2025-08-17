"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRealAppointments, useRealReferrals, useRealClinics, useRealDoctors } from "@/hooks/useRealData";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatPhilippinePeso, formatDateToText, formatDateTimeToText, safeGetTimestamp } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Calendar,
  Search,
  Filter,

  Eye,
  Clock,
  User,
  MapPin,
  CalendarDays,
  Users,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock4,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrintView } from "@/components/ui/print-view";
import { Pagination } from "@/components/ui/pagination";

// Status configurations
const appointmentStatuses = [
  "All Statuses",
  "Confirmed", 
  "Completed",
  "Cancelled",
  "Pending",
  "Ongoing",
];

const referralStatuses = [
  "All Statuses",
  "Pending",
  "Pending Acceptance",
  "Confirmed",
  "Completed",
  "Ongoing",
  "Cancelled"
];

export default function AppointmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isSuperadmin } = useAuth();
  
  // Data hooks
  const { appointments, loading: appointmentsLoading } = useRealAppointments();
  const { referrals, loading: referralsLoading } = useRealReferrals();
  const { clinics } = useRealClinics();
  const { doctors } = useRealDoctors();

  // Get unique clinics for filtering
  const uniqueClinics = Array.from(new Set([
    ...appointments.map(a => a.clinicName).filter(Boolean),
    ...referrals.map(r => r.specialistClinicName).filter(Boolean)
  ]));

  // State management
  const [selectedTab, setSelectedTab] = useState("appointments");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [clinicFilter, setClinicFilter] = useState("All Clinics");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [isAppointmentSheetOpen, setIsAppointmentSheetOpen] = useState(false);
  const [isReferralSheetOpen, setIsReferralSheetOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Helper functions

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `${doctor.firstName} ${doctor.lastName}` : "Unknown Doctor";
  };

  const getPatientName = (appointment: any) => {
    const firstName = appointment.patientFirstName || 'Unknown';
    const lastName = appointment.patientLastName || 'Patient';
    return `${firstName} ${lastName}`;
  };

  const getReferralPatientName = (referral: any) => {
    const firstName = referral.patientFirstName || 'Unknown';
    const lastName = referral.patientLastName || 'Patient';
    return `${firstName} ${lastName}`;
  };

  const getDoctorDisplayName = (appointment: any) => {
    if (appointment.doctorFirstName && appointment.doctorLastName) {
      return `Dr. ${appointment.doctorFirstName} ${appointment.doctorLastName}`;
    }
    if (appointment.doctorId) {
      return getDoctorName(appointment.doctorId);
    }
    return "Not assigned";
  };

  const getDoctorSpecialty = (appointment: any) => {
    if (appointment.specialty) {
      return appointment.specialty;
    }
    if (appointment.doctorId) {
      const doctor = doctors.find(d => d.id === appointment.doctorId);
      return doctor?.specialty || "General Practice";
    }
    return "General Practice";
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "confirmed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "scheduled":
      case "pending_acceptance":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "confirmed":
        return <CheckCircle className="h-3 w-3" />;
      case "scheduled":
      case "pending_acceptance":
        return <Clock className="h-3 w-3" />;
      case "pending":
        return <AlertCircle className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock4 className="h-3 w-3" />;
    }
  };

  // Filter functions
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = searchTerm === "" || 
      appointment.patientFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patientLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctorFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctorLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.clinicName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All Statuses" || 
      appointment.status?.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesClinic = clinicFilter === "All Clinics" || 
      appointment.clinicName === clinicFilter;

    return matchesSearch && matchesStatus && matchesClinic;
  });

  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = searchTerm === "" || 
      referral.patientFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.patientLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.assignedSpecialistFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.assignedSpecialistLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.specialistClinicName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All Statuses" || 
      (statusFilter === "Pending Acceptance" && referral.status === "pending_acceptance") ||
      (statusFilter === "Pending" && referral.status === "pending") ||
      (statusFilter !== "Pending Acceptance" && statusFilter !== "Pending" && 
       referral.status?.toLowerCase() === statusFilter.toLowerCase());
    
    const matchesClinic = clinicFilter === "All Clinics" || 
      referral.specialistClinicName === clinicFilter;

    return matchesSearch && matchesStatus && matchesClinic;
  });

  // Pagination logic
  const totalPages = Math.ceil(Math.max(filteredAppointments.length, filteredReferrals.length) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);
  const paginatedReferrals = filteredReferrals.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, clinicFilter, selectedTab]);

  // Print columns configuration for appointments
  const appointmentPrintColumns = [
    { key: 'patient', label: 'Patient', render: (appointment: any) => `${appointment.patientFirstName} ${appointment.patientLastName}` },
    { key: 'doctor', label: 'Doctor', render: (appointment: any) => appointment.doctorFirstName && appointment.doctorLastName ? `Dr. ${appointment.doctorFirstName} ${appointment.doctorLastName}` : 'Not assigned' },
    { key: 'clinicName', label: 'Clinic' },
    { key: 'appointmentDate', label: 'Date' },
    { key: 'appointmentTime', label: 'Time' },
    { key: 'status', label: 'Status', render: (appointment: any) => appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) },
  ];

  // Print columns configuration for referrals
  const referralPrintColumns = [
    { key: 'patient', label: 'Patient', render: (referral: any) => `${referral.patientFirstName} ${referral.patientLastName}` },
    { key: 'referringDoctor', label: 'Referring Doctor', render: (referral: any) => `Dr. ${referral.referringGeneralistFirstName} ${referral.referringGeneralistLastName}` },
    { key: 'assignedSpecialist', label: 'Assigned Specialist', render: (referral: any) => `Dr. ${referral.assignedSpecialistFirstName} ${referral.assignedSpecialistLastName}` },
    { key: 'specialistClinicName', label: 'Specialist Clinic' },
    { key: 'appointmentDate', label: 'Date' },
    { key: 'appointmentTime', label: 'Time' },
    { key: 'status', label: 'Status', render: (referral: any) => referral.status?.replace('_', ' ').charAt(0).toUpperCase() + referral.status?.replace('_', ' ').slice(1) },
  ];

  // Print filters
  const printFilters = [
    { label: 'Search', value: searchTerm || 'None' },
    { label: 'Status', value: statusFilter },
    { label: 'Clinic', value: clinicFilter },
  ].filter(filter => filter.value !== 'All Statuses' && filter.value !== 'All Clinics');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointments Management</h1>
            <p className="text-muted-foreground">
              Manage clinic appointments and specialist referrals
            </p>
          </div>
        </div>

        {/* Tabs for switching between appointments and referrals */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Clinic Appointments ({appointments.length})
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Specialist Referrals ({referrals.length})
            </TabsTrigger>
          </TabsList>

                      {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6 space-y-2">
                    <label className="text-sm font-medium">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search patients, doctors, clinics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {appointmentStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">Clinic</label>
                    <Select value={clinicFilter} onValueChange={setClinicFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Clinics">All Clinics</SelectItem>
                        {uniqueClinics.map((clinicName) => (
                          <SelectItem key={clinicName} value={clinicName}>
                            {clinicName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">Actions</label>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("All Statuses");
                        setClinicFilter("All Clinics");
                      }}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointments Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Clinic Appointments</CardTitle>
                    <CardDescription className="mt-2">
                      {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} found
                    </CardDescription>
                  </div>
                  <PrintView
                    title="Clinic Appointments Report"
                    subtitle="Comprehensive list of clinic appointments"
                    data={filteredAppointments}
                    columns={appointmentPrintColumns}
                    filters={printFilters}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Clinic</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointmentsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            Loading appointments...
                          </TableCell>
                        </TableRow>
                      ) : filteredAppointments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No appointments found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {`${appointment.patientFirstName?.[0] || ''}${appointment.patientLastName?.[0] || ''}`}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {appointment.patientFirstName} {appointment.patientLastName}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                                                         <TableCell>
                               <div>
                                 <div className="font-medium">
                                   {getDoctorDisplayName(appointment)}
                                 </div>
                                 <div className="text-sm text-muted-foreground">
                                   {getDoctorSpecialty(appointment)}
                                 </div>
                               </div>
                             </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                {appointment.clinicName}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {formatDateToText(appointment.appointmentDate)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {appointment.appointmentTime}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {appointment.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(appointment.status)}>
                                {getStatusIcon(appointment.status)}
                                <span className="ml-1 capitalize">
                                  {appointment.status?.replace('_', ' ')}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setIsAppointmentSheetOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination for Appointments */}
                {filteredAppointments.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredAppointments.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

                      {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6 space-y-2">
                    <label className="text-sm font-medium">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search patients, specialists, clinics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {referralStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">Clinic</label>
                    <Select value={clinicFilter} onValueChange={setClinicFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Clinics">All Clinics</SelectItem>
                        {uniqueClinics.map((clinicName) => (
                          <SelectItem key={clinicName} value={clinicName}>
                            {clinicName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">Actions</label>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("All Statuses");
                        setClinicFilter("All Clinics");
                      }}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referrals Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Specialist Referrals</CardTitle>
                    <CardDescription>
                      {filteredReferrals.length} referral{filteredReferrals.length !== 1 ? 's' : ''} found
                    </CardDescription>
                  </div>
                  <PrintView
                    title="Specialist Referrals Report"
                    subtitle="Comprehensive list of specialist referrals"
                    data={filteredReferrals}
                    columns={referralPrintColumns}
                    filters={printFilters}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Referring Doctor</TableHead>
                        <TableHead>Assigned Specialist</TableHead>
                        <TableHead>Clinic</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referralsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            Loading referrals...
                          </TableCell>
                        </TableRow>
                      ) : filteredReferrals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No referrals found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedReferrals.map((referral) => (
                          <TableRow key={referral.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {`${referral.patientFirstName?.[0] || ''}${referral.patientLastName?.[0] || ''}`}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {referral.patientFirstName} {referral.patientLastName}
                                  </div>
                                  {/* <div className="text-sm text-muted-foreground">
                                    {referral.patientId}
                                  </div> */}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  Dr. {referral.referringGeneralistFirstName} {referral.referringGeneralistLastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Generalist
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  Dr. {referral.assignedSpecialistFirstName} {referral.assignedSpecialistLastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Specialist
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                {referral.specialistClinicName || 'Unknown Clinic'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {formatDateToText(referral.appointmentDate)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {referral.appointmentTime}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(referral.status)}>
                                {getStatusIcon(referral.status)}
                                <span className="ml-1 capitalize">
                                  {referral.status?.replace('_', ' ')}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedReferral(referral);
                                  setIsReferralSheetOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination for Referrals */}
                {filteredReferrals.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredReferrals.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Appointment Details Sheet */}
        {selectedAppointment && (
          <Sheet open={isAppointmentSheetOpen} onOpenChange={setIsAppointmentSheetOpen}>
            <SheetContent side="right" className="w-full max-w-md sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl backdrop-blur-md overflow-y-auto">
              <div className="p-6">
                <SheetHeader>
                  <SheetTitle>Appointment Details</SheetTitle>
                  <SheetDescription>Complete appointment information</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col items-center md:items-start gap-6 mt-6">
                  <Avatar className="h-20 w-20 mb-2">
                    <AvatarFallback className="text-lg">
                      {`${selectedAppointment.patientFirstName} ${selectedAppointment.patientLastName}`.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className={getStatusColor(selectedAppointment.status)}>
                    {getStatusIcon(selectedAppointment.status)}
                    <span className="ml-1 capitalize">{selectedAppointment.status?.replace('_', ' ')}</span>
                  </Badge>
                </div>
                <div className="mt-8">
                  <Accordion type="single" collapsible defaultValue="overview">
                    <AccordionItem value="overview">
                      <AccordionTrigger className="text-lg font-semibold">Overview</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-8">
                          {/* Patient Information */}
                          <div>
                            <h3 className="text-base font-semibold mb-4 text-foreground">Patient Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Patient Name</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {selectedAppointment.patientFirstName} {selectedAppointment.patientLastName}
                                </span>
                              </div>
                                                             <div className="flex flex-col">
                                 <span className="text-xs text-muted-foreground mb-1">Source System</span>
                                 <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                   {selectedAppointment.sourceSystem || 'Not specified'}
                                 </span>
                               </div>
                            </div>
                          </div>

                          {/* Appointment Details */}
                          <div>
                            <h3 className="text-base font-semibold mb-4 text-foreground">Appointment Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Date</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {formatDateToText(selectedAppointment.appointmentDate)}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Time</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {selectedAppointment.appointmentTime}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Type</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {selectedAppointment.type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Status</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {selectedAppointment.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Doctor Information */}
                          {selectedAppointment.doctorFirstName && (
                            <div>
                              <h3 className="text-base font-semibold mb-4 text-foreground">Doctor Information</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                 <div className="flex flex-col">
                                   <span className="text-xs text-muted-foreground mb-1">Doctor Name</span>
                                   <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                     {getDoctorDisplayName(selectedAppointment)}
                                   </span>
                                 </div>
                                                                 <div className="flex flex-col">
                                   <span className="text-xs text-muted-foreground mb-1">Specialty</span>
                                   <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                     {getDoctorSpecialty(selectedAppointment)}
                                   </span>
                                 </div>
                              </div>
                            </div>
                          )}

                          {/* Clinic Information */}
                          <div>
                            <h3 className="text-base font-semibold mb-4 text-foreground">Clinic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Clinic Name</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {selectedAppointment.clinicName}
                                </span>
                              </div>
                                                             <div className="flex flex-col">
                                 {/* <span className="text-xs text-muted-foreground mb-1">Booked By</span>
                                 <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                   {selectedAppointment.bookedByUserFirstName} {selectedAppointment.bookedByUserLastName}
                                 </span> */}
                               </div>
                            </div>
                          </div>

                          {/* Additional Information */}
                          {(selectedAppointment.notes || selectedAppointment.patientComplaint) && (
                            <div>
                              <h3 className="text-base font-semibold mb-4 text-foreground">Additional Information</h3>
                              <div className="space-y-4">
                                {selectedAppointment.notes && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground mb-1">Notes</span>
                                    <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                      {selectedAppointment.notes}
                                    </span>
                                  </div>
                                )}
                                {selectedAppointment.patientComplaint && selectedAppointment.patientComplaint.length > 0 && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground mb-1">Patient Complaints</span>
                                    <div className="space-y-2">
                                      {selectedAppointment.patientComplaint.map((complaint: string, index: number) => (
                                        <span key={index} className="font-medium text-base border rounded px-3 py-2 bg-muted/30 block">
                                          {complaint}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Referral Details Sheet */}
        {selectedReferral && (
          <Sheet open={isReferralSheetOpen} onOpenChange={setIsReferralSheetOpen}>
            <SheetContent side="right" className="w-full max-w-md sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl backdrop-blur-md overflow-y-auto">
              <div className="p-6">
                <SheetHeader>
                  <SheetTitle>Referral Details</SheetTitle>
                  <SheetDescription>Complete referral information</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col items-center md:items-start gap-6 mt-6">
                  <Avatar className="h-20 w-20 mb-2">
                    <AvatarFallback className="text-lg">
                      {`${selectedReferral.patientFirstName} ${selectedReferral.patientLastName}`.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className={getStatusColor(selectedReferral.status)}>
                    {getStatusIcon(selectedReferral.status)}
                    <span className="ml-1 capitalize">{selectedReferral.status?.replace('_', ' ')}</span>
                  </Badge>
                </div>
                <div className="mt-8">
                  <Accordion type="single" collapsible defaultValue="overview">
                    <AccordionItem value="overview">
                      <AccordionTrigger className="text-lg font-semibold">Overview</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-8">
                          {/* Patient Information */}
                          <div>
                            <h3 className="text-base font-semibold mb-4 text-foreground">Patient Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Patient Name</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {selectedReferral.patientFirstName} {selectedReferral.patientLastName}
                                </span>
                              </div>
                                                             <div className="flex flex-col">
                                 <span className="text-xs text-muted-foreground mb-1">Source System</span>
                                 <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                   {selectedReferral.sourceSystem || 'Not specified'}
                                 </span>
                               </div>
                            </div>
                          </div>

                          {/* Referral Details */}
                          <div>
                            <h3 className="text-base font-semibold mb-4 text-foreground">Referral Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Appointment Date</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {formatDateToText(selectedReferral.appointmentDate)}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Appointment Time</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {selectedReferral.appointmentTime}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Reason for Referral</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {selectedReferral.initialReasonForReferral}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Status</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {selectedReferral.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Doctor Information */}
                          <div>
                            <h3 className="text-base font-semibold mb-4 text-foreground">Doctor Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Referring Doctor</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  Dr. {selectedReferral.referringGeneralistFirstName} {selectedReferral.referringGeneralistLastName}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Assigned Specialist</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  Dr. {selectedReferral.assignedSpecialistFirstName} {selectedReferral.assignedSpecialistLastName}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Clinic Information */}
                          <div>
                            <h3 className="text-base font-semibold mb-4 text-foreground">Clinic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Referring Clinic</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {selectedReferral.referringClinicName}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Specialist Clinic</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {selectedReferral.specialistClinicName}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Practice Location</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {selectedReferral.practiceLocation?.roomOrUnit || "Not specified"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Additional Information */}
                          {selectedReferral.generalistNotes && (
                            <div>
                              <h3 className="text-base font-semibold mb-4 text-foreground">Additional Information</h3>
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Generalist Notes</span>
                                <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                  {selectedReferral.generalistNotes}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </DashboardLayout>
  );
} 