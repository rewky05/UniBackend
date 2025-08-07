"use client";

import { useState } from "react";
import Link from "next/link";
import { useDashboardData, useSpecialists, useActivityLogs } from "@/hooks/useOptimizedData";
import { useRealAppointments, useRealReferrals } from "@/hooks/useRealData";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LoadingSpinner, ErrorState } from "@/components/ui/loading-states";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  UserCheck,
  UserX,
  Calendar,
  MessageSquare,
  TrendingUp,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  MapPin,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export default function DashboardPage() {
  // ✅ OPTIMIZED - Using React Query hooks with caching
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useDashboardData();

  // Filter states for appointments
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState("");
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState("all");
  const [appointmentClinicFilter, setAppointmentClinicFilter] = useState("all");

  // Filter states for referrals
  const [referralSearchTerm, setReferralSearchTerm] = useState("");
  const [referralStatusFilter, setReferralStatusFilter] = useState("all");
  const [referralClinicFilter, setReferralClinicFilter] = useState("all");

  const { 
    data: specialists = [], 
    isLoading: specialistsLoading,
    error: specialistsError 
  } = useSpecialists();

  const { 
    data: activityLogs = [], 
    isLoading: activityLoading,
    error: activityError 
  } = useActivityLogs();

  // Appointments data
  const { appointments, loading: appointmentsLoading } = useRealAppointments();
  const { referrals, loading: referralsLoading } = useRealReferrals();

  // Helper functions for appointments
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
        return <AlertTriangle className="h-3 w-3" />;
      case "cancelled":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Get unique clinics for filtering
  const appointmentClinics = Array.from(new Set(appointments.map(a => a.clinicName)));
  const referralClinics = Array.from(new Set(referrals.map(r => r.referringClinicName)));

  // Filter appointments
  const filteredAppointments = appointments
    .filter(appointment => {
      const matchesSearch = appointmentSearchTerm === "" || 
        appointment.patientFirstName?.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
        appointment.patientLastName?.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
        appointment.patientId?.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
        appointment.doctorFirstName?.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
        appointment.doctorLastName?.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
        appointment.clinicName?.toLowerCase().includes(appointmentSearchTerm.toLowerCase());

      const matchesStatus = appointmentStatusFilter === "all" || 
        appointment.status === appointmentStatusFilter;

      const matchesClinic = appointmentClinicFilter === "all" || 
        appointment.clinicName === appointmentClinicFilter;

      return matchesSearch && matchesStatus && matchesClinic;
    })
    .slice(0, 5);

  // Filter referrals
  const filteredReferrals = referrals
    .filter(referral => {
      const matchesSearch = referralSearchTerm === "" || 
        referral.patientFirstName?.toLowerCase().includes(referralSearchTerm.toLowerCase()) ||
        referral.patientLastName?.toLowerCase().includes(referralSearchTerm.toLowerCase()) ||
        referral.patientId?.toLowerCase().includes(referralSearchTerm.toLowerCase()) ||
        referral.referringGeneralistFirstName?.toLowerCase().includes(referralSearchTerm.toLowerCase()) ||
        referral.referringGeneralistLastName?.toLowerCase().includes(referralSearchTerm.toLowerCase()) ||
        referral.assignedSpecialistFirstName?.toLowerCase().includes(referralSearchTerm.toLowerCase()) ||
        referral.assignedSpecialistLastName?.toLowerCase().includes(referralSearchTerm.toLowerCase()) ||
        referral.referringClinicName?.toLowerCase().includes(referralSearchTerm.toLowerCase()) ||
        referral.initialReasonForReferral?.toLowerCase().includes(referralSearchTerm.toLowerCase());

      const matchesStatus = referralStatusFilter === "all" || 
        referral.status === referralStatusFilter;

      const matchesClinic = referralClinicFilter === "all" || 
        referral.referringClinicName === referralClinicFilter;

      return matchesSearch && matchesStatus && matchesClinic;
    })
    .slice(0, 5);

  // Show loading state
  if (dashboardLoading || specialistsLoading) {
    return (
      <DashboardLayout title="">
        <LoadingSpinner size="lg" text="Loading dashboard data..." />
      </DashboardLayout>
    );
  }

  // Show error state
  if (dashboardError || specialistsError) {
    return (
      <DashboardLayout title="">
        <ErrorState 
          error={dashboardError?.message || specialistsError?.message || 'Failed to load dashboard data'}
          onRetry={refetchDashboard}
        />
      </DashboardLayout>
    );
  }

  // Calculate stats from cached data
  const stats = dashboardData ? [
    {
      title: "Total Specialists",
      value: specialists.length,
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
      isClickable: true,
      href: "/doctors" as const,
    },
    {
      title: "Verified Specialists",
      value: specialists.filter(d => d.status === 'verified').length,
      change: "+8%",
      changeType: "positive" as const,
      icon: UserCheck,
       isClickable: true,
       href: "/doctors?status=verified" as const,
     },
    {
      title: "Total Appointments",
      value: appointments.length,
      change: "+15%",
      changeType: "positive" as const,
      icon: Calendar,
      isClickable: true,
      href: "/appointments" as const,
    },
    {
      title: "Active Referrals",
      value: referrals.filter(r => r.status === 'pending_acceptance' || r.status === 'confirmed').length,
      change: "+5%",
      changeType: "positive" as const,
      icon: ArrowRight,
      isClickable: true,
      href: "/appointments?tab=referrals" as const,
    },
  ] : [];



  return (
    <DashboardLayout title="">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your specialists and appointments.
            </p>
          </div>
        </div>
        

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
                         <Card 
               key={stat.title} 
               className={stat.isClickable 
                ? "cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50 hover:from-blue-100/70 hover:to-indigo-100/70 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40" 
                 : "bg-card"
               }
             >
              {stat.isClickable ? (
                <Link href={stat.href!} className="block">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">{stat.title}</CardTitle>
                    <div className="flex items-center space-x-1">
                      <stat.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <ArrowRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stat.value}</div>
                    <p className={`text-xs ${
                      stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.change} from last month
                    </p>
                  </CardContent>
                </Link>
                             ) : (
                 <>
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium text-foreground">{stat.title}</CardTitle>
                     <stat.icon className="h-4 w-4 text-muted-foreground" />
                   </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                     <p className={`text-xs ${
                      stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                     }`}>
                       {stat.change} from last month
                     </p>
                   </CardContent>
                 </>
               )}
            </Card>
          ))}
        </div>

        {/* Recent Appointments */}
        <Card className="bg-card border-border/50 dark:border-border/30">
          <CardHeader className="border-b border-border/20 dark:border-border/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  Recent Appointments
              </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-2">
                  Latest clinic appointments and specialist referrals
              </CardDescription>
              </div>
              <Link href="/appointments">
                <Button variant="outline" size="sm" className="flex items-center gap-2 hover:bg-primary/5 dark:hover:bg-primary/10">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            </CardHeader>
            <CardContent>
            <Tabs defaultValue="appointments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                                 <TabsTrigger value="appointments" className="flex items-center gap-2">
                   <Calendar className="h-4 w-4" />
                   Clinic Appointments ({filteredAppointments.length})
                 </TabsTrigger>
                 <TabsTrigger value="referrals" className="flex items-center gap-2">
                   <ArrowRight className="h-4 w-4" />
                   Specialist Referrals ({filteredReferrals.length})
                 </TabsTrigger>
              </TabsList>

                             {/* Appointments Tab */}
               <TabsContent value="appointments" className="mt-4">
                 {/* Filter Controls */}
                 <div className="flex flex-col sm:flex-row gap-4 mb-4">
                   <div className="flex-1">
                     <Input
                       placeholder="Search appointments..."
                       value={appointmentSearchTerm}
                       onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                       className="max-w-sm"
                     />
                   </div>
                   <div className="flex gap-2">
                     <Select value={appointmentStatusFilter} onValueChange={setAppointmentStatusFilter}>
                       <SelectTrigger className="w-[140px]">
                         <SelectValue placeholder="Status" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All Status</SelectItem>
                         <SelectItem value="scheduled">Scheduled</SelectItem>
                         <SelectItem value="confirmed">Confirmed</SelectItem>
                         <SelectItem value="completed">Completed</SelectItem>
                         <SelectItem value="cancelled">Cancelled</SelectItem>
                       </SelectContent>
                     </Select>
                     <Select value={appointmentClinicFilter} onValueChange={setAppointmentClinicFilter}>
                       <SelectTrigger className="w-[140px]">
                         <SelectValue placeholder="Clinic" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All Clinics</SelectItem>
                         {appointmentClinics.map((clinic) => (
                           <SelectItem key={clinic} value={clinic}>
                             {clinic}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>

                 {appointmentsLoading ? (
                   <div className="text-center py-8">
                     <LoadingSpinner size="sm" text="Loading appointments..." />
                      </div>
                                   ) : filteredAppointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No appointments found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Try adjusting your filters
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border border-border/50 dark:border-border/30">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 dark:bg-muted/20">
                            <TableHead className="text-foreground font-medium">Patient</TableHead>
                            <TableHead className="text-foreground font-medium">Doctor</TableHead>
                            <TableHead className="text-foreground font-medium">Clinic</TableHead>
                            <TableHead className="text-foreground font-medium">Date & Time</TableHead>
                            <TableHead className="text-foreground font-medium">Status</TableHead>
                            <TableHead className="text-right text-foreground font-medium">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAppointments.map((appointment) => (
                           <TableRow key={appointment.id} className="hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors">
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
                                   <div className="text-sm text-muted-foreground">
                                     {appointment.patientId}
                                   </div>
                                 </div>
                               </div>
                             </TableCell>
                             <TableCell>
                               {appointment.doctorFirstName && appointment.doctorLastName ? (
                                 <div>
                                   <div className="font-medium">
                                     Dr. {appointment.doctorFirstName} {appointment.doctorLastName}
                                   </div>
                                   <div className="text-sm text-muted-foreground">
                                     {appointment.specialty || "General Practice"}
                                   </div>
                                 </div>
                               ) : (
                                 <span className="text-muted-foreground">Not assigned</span>
                               )}
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
                                   {appointment.appointmentDate}
                                 </div>
                                 <div className="text-sm text-muted-foreground">
                                   {appointment.appointmentTime}
                                 </div>
                               </div>
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
                               <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" className="h-8 w-8 p-0">
                                     <MoreHorizontal className="h-4 w-4" />
                                   </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end">
                                   <DropdownMenuItem asChild>
                                     <Link href={`/appointments?tab=appointments&id=${appointment.id}`}>
                                       <Eye className="h-4 w-4 mr-2" />
                                       View Details
                                     </Link>
                                   </DropdownMenuItem>
                                 </DropdownMenuContent>
                               </DropdownMenu>
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                  </div>
                )}
               </TabsContent>

                             {/* Referrals Tab */}
               <TabsContent value="referrals" className="mt-4">
                 {/* Filter Controls */}
                 <div className="flex flex-col sm:flex-row gap-4 mb-4">
                   <div className="flex-1">
                     <Input
                       placeholder="Search referrals..."
                       value={referralSearchTerm}
                       onChange={(e) => setReferralSearchTerm(e.target.value)}
                       className="max-w-sm"
                     />
                   </div>
                   <div className="flex gap-2">
                     <Select value={referralStatusFilter} onValueChange={setReferralStatusFilter}>
                       <SelectTrigger className="w-[140px]">
                         <SelectValue placeholder="Status" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All Status</SelectItem>
                         <SelectItem value="pending_acceptance">Pending Acceptance</SelectItem>
                         <SelectItem value="confirmed">Confirmed</SelectItem>
                         <SelectItem value="completed">Completed</SelectItem>
                         <SelectItem value="cancelled">Cancelled</SelectItem>
                       </SelectContent>
                     </Select>
                     <Select value={referralClinicFilter} onValueChange={setReferralClinicFilter}>
                       <SelectTrigger className="w-[140px]">
                         <SelectValue placeholder="Clinic" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All Clinics</SelectItem>
                         {referralClinics.map((clinic) => (
                           <SelectItem key={clinic} value={clinic}>
                             {clinic}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
              </div>

                 {referralsLoading ? (
                   <div className="text-center py-8">
                     <LoadingSpinner size="sm" text="Loading referrals..." />
                   </div>
                                   ) : filteredReferrals.length === 0 ? (
                <div className="text-center py-8">
                      <ArrowRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No referrals found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                        Try adjusting your filters
                  </p>
                </div>
                  ) : (
                    <div className="rounded-md border border-border/50 dark:border-border/30">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 dark:bg-muted/20">
                            <TableHead className="text-foreground font-medium">Patient</TableHead>
                            <TableHead className="text-foreground font-medium">Referring Doctor</TableHead>
                            <TableHead className="text-foreground font-medium">Assigned Specialist</TableHead>
                            <TableHead className="text-foreground font-medium">Clinic</TableHead>
                            <TableHead className="text-foreground font-medium">Date & Time</TableHead>
                            <TableHead className="text-foreground font-medium">Status</TableHead>
                            <TableHead className="text-right text-foreground font-medium">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReferrals.map((referral) => (
                           <TableRow key={referral.id} className="hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors">
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
                                   <div className="text-sm text-muted-foreground">
                                     {referral.patientId}
                                   </div>
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
                                 {referral.referringClinicName}
                               </div>
                             </TableCell>
                             <TableCell>
                               <div>
                                 <div className="font-medium">
                                   {referral.appointmentDate}
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
                               <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" className="h-8 w-8 p-0">
                                     <MoreHorizontal className="h-4 w-4" />
                                   </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end">
                                   <DropdownMenuItem asChild>
                                     <Link href={`/appointments?tab=referrals&id=${referral.id}`}>
                                       <Eye className="h-4 w-4 mr-2" />
                                       View Details
                                     </Link>
                                   </DropdownMenuItem>
                                 </DropdownMenuContent>
                               </DropdownMenu>
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
              </div>
                 )}
               </TabsContent>
            </Tabs>
            </CardContent>
          </Card>
      </div>
    </DashboardLayout>
  );
}
