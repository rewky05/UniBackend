"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useNavigationLoading } from "@/hooks/useNavigationLoading";
import { useDashboardData, useSpecialists, useActivityLogs } from "@/hooks/useOptimizedData";
import { useRealAppointments, useRealReferrals, useRealSpecialistReferrals, useRealFeedback } from "@/hooks/useRealData";
import { useUnifiedAppointmentData } from "@/hooks/useUnifiedAppointmentData";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatDateToText } from "@/lib/utils";
import { LoadingSpinner, ErrorState } from "@/components/ui/loading-states";
import { IndividualConsultationsTable } from "@/components/ui/individual-consultations-table";
import { useConsultationTime } from "@/hooks/useConsultationTime";
import { formatConsultationTime, calculateConsultationTime } from "@/lib/utils/consultation-time";
import { getValidationSummary } from "@/lib/utils/data-validation";
import { ConsultationTimeChart } from "@/components/ui/consultation-time-chart";
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
import type { Appointment } from '@/lib/types/database';

export default function DashboardPage() {
  // Navigation loading hook
  const { navigateWithLoading } = useNavigationLoading({
    loadingMessage: '', // No message for clean navigation
    delay: 1000,
  });

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
  const { referrals: realReferrals, loading: referralsLoading } = useRealReferrals();
  const { specialistReferrals: realSpecialistReferrals, loading: specialistReferralsLoading } = useRealSpecialistReferrals();
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
      lastUpdated: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(), // 45 min consultation
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
      lastUpdated: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // 30 min consultation
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
      lastUpdated: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 60 min consultation
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
      lastUpdated: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(), // 20 min consultation
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
      lastUpdated: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(), // 35 min consultation
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
      lastUpdated: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(), // 50 min consultation
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
      lastUpdated: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(), // 40 min consultation
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
      lastUpdated: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(), // 25 min consultation
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
      lastUpdated: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000 + 55 * 60 * 1000).toISOString(), // 55 min consultation
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
      lastUpdated: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000 + 70 * 60 * 1000).toISOString(), // 70 min consultation
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
      lastUpdated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // 30 min consultation
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
      lastUpdated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(), // 45 min consultation
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
      lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(), // 35 min consultation
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
      lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(), // 40 min consultation
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
      lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(), // 50 min consultation
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
      lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(), // 25 min consultation
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
      lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 60 min consultation
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
      lastUpdated: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min consultation
      sourceSystem: 'dashboard'
    }
  ];

  // Sample referral data for demonstration
  const sampleReferrals = [
    {
      id: 'R001',
      patientId: 'P020',
      referringGeneralistId: 'D001',
      assignedSpecialistId: 'D005',
      clinicAppointmentId: 'A020',
      initialReasonForReferral: 'Cardiac evaluation needed',
      generalistNotes: 'Patient shows signs of cardiac issues',
      appointmentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '10:00',
      status: 'completed' as const,
      referralTimestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(), // 90 min consultation
      patientArrivalConfirmed: true,
      practiceLocation: {
        clinicId: 'C001',
        roomOrUnit: 'Cardiology Unit'
      },
      referringClinicId: 'C001',
      sourceSystem: 'dashboard',
      specialistScheduleId: 'S001',
      scheduleSlotPath: 'schedules/S001/slots/1'
    },
    {
      id: 'R002',
      patientId: 'P021',
      referringGeneralistId: 'D002',
      assignedSpecialistId: 'D006',
      clinicAppointmentId: 'A021',
      initialReasonForReferral: 'Neurological assessment',
      generalistNotes: 'Patient experiencing memory issues',
      appointmentDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '14:30',
      status: 'completed' as const,
      referralTimestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000 + 75 * 60 * 1000).toISOString(), // 75 min consultation
      patientArrivalConfirmed: true,
      practiceLocation: {
        clinicId: 'C002',
        roomOrUnit: 'Neurology Unit'
      },
      referringClinicId: 'C002',
      sourceSystem: 'dashboard',
      specialistScheduleId: 'S002',
      scheduleSlotPath: 'schedules/S002/slots/2'
    },
    {
      id: 'R003',
      patientId: 'P022',
      referringGeneralistId: 'D003',
      assignedSpecialistId: 'D007',
      clinicAppointmentId: 'A022',
      initialReasonForReferral: 'Orthopedic evaluation',
      generalistNotes: 'Patient with chronic back pain',
      appointmentDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '09:00',
      status: 'completed' as const,
      referralTimestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 + 65 * 60 * 1000).toISOString(), // 65 min consultation
      patientArrivalConfirmed: true,
      practiceLocation: {
        clinicId: 'C003',
        roomOrUnit: 'Orthopedics Unit'
      },
      referringClinicId: 'C003',
      sourceSystem: 'dashboard',
      specialistScheduleId: 'S003',
      scheduleSlotPath: 'schedules/S003/slots/3'
    }
  ];

  // Use real data from Firebase, with sample data fallback for demonstration
  const appointments = realAppointments && realAppointments.length > 0 ? realAppointments : sampleAppointments;
  const referrals = realReferrals && realReferrals.length > 0 ? realReferrals : sampleReferrals;
  const specialistReferrals = realSpecialistReferrals && realSpecialistReferrals.length > 0 ? realSpecialistReferrals : [];

  // Use unified appointment data for consistent counting across all components
  const unifiedData = useUnifiedAppointmentData(appointments, referrals);

  // Calculate consultation time statistics using custom hook - including both referral types
  const { consultationTimeStats } = useConsultationTime(appointments, referrals, specialistReferrals);

  // Transform consultation time stats data for the chart
  // Use the same data as the stats calculation for consistency
  const consultationTimeData = useMemo(() => {
    // Convert individualConsultations to chart data format
    const chartData = consultationTimeStats.individualConsultations.map(consultation => ({
      id: consultation.id,
      date: consultation.appointmentDate,
      duration: consultation.consultationTimeMinutes,
      specialty: consultation.specialty,
      doctorName: consultation.doctorName,
      patientName: consultation.patientName,
      status: 'completed' as const, // All individual consultations are completed
    }));
    
    // Sort by date for better visualization
    chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    console.log('Consultation time chart data (unified):', {
      totalFromStats: consultationTimeStats.totalCompletedConsultations,
      chartDataPoints: chartData.length,
      averageFromStats: consultationTimeStats.averageConsultationTimeMinutes,
      usingRealData: realAppointments && realAppointments.length > 0,
      usingSampleData: !realAppointments || realAppointments.length === 0,
      chartData: chartData.slice(0, 5), // Log first 5 for debugging
    });
    
    return chartData;
  }, [consultationTimeStats, realAppointments]);

  // Show loading state
  if (dashboardLoading || specialistsLoading || appointmentsLoading || referralsLoading) {
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

  // Debug: Log the data to see what we're working with
  console.log('=== DASHBOARD DATA DEBUG ===');
  console.log('Appointments loading:', appointmentsLoading);
  console.log('Referrals loading:', referralsLoading);
  console.log('Real Appointments count:', realAppointments?.length || 0);
  console.log('Real Referrals count:', realReferrals?.length || 0);
  console.log('Using appointments:', appointments.length);
  console.log('Using referrals:', referrals.length);
  console.log('Using sample data:', !realAppointments || realAppointments.length === 0);
  
  // Log unified data counts
  console.log('=== UNIFIED DATA COUNTS ===');
  console.log('Total Appointments + Referrals:', unifiedData.totalAppointmentsAndReferrals);
  console.log('Total Completed:', unifiedData.totalCompleted);
  console.log('Total Cancelled:', unifiedData.totalCancelled);
  console.log('Consultation Time Eligible:', unifiedData.totalConsultationTimeEligible);
  
  // Log validation summary
  const validationSummary = getValidationSummary(appointments, referrals);
  console.log('=== DATA VALIDATION SUMMARY ===');
  console.log('Valid for consultation time:', validationSummary.validForConsultationTime);
  console.log('Invalid for consultation time:', validationSummary.invalidForConsultationTime);
  if (validationSummary.validationErrors.length > 0) {
    console.warn('Validation errors:', validationSummary.validationErrors);
  }
  if (validationSummary.validationWarnings.length > 0) {
    console.warn('Validation warnings:', validationSummary.validationWarnings);
  }

    // Calculate stats from cached data using unified data
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
      value: unifiedData.totalAppointmentsAndReferrals,
      change: "+15%",
      changeType: "positive" as const,
      icon: Calendar,
      isClickable: true,
      href: "/appointments" as const,
    },
    {
      title: "Avg Consultation Time",
      value: `${Math.round(consultationTimeStats.averageConsultationTimeMinutes)} min`,
      change: `${consultationTimeStats.totalCompletedConsultations} completed`,
      changeType: "positive" as const,
      icon: Clock,
      isClickable: false,
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
                <div 
                  onClick={() => navigateWithLoading(stat.href!)}
                  className="block cursor-pointer"
                >
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
                </div>
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
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <AppointmentTrendsChart 
              appointments={appointments} 
              referrals={referrals}
              className="w-full"
            />
          </div>
          <div className="lg:col-span-2">
            <ConsultationTimeChart 
              data={consultationTimeData}
              className="w-full"
              isSampleData={!realAppointments || realAppointments.length === 0}
            />
          </div>
        </div>


        {/* Individual Consultations Table */}
        <IndividualConsultationsTable 
          consultations={consultationTimeStats.individualConsultations}
          limit={5}
        />
      </div>
    </DashboardLayout>
  );
}
