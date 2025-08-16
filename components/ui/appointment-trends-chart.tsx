'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Clock, CheckCircle, XCircle, Filter, BarChart3 } from 'lucide-react';
import {
  ChartContainer,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { Appointment } from '@/lib/types/database';

interface AppointmentTrendsChartProps {
  appointments: Appointment[];
  className?: string;
}

type TimeRange = '7d' | '30d' | '90d' | '1y';
type GroupBy = 'day' | 'week' | 'month';

const chartConfig = {
  completed: {
    label: 'Completed',
    color: '#1e3a8a', // Darker navy blue
  },
  cancelled: {
    label: 'Cancelled',
    color: '#60a5fa', // Lighter sky blue
  },
};

export function AppointmentTrendsChart({ appointments, className }: AppointmentTrendsChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [groupBy, setGroupBy] = useState<GroupBy>('week');
  const [selectedClinic, setSelectedClinic] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique clinics for filtering
  const clinics = useMemo(() => {
    const clinicSet = new Set(appointments.map(a => a.clinicName).filter(Boolean));
    return Array.from(clinicSet).sort();
  }, [appointments]);

  // Filter appointments based on time range and clinic
  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const timeRangeMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    
    const daysBack = timeRangeMap[timeRange];
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      const matchesDate = appointmentDate >= cutoffDate;
      const matchesClinic = selectedClinic === 'all' || appointment.clinicName === selectedClinic;
      
      return matchesDate && matchesClinic;
    });
  }, [appointments, timeRange, selectedClinic]);

  // Process data for chart
  const chartData = useMemo(() => {
    const dataMap = new Map<string, { completed: number; cancelled: number }>();
    
    filteredAppointments.forEach(appointment => {
      const date = new Date(appointment.appointmentDate);
      let key: string;
      
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      const existing = dataMap.get(key) || { completed: 0, cancelled: 0 };
      if (appointment.status === 'completed') {
        existing.completed++;
      } else if (appointment.status === 'cancelled') {
        existing.cancelled++;
      }
      dataMap.set(key, existing);
    });
    
    // Convert to array and sort by date
    return Array.from(dataMap.entries())
      .map(([date, counts]) => ({
        date,
        ...counts,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredAppointments, groupBy]);

  // Calculate enhanced summary stats
  const summaryStats = useMemo(() => {
    const completed = filteredAppointments.filter(a => a.status === 'completed').length;
    const cancelled = filteredAppointments.filter(a => a.status === 'cancelled').length;
    const total = completed + cancelled;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
    const avgPerPeriod = total / Math.max(1, chartData.length);
    
    return {
      completed,
      cancelled,
      total,
      completionRate,
      cancellationRate,
      avgPerPeriod: Math.round(avgPerPeriod * 10) / 10,
    };
  }, [filteredAppointments, chartData]);

  return (
    <div className={className}>
      <Card className="bg-card border-border/50 dark:border-border/30 shadow-sm">
        <CardHeader className="pb-4">
          {/* Main Header with Title and Primary Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-foreground text-lg font-semibold">
                <TrendingUp className="h-5 w-5 text-primary" />
                Appointment Trends
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Completed vs Cancelled appointments over time
              </CardDescription>
            </div>
            
            {/* Primary Controls - Always Visible */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                  <SelectTrigger className="w-32 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <Select value={groupBy} onValueChange={(value: GroupBy) => setGroupBy(value)}>
                  <SelectTrigger className="w-24 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-9 px-3"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
            </div>
          </div>
          
          {/* Expandable Filters Section */}
          {showFilters && (
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">Clinic Filter:</span>
                <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                  <SelectTrigger className="w-48 h-9 text-sm">
                    <SelectValue placeholder="All Clinics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clinics</SelectItem>
                    {clinics.map(clinic => (
                      <SelectItem key={clinic} value={clinic}>
                        {clinic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="pb-6">
          {/* Enhanced Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mb-1" />
              <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                {summaryStats.completed}
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400">Completed</span>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mb-1" />
              <span className="text-lg font-semibold text-red-700 dark:text-red-300">
                {summaryStats.cancelled}
              </span>
              <span className="text-xs text-red-600 dark:text-red-400">Cancelled</span>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mb-1" />
              <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                {summaryStats.completionRate}%
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Success Rate</span>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400 mb-1" />
              <span className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                {summaryStats.avgPerPeriod}
              </span>
              <span className="text-xs text-orange-600 dark:text-orange-400">Avg/Period</span>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-1" />
              <span className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                {summaryStats.total}
              </span>
              <span className="text-xs text-purple-600 dark:text-purple-400">Total</span>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full aspect-[2/1] mb-4">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="cancelledGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs dark:text-gray-400"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      if (groupBy === 'day') {
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      } else if (groupBy === 'week') {
                        return `Week ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                      } else {
                        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                      }
                    }}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                  />
                  <YAxis 
                    className="text-xs dark:text-gray-400"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                  />
                  
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-white dark:bg-gray-800 p-3 shadow-lg">
                            <div className="space-y-2">
                              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm border-b pb-1">
                                {new Date(label).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </div>
                              <div className="space-y-1">
                                {payload.map((entry: any) => (
                                  <div key={entry.dataKey} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-3 w-3 rounded-sm"
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label}
                                      </span>
                                    </div>
                                    <span className="font-semibold text-sm" style={{ color: entry.color }}>
                                      {entry.value} appointments
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stackId="1"
                    stroke="#1e3a8a"
                    fill="url(#completedGradient)"
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="cancelled"
                    stackId="1"
                    stroke="#60a5fa"
                    fill="url(#cancelledGradient)"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          
          {/* Enhanced Legend */}
          <div className="flex justify-center">
            <Legend
              content={({ payload }) => (
                <div className="flex items-center justify-center gap-4">
                  {payload?.map((entry: any) => (
                    <div key={entry.value} className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
