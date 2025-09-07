'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from 'recharts';

interface ConsultationTimeData {
  id: string;
  date: string;
  duration: number; // in minutes
  specialty?: string;
  doctorName?: string;
  patientName?: string;
  status: 'completed' | 'cancelled' | 'no-show';
}

interface ConsultationTimeChartProps {
  data: ConsultationTimeData[];
  className?: string;
  isSampleData?: boolean;
}

type TimeRange = '7d' | '30d' | '90d';

export function ConsultationTimeChart({ data, className, isSampleData = false }: ConsultationTimeChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');

  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = new Date();
    const timeRangeMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    
    const daysBack = timeRangeMap[timeRange];
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
  }, [data, timeRange]);

  // Process data for chart - group by week or day based on time range
  const chartData = useMemo(() => {
    const dataMap = new Map<string, { 
      totalDuration: number; 
      count: number; 
      averageDuration: number;
    }>();
    
    // Group data by week for longer ranges, by day for 7-day range
    filteredData.forEach(item => {
      const date = new Date(item.date);
      let key: string;
      
      if (timeRange === '7d') {
        // For 7-day range, group by individual day
        key = date.toISOString().split('T')[0];
      } else {
        // For longer ranges, group by week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        key = weekStart.toISOString().split('T')[0];
      }
      
      const existing = dataMap.get(key) || { 
        totalDuration: 0, 
        count: 0, 
        averageDuration: 0
      };
      
      existing.totalDuration += item.duration;
      existing.count++;
      existing.averageDuration = existing.totalDuration / existing.count;
      
      dataMap.set(key, existing);
    });
    
    // Convert to array and sort by date
    const result = Array.from(dataMap.entries())
      .map(([date, stats]) => ({
        date,
        averageDuration: Math.round(stats.averageDuration * 10) / 10,
        totalConsultations: stats.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    console.log('Chart data for line chart:', {
      timeRange,
      totalDataPoints: result.length,
      dataPoints: result,
      filteredDataCount: filteredData.length,
      filteredData: filteredData.map(item => ({ date: item.date, duration: item.duration }))
    });
    
    return result;
  }, [filteredData]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        averageDuration: 0,
        totalConsultations: 0,
      };
    }

    // Only include items with valid consultation times (> 0) for average calculation
    // This ensures consistency with the consultation time stats calculation
    const validDurations = filteredData
      .filter(item => item.duration > 0)
      .map(item => item.duration);
    
    const averageDuration = validDurations.length > 0 
      ? Math.round(validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length)
      : 0;

    console.log('Consultation Time Chart Summary Stats:', {
      totalFilteredData: filteredData.length,
      validDurationsCount: validDurations.length,
      validDurations: validDurations,
      averageDuration,
      allDurations: filteredData.map(item => item.duration)
    });

    return {
      averageDuration,
      totalConsultations: filteredData.length, // Still show total count including 0-duration items
    };
  }, [filteredData]);

  // Target duration line (25 minutes)
  const targetDuration = 25;

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const dateLabel = timeRange === '7d' 
        ? new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : `Week of ${new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {dateLabel}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Average: {data.averageDuration} min
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Consultations: {data.totalConsultations}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            
              <CardTitle className="text-lg">Consultation Time Trends</CardTitle>
            </div>
            
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Simple stats */}
          <div className="flex gap-4 mb-4 text-sm">
            <div>
              <span className="font-medium">Average:</span> {summaryStats.averageDuration} min
            </div>
            <div>
              <span className="font-medium">Total:</span> {summaryStats.totalConsultations} consultations
            </div>
            {isSampleData && (
              <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                Sample Data
              </div>
            )}
          </div>

          {/* Clean shadcn-style line chart */}
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 20, left: -30, bottom: 20 }}>
                {/* Subtle horizontal grid lines only */}
                <CartesianGrid 
                  strokeDasharray="0" 
                  stroke="#f3f4f6" 
                  horizontal={true}
                  vertical={false}
                />
                
                {/* X-axis with dynamic labels based on time range */}
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    if (timeRange === '7d') {
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    } else {
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }
                  }}
                  fontSize={11}
                  stroke="#6b7280"
                  tickLine={false}
                  axisLine={false}
                />
                
                {/* Y-axis with minutes labels */}
                <YAxis 
                  tickFormatter={(value) => `${value} min`}
                  fontSize={11}
                  stroke="#6b7280"
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                
                {/* Custom tooltip */}
                <Tooltip content={<CustomTooltip />} />
                
                {/* Target reference line */}
                <ReferenceLine 
                  y={targetDuration} 
                  stroke="#f59e0b"
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                />
                
                {/* Smooth shadcn-style line */}
                <Line
                  type="monotone"
                  dataKey="averageDuration"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#3b82f6",
                    stroke: "#ffffff",
                    strokeWidth: 2
                  }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
