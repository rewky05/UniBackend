'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
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
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [selectedClinic, setSelectedClinic] = useState<string>('all');

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

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const completed = filteredAppointments.filter(a => a.status === 'completed').length;
    const cancelled = filteredAppointments.filter(a => a.status === 'cancelled').length;
    
    return {
      completed,
      cancelled,
      total: completed + cancelled,
    };
  }, [filteredAppointments]);

  return (
    <div className={`w-2/3 ${className}`}>
      <Card className="bg-card border-border/50 dark:border-border/30">
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Appointment Trends
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Completed vs Cancelled appointments over time
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Select value={groupBy} onValueChange={(value: GroupBy) => setGroupBy(value)}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Clinic Filter */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-medium text-foreground">Clinic:</span>
            <Select value={selectedClinic} onValueChange={setSelectedClinic}>
              <SelectTrigger className="w-40 h-8 text-xs">
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
        </CardHeader>
        
        <CardContent className="pb-4">
          {/* Summary Stats */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-blue-700 dark:text-blue-400" />
              <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950/30 text-xs px-2 py-0">
                Completed: {summaryStats.completed}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-blue-500 dark:text-blue-300" />
              <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50 dark:border-blue-700 dark:text-blue-200 dark:bg-blue-950/30 text-xs px-2 py-0">
                Cancelled: {summaryStats.cancelled}
              </Badge>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[180px] w-full">
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
                    className="text-xs"
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
                    className="dark:text-gray-400"
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    className="dark:text-gray-400"
                  />
                  
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-white dark:bg-gray-800 p-2 shadow-lg">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                                {new Date(label).toLocaleDateString()}
                              </div>
                              {payload.map((entry: any) => (
                                <div key={entry.dataKey} className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600 dark:text-gray-300">
                                    {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label}
                                  </span>
                                  <span className="font-semibold text-xs" style={{ color: entry.color }}>
                                    {entry.value}
                                  </span>
                                </div>
                              ))}
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
          
          {/* Legend */}
          <div className="flex justify-center mt-2">
            <Legend
              content={({ payload }) => (
                <div className="flex items-center justify-center gap-4">
                  {payload?.map((entry: any) => (
                    <div key={entry.value} className="flex items-center gap-1">
                      <div
                        className="h-2 w-2 rounded-sm"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-300">
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
