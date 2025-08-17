"use client";

import { useState } from "react";
import Link from "next/link";
import { useDashboardData, useSpecialists, useActivityLogs } from "@/hooks/useOptimizedData";
import { useRealAppointments, useRealReferrals, useRealFeedback } from "@/hooks/useRealData";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatDateToText } from "@/lib/utils";
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
  XCircle,
} from "lucide-react";
import { AppointmentTrendsChart } from '@/components/ui/appointment-trends-chart';
import { PatientVolumeChart } from '@/components/ui/patient-volume-chart';
import type { Appointment } from '@/lib/types/database';



export default function DashboardPage() {
  // ✅ OPTIMIZED - Using React Query hooks with caching
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useDashboardData();

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
  const { appointments: realAppointments, loading: appointmentsLoading } = useRealAppointments();
  const { referrals, loading: referralsLoading } = useRealReferrals();
  const { feedback, loading: feedbackLoading } = useRealFeedback();

  // TEMPORARY SAMPLE DATA - Remove when user says "remove"
  const sampleAppointments: Appointment[] = [
    // Last 30 days of sample data
    {
      id: '1',
      patientId: 'P001',
      patientFirstName: 'Maria',
      patientLastName: 'Santos',
      doctorId: 'D001',
      doctorFirstName: 'Dr. Juan',
      doctorLastName: 'Cruz',
      clinicId: 'C001',
      clinicName: 'Metro Medical Center',
      appointmentDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '09:00',
      type: 'general_consultation',
      status: 'completed',
      specialty: 'Cardiology',
      notes: 'Regular checkup',
      patientComplaint: ['Chest pain'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '2',
      patientId: 'P002',
      patientFirstName: 'Pedro',
      patientLastName: 'Garcia',
      doctorId: 'D002',
      doctorFirstName: 'Dr. Ana',
      doctorLastName: 'Martinez',
      clinicId: 'C001',
      clinicName: 'Metro Medical Center',
      appointmentDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '10:30',
      type: 'emergency_assessment',
      status: 'completed',
      specialty: 'Emergency Medicine',
      notes: 'Emergency consultation',
      patientComplaint: ['Fever', 'Cough'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '3',
      patientId: 'P003',
      patientFirstName: 'Luz',
      patientLastName: 'Reyes',
      doctorId: 'D003',
      doctorFirstName: 'Dr. Carlos',
      doctorLastName: 'Lopez',
      clinicId: 'C002',
      clinicName: 'Community Health Clinic',
      appointmentDate: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '14:00',
      type: 'general_consultation',
      status: 'cancelled',
      specialty: 'Dermatology',
      notes: 'Skin consultation',
      patientComplaint: ['Rash'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '4',
      patientId: 'P004',
      patientFirstName: 'Jose',
      patientLastName: 'Torres',
      doctorId: 'D004',
      doctorFirstName: 'Dr. Sofia',
      doctorLastName: 'Gonzalez',
      clinicId: 'C001',
      clinicName: 'Metro Medical Center',
      appointmentDate: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '11:00',
      type: 'lab_booking',
      status: 'completed',
      specialty: 'Laboratory',
      notes: 'Blood test',
      patientComplaint: ['Fatigue'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '5',
      patientId: 'P005',
      patientFirstName: 'Carmen',
      patientLastName: 'Flores',
      doctorId: 'D005',
      doctorFirstName: 'Dr. Miguel',
      doctorLastName: 'Ramos',
      clinicId: 'C002',
      clinicName: 'Community Health Clinic',
      appointmentDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '15:30',
      type: 'general_consultation',
      status: 'completed',
      specialty: 'Pediatrics',
      notes: 'Child checkup',
      patientComplaint: ['Fever'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '6',
      patientId: 'P006',
      patientFirstName: 'Roberto',
      patientLastName: 'Mendoza',
      doctorId: 'D001',
      doctorFirstName: 'Dr. Juan',
      doctorLastName: 'Cruz',
      clinicId: 'C001',
      clinicName: 'Metro Medical Center',
      appointmentDate: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '08:00',
      type: 'general_consultation',
      status: 'completed',
      specialty: 'Cardiology',
      notes: 'Follow-up',
      patientComplaint: ['Heart palpitations'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '7',
      patientId: 'P007',
      patientFirstName: 'Elena',
      patientLastName: 'Cruz',
      doctorId: 'D006',
      doctorFirstName: 'Dr. Patricia',
      doctorLastName: 'Santos',
      clinicId: 'C003',
      clinicName: 'Private Medical Clinic',
      appointmentDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '13:00',
      type: 'general_consultation',
      status: 'cancelled',
      specialty: 'Orthopedics',
      notes: 'Joint pain consultation',
      patientComplaint: ['Knee pain'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '8',
      patientId: 'P008',
      patientFirstName: 'Antonio',
      patientLastName: 'Villanueva',
      doctorId: 'D007',
      doctorFirstName: 'Dr. Roberto',
      doctorLastName: 'Diaz',
      clinicId: 'C001',
      clinicName: 'Metro Medical Center',
      appointmentDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '16:00',
      type: 'emergency_assessment',
      status: 'completed',
      specialty: 'Emergency Medicine',
      notes: 'Accident assessment',
      patientComplaint: ['Back pain'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '9',
      patientId: 'P009',
      patientFirstName: 'Isabel',
      patientLastName: 'Morales',
      doctorId: 'D008',
      doctorFirstName: 'Dr. Elena',
      doctorLastName: 'Vargas',
      clinicId: 'C002',
      clinicName: 'Community Health Clinic',
      appointmentDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '09:30',
      type: 'general_consultation',
      status: 'completed',
      specialty: 'Gynecology',
      notes: 'Regular checkup',
      patientComplaint: ['Menstrual issues'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '10',
      patientId: 'P010',
      patientFirstName: 'Manuel',
      patientLastName: 'Aquino',
      doctorId: 'D009',
      doctorFirstName: 'Dr. Francisco',
      doctorLastName: 'Reyes',
      clinicId: 'C003',
      clinicName: 'Private Medical Clinic',
      appointmentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '10:00',
      type: 'general_consultation',
      status: 'completed',
      specialty: 'Neurology',
      notes: 'Headache consultation',
      patientComplaint: ['Migraine'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    // More recent appointments for better visualization
    {
      id: '11',
      patientId: 'P011',
      patientFirstName: 'Rosa',
      patientLastName: 'Bautista',
      doctorId: 'D010',
      doctorFirstName: 'Dr. Isabel',
      doctorLastName: 'Castro',
      clinicId: 'C001',
      clinicName: 'Metro Medical Center',
      appointmentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '14:30',
      type: 'general_consultation',
      status: 'completed',
      specialty: 'Dermatology',
      notes: 'Skin condition',
      patientComplaint: ['Acne'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '12',
      patientId: 'P012',
      patientFirstName: 'Fernando',
      patientLastName: 'Cortez',
      doctorId: 'D011',
      doctorFirstName: 'Dr. Manuel',
      doctorLastName: 'Ortega',
      clinicId: 'C002',
      clinicName: 'Community Health Clinic',
      appointmentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '11:30',
      type: 'general_consultation',
      status: 'completed',
      specialty: 'Cardiology',
      notes: 'Heart checkup',
      patientComplaint: ['Chest discomfort'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '13',
      patientId: 'P013',
      patientFirstName: 'Dolores',
      patientLastName: 'Herrera',
      doctorId: 'D012',
      doctorFirstName: 'Dr. Ricardo',
      doctorLastName: 'Mendoza',
      clinicId: 'C001',
      clinicName: 'Metro Medical Center',
      appointmentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '16:30',
      type: 'general_consultation',
      status: 'cancelled',
      specialty: 'Orthopedics',
      notes: 'Joint consultation',
      patientComplaint: ['Shoulder pain'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '14',
      patientId: 'P014',
      patientFirstName: 'Alberto',
      patientLastName: 'Perez',
      doctorId: 'D013',
      doctorFirstName: 'Dr. Carmen',
      doctorLastName: 'Flores',
      clinicId: 'C003',
      clinicName: 'Private Medical Clinic',
      appointmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '09:00',
      type: 'general_consultation',
      status: 'completed',
      specialty: 'Pediatrics',
      notes: 'Child wellness check',
      patientComplaint: ['Growth concerns'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '15',
      patientId: 'P015',
      patientFirstName: 'Gloria',
      patientLastName: 'Silva',
      doctorId: 'D014',
      doctorFirstName: 'Dr. Alberto',
      doctorLastName: 'Torres',
      clinicId: 'C002',
      clinicName: 'Community Health Clinic',
      appointmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '13:30',
      type: 'general_consultation',
      status: 'completed',
      specialty: 'Gynecology',
      notes: 'Prenatal care',
      patientComplaint: ['Pregnancy symptoms'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '16',
      patientId: 'P016',
      patientFirstName: 'Ramon',
      patientLastName: 'Guzman',
      doctorId: 'D015',
      doctorFirstName: 'Dr. Gloria',
      doctorLastName: 'Ramos',
      clinicId: 'C001',
      clinicName: 'Metro Medical Center',
      appointmentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '10:30',
      type: 'emergency_assessment',
      status: 'completed',
      specialty: 'Emergency Medicine',
      notes: 'Injury assessment',
      patientComplaint: ['Ankle sprain'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '17',
      patientId: 'P017',
      patientFirstName: 'Teresa',
      patientLastName: 'Navarro',
      doctorId: 'D016',
      doctorFirstName: 'Dr. Ramon',
      doctorLastName: 'Cruz',
      clinicId: 'C003',
      clinicName: 'Private Medical Clinic',
      appointmentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '15:00',
      type: 'general_consultation',
      status: 'completed',
      specialty: 'Neurology',
      notes: 'Memory assessment',
      patientComplaint: ['Memory loss'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    },
    {
      id: '18',
      patientId: 'P018',
      patientFirstName: 'Victor',
      patientLastName: 'Moreno',
      doctorId: 'D017',
      doctorFirstName: 'Dr. Teresa',
      doctorLastName: 'Lopez',
      clinicId: 'C002',
      clinicName: 'Community Health Clinic',
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '08:30',
      type: 'general_consultation',
      status: 'completed',
      specialty: 'Laboratory',
      notes: 'Blood work',
      patientComplaint: ['Fatigue'],
      bookedByUserId: 'U001',
      bookedByUserFirstName: 'Admin',
      bookedByUserLastName: 'User',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      sourceSystem: 'dashboard'
    }
  ];

  // Use sample data for now (replace with realAppointments when removing sample data)
  const appointments = sampleAppointments;

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
      value: referrals.filter(r => r.status === 'pending' || r.status === 'pending_acceptance' || r.status === 'confirmed').length,
      change: "+5%",
      changeType: "positive" as const,
      icon: ArrowRight,
      isClickable: true,
      href: "/appointments?tab=referrals" as const,
    },
  ] : [];



  return (
    <DashboardLayout title="">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back! Here's what's happening with your specialists and appointments.
            </p>
          </div>
        </div>
        

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

        {/* Charts Section */}
        <div className="flex gap-6">
          <AppointmentTrendsChart 
            appointments={appointments} 
            className="w-3/5"
          />
          <PatientVolumeChart 
            feedback={feedback || []}
            appointments={appointments} 
            className="w-2/5"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
