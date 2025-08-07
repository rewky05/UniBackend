"use client";

import Link from "next/link";
import { useDashboardData, useSpecialists, useActivityLogs } from "@/hooks/useOptimizedData";
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
} from "lucide-react";


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
      isClickable: false,
    },
    {
      title: "Pending Verifications",
      value: specialists.filter(d => d.status === 'pending').length,
      change: "-5%",
      changeType: "negative" as const,
      icon: UserX,
      isClickable: true,
      href: "/doctors?status=pending" as const,
    },
    {
      title: "Active Clinics",
      value: dashboardData?.totalClinics || 0,
      change: "+3%",
      changeType: "positive" as const,
      icon: Calendar,
      isClickable: false,
    },
  ] : [];

  // Recent activity from cached data
  const activityList = activityLogs.slice(0, 5).map((activity: any) => ({
    id: activity.id,
    title: activity.action,
    description: activity.description,
    timestamp: activity.timestamp,
    type: activity.type,
  }));

  return (
    <DashboardLayout title="">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your specialists.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
                         <Card 
               key={stat.title} 
               className={stat.isClickable 
                 ? "cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100" 
                 : "bg-card"
               }
             >
              {stat.isClickable ? (
                <Link href={stat.href!} className="block">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-900">{stat.title}</CardTitle>
                    <div className="flex items-center space-x-1">
                      <stat.icon className="h-4 w-4 text-blue-600" />
                      <ArrowRight className="h-3 w-3 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">{stat.value}</div>
                    <p className={`text-xs ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
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
                       stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                     }`}>
                       {stat.change} from last month
                     </p>
                   </CardContent>
                 </>
               )}
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest updates and activities in your system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityList.length > 0 ? (
                  activityList.map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      No activities to display at this time
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Pending Tasks
              </CardTitle>
              <CardDescription>
                Tasks that require your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending tasks</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No tasks require your attention at this time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
