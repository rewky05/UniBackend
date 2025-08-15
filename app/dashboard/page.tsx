"use client";

import { useState } from "react";
import Link from "next/link";
import { useDashboardData, useSpecialists, useActivityLogs } from "@/hooks/useOptimizedData";
import { useRealAppointments, useRealReferrals } from "@/hooks/useRealData";
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
  const { appointments, loading: appointmentsLoading } = useRealAppointments();
  const { referrals, loading: referralsLoading } = useRealReferrals();

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
      <div className="space-y-8">
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

        {/* Interactive Area Chart */}
        <AppointmentTrendsChart 
          appointments={appointments} 
          className="w-full"
        />
      </div>
    </DashboardLayout>
  );
}
