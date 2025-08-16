'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, TrendingDown, Minus, Smile, Frown, Meh, MessageSquare, Activity } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import type { Feedback, Appointment } from '@/lib/types/database';

interface PatientSatisfactionChartProps {
  feedback: Feedback[];
  appointments: Appointment[];
  className?: string;
}

type TimeRange = '7d' | '30d' | '90d' | '1y';
type ChartType = 'rating' | 'sentiment' | 'comparison';

const chartConfig = {
  rating: {
    label: 'Average Rating',
    color: '#f59e0b',
  },
  positive: {
    label: 'Positive',
    color: '#10b981',
  },
  negative: {
    label: 'Negative',
    color: '#ef4444',
  },
  neutral: {
    label: 'Neutral',
    color: '#6b7280',
  },
};

export function PatientSatisfactionChart({ feedback, appointments, className }: PatientSatisfactionChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedClinic, setSelectedClinic] = useState<string>('all');
  const [chartType, setChartType] = useState<ChartType>('rating');

  // Safety check for undefined feedback
  const safeFeedback = feedback || [];

  // Get unique clinics for filtering
  const clinics = useMemo(() => {
    const clinicSet = new Set(safeFeedback.map(f => f.clinicName).filter(Boolean));
    return Array.from(clinicSet).sort();
  }, [safeFeedback]);

  // Filter feedback based on time range and clinic
  const filteredFeedback = useMemo(() => {
    const now = new Date();
    const timeRangeMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    
    const daysBack = timeRangeMap[timeRange];
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    return safeFeedback.filter(feedback => {
      const feedbackDate = new Date(feedback.appointmentDate);
      const matchesDate = feedbackDate >= cutoffDate;
      const matchesClinic = selectedClinic === 'all' || feedback.clinicName === selectedClinic;
      
      return matchesDate && matchesClinic;
    });
  }, [safeFeedback, timeRange, selectedClinic]);

  // Process data for rating trends
  const ratingData = useMemo(() => {
    const dataMap = new Map<string, { totalRating: number; count: number; ratings: number[] }>();
    
    filteredFeedback.forEach(feedback => {
      const date = new Date(feedback.appointmentDate);
      const timeKey = date.toISOString().split('T')[0];
      
      const existing = dataMap.get(timeKey) || { totalRating: 0, count: 0, ratings: [] };
      existing.totalRating += feedback.rating;
      existing.count += 1;
      existing.ratings.push(feedback.rating);
      dataMap.set(timeKey, existing);
    });
    
    return Array.from(dataMap.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        averageRating: Math.round((data.totalRating / data.count) * 10) / 10,
        totalFeedback: data.count,
        ratings: data.ratings,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredFeedback]);

  // Process data for sentiment trends
  const sentimentData = useMemo(() => {
    const dataMap = new Map<string, { positive: number; negative: number; neutral: number }>();
    
    filteredFeedback.forEach(feedback => {
      const date = new Date(feedback.appointmentDate);
      const timeKey = date.toISOString().split('T')[0];
      
      const existing = dataMap.get(timeKey) || { positive: 0, negative: 0, neutral: 0 };
      if (feedback.sentiment === 'positive') existing.positive += 1;
      else if (feedback.sentiment === 'negative') existing.negative += 1;
      else existing.neutral += 1;
      dataMap.set(timeKey, existing);
    });
    
    return Array.from(dataMap.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        positive: data.positive,
        negative: data.negative,
        neutral: data.neutral,
        total: data.positive + data.negative + data.neutral,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredFeedback]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalFeedback = filteredFeedback.length;
    const averageRating = totalFeedback > 0 
      ? Math.round((filteredFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback) * 10) / 10
      : 0;
    
    const sentimentCounts = {
      positive: filteredFeedback.filter(f => f.sentiment === 'positive').length,
      negative: filteredFeedback.filter(f => f.sentiment === 'negative').length,
      neutral: filteredFeedback.filter(f => f.sentiment === 'neutral').length,
    };
    
    const satisfactionRate = totalFeedback > 0 
      ? Math.round((sentimentCounts.positive / totalFeedback) * 100)
      : 0;
    
    // Calculate trend (comparing recent vs older ratings)
    const recentData = ratingData.slice(-3);
    const olderData = ratingData.slice(-6, -3);
    const recentAvg = recentData.length > 0 
      ? recentData.reduce((sum, d) => sum + d.averageRating, 0) / recentData.length 
      : 0;
    const olderAvg = olderData.length > 0 
      ? olderData.reduce((sum, d) => sum + d.averageRating, 0) / olderData.length 
      : 0;
    const ratingTrend = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;
    
    return {
      totalFeedback,
      averageRating,
      satisfactionRate,
      ratingTrend,
      sentimentCounts,
    };
  }, [filteredFeedback, ratingData]);

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Get sentiment icon
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="h-4 w-4" />;
      case 'negative': return <Frown className="h-4 w-4" />;
      default: return <Meh className="h-4 w-4" />;
    }
  };

  return (
    <div className={className}>
      <Card className="bg-card border-border/50 dark:border-border/30 shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-6">
          {/* Header */}
          <div className="space-y-4 mb-6">
            {/* Title and Description */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl shadow-sm">
                <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-foreground text-xl font-bold tracking-tight">
                  Patient Satisfaction
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                  Feedback trends and sentiment analysis
                </CardDescription>
              </div>
            </div>
            
            {/* Time Range Control */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Time Range:</span>
              <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger className="w-36 h-10 text-sm font-medium border-border/60 hover:border-border transition-colors">
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
            
            {/* Chart Type Controls */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Chart Type:</span>
              <div className="flex border border-border/60 rounded-lg p-1 bg-muted/30">
                {(['rating', 'sentiment', 'comparison'] as ChartType[]).map((type) => (
                  <Button
                    key={type}
                    variant={chartType === type ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setChartType(type)}
                    className="h-8 px-4 text-xs font-medium transition-all duration-200 hover:scale-105"
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-3">
            <div className="group relative">
              <div className="flex flex-col items-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all duration-200">
                <Star className="h-4 w-4 text-amber-600 dark:text-amber-400 mb-1" />
                <span className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                  {summaryStats.averageRating}
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400">Rating</span>
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                Average Rating
              </div>
            </div>
            
            <div className="group relative">
              <div className="flex flex-col items-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all duration-200">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                  {summaryStats.satisfactionRate}%
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">Happy</span>
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                Satisfaction Rate
              </div>
            </div>
            
            <div className="group relative">
              <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-200">
                <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 mb-1" />
                <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                  {summaryStats.totalFeedback}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400">Total</span>
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                Total Reviews
              </div>
            </div>
            
            {summaryStats.ratingTrend !== 0 ? (
              <div className="group relative">
                <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all duration-200">
                  {summaryStats.ratingTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 mb-1" />
                  )}
                  <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                    {summaryStats.ratingTrend > 0 ? '+' : ''}{summaryStats.ratingTrend}%
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Change</span>
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Rating Trend
                </div>
              </div>
            ) : (
              <div className="group relative">
                <div className="flex flex-col items-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all duration-200">
                  <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400 mb-1" />
                  <span className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                    {summaryStats.sentimentCounts.positive + summaryStats.sentimentCounts.negative}
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-400">Active</span>
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Active Sentiments
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pb-8">
          {/* Chart */}
          <div className="w-full aspect-[2/1] mb-2">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'rating' ? (
                  <LineChart data={ratingData} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs dark:text-gray-400"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                    />
                    <YAxis 
                      domain={[Math.floor(Math.min(...ratingData.map(d => d.averageRating)) - 0.5), 5]}
                      className="text-xs dark:text-gray-400"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                      tickFormatter={(value) => value.toString()}
                    />
                    
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <ChartTooltipContent className="bg-background border border-border shadow-lg rounded-lg p-3">
                              <div className="space-y-2">
                                <div className="font-semibold text-sm text-foreground">
                                  {label}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                                    {payload[0]?.value}
                                  </span> / 5 rating
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {payload[0]?.payload.totalFeedback} reviews
                                </div>
                              </div>
                            </ChartTooltipContent>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="averageRating"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, stroke: '#f59e0b', strokeWidth: 3, fill: '#ffffff' }}
                    />
                  </LineChart>
                ) : chartType === 'sentiment' ? (
                  <BarChart data={sentimentData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs dark:text-gray-400"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                    />
                    <YAxis 
                      className="text-xs dark:text-gray-400"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                      domain={[0, 'dataMax + 1']}
                    />
                    
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <ChartTooltipContent className="bg-background border border-border shadow-lg rounded-lg p-3">
                              <div className="space-y-2">
                                <div className="font-semibold text-sm text-foreground">
                                  {label}
                                </div>
                                {payload.map((entry: any) => (
                                  <div key={entry.dataKey} className="flex items-center justify-between text-sm">
                                    <span className="capitalize text-muted-foreground">{entry.dataKey}</span>
                                    <span className="font-semibold" style={{ color: entry.color }}>
                                      {entry.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </ChartTooltipContent>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    <Bar dataKey="positive" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="neutral" fill="#6b7280" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="negative" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                ) : (
                  <AreaChart data={sentimentData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs dark:text-gray-400"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                    />
                    <YAxis 
                      className="text-xs dark:text-gray-400"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                    />
                    
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <ChartTooltipContent className="bg-background border border-border shadow-lg rounded-lg p-3">
                              <div className="space-y-2">
                                <div className="font-semibold text-sm text-foreground">
                                  {label}
                                </div>
                                {payload.map((entry: any) => (
                                  <div key={entry.dataKey} className="flex items-center justify-between text-sm">
                                    <span className="capitalize text-muted-foreground">{entry.dataKey}</span>
                                    <span className="font-semibold" style={{ color: entry.color }}>
                                      {entry.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </ChartTooltipContent>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    <Area
                      type="monotone"
                      dataKey="positive"
                      stroke="#10b981"
                      fill="url(#positiveGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="negative"
                      stroke="#ef4444"
                      fill="url(#negativeGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          
          {/* Sentiment Legend */}
          {chartType === 'sentiment' && (
            <div className="flex justify-center gap-4">
              {['positive', 'neutral', 'negative'].map((sentiment) => (
                <div key={sentiment} className="flex items-center gap-2 px-2 py-1 rounded text-xs">
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: getSentimentColor(sentiment) }}
                  />
                  <span className="text-foreground font-medium capitalize">
                    {sentiment}
                  </span>
                  <span className="text-muted-foreground">
                    ({summaryStats.sentimentCounts[sentiment as keyof typeof summaryStats.sentimentCounts]})
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Export both names to maintain compatibility
export { PatientSatisfactionChart as PatientVolumeChart };
