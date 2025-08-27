'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label,
  Sector,
} from 'recharts';
import type { Feedback, Appointment } from '@/lib/types/database';

interface PatientSatisfactionChartProps {
  feedback: Feedback[];
  appointments: Appointment[];
  className?: string;
}

type TimeRange = '7d' | '30d' | '90d' | '1y';
// Subtle blue palette (lighter → slightly darker), aligned with AppointmentTrends
const donutColors = ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa'];

export function PatientSatisfactionChart({ feedback, appointments, className }: PatientSatisfactionChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Safety check for undefined feedback
  const safeFeedback = feedback || [];

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
      if (!feedback.appointmentDate) return false;
      const feedbackDate = new Date(feedback.appointmentDate);
      return feedbackDate >= cutoffDate;
    });
  }, [safeFeedback, timeRange]);
  const ratingDistribution = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1|2|3|4|5, number>;
    for (const item of filteredFeedback) {
      if (!item.rating) continue;
      const r = Math.min(5, Math.max(1, Math.round(item.rating))) as 1|2|3|4|5;
      counts[r] += 1;
    }
    return [1, 2, 3, 4, 5].map((rating, idx) => ({
      rating,
      label: `${rating} Star${rating > 1 ? 's' : ''}`,
      value: counts[rating as 1|2|3|4|5],
      color: donutColors[idx],
    }));
  }, [filteredFeedback]);

  const totalReviews = filteredFeedback.length;
  const satisfactionRate = useMemo(() => {
    if (totalReviews === 0) return 0;
    const positive = filteredFeedback.filter(f => f.sentiment === 'positive').length;
    return Math.round((positive / totalReviews) * 1000) / 10; // 0.1% precision
  }, [filteredFeedback, totalReviews]);
  const timeRangeLabel = useMemo(() => {
    switch (timeRange) {
      case '7d': return 'the last 7 days';
      case '30d': return 'the last 30 days';
      case '90d': return 'the last 90 days';
      case '1y': return 'the last year';
      default: return 'the selected time range';
    }
  }, [timeRange]);
  // Previous period count (same length as current period)
  const previousPeriodCount = useMemo(() => {
    const now = new Date();
    const timeRangeMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    } as const;
    const daysBack = timeRangeMap[timeRange];
    const cutoffCurrent = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const cutoffPrevious = new Date(cutoffCurrent.getTime() - daysBack * 24 * 60 * 60 * 1000);
    return safeFeedback.filter((f) => {
      if (!f.appointmentDate) return false;
      const d = new Date(f.appointmentDate);
      return d >= cutoffPrevious && d < cutoffCurrent;
    }).length;
  }, [safeFeedback, timeRange]);

  const trendPercent = useMemo(() => {
    if (previousPeriodCount <= 0) return 0;
    const delta = totalReviews - previousPeriodCount;
    return Math.round((delta / previousPeriodCount) * 1000) / 10; // 0.1% precision
  }, [totalReviews, previousPeriodCount]);
  const donutChartConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    for (const d of ratingDistribution) {
      cfg[d.label] = { label: d.label, color: d.color };
    }
    return cfg;
  }, [ratingDistribution]);

  // UI-only: active slice "pull-out" rendering
  const activeSliceShape = (props: any) => {
    const RAD = Math.PI / 180;
    const pull = 10; // how far to pull the slice outward
    const {
      midAngle = 0,
      outerRadius = 0,
    } = props || {};
    const sin = Math.sin(-midAngle * RAD);
    const cos = Math.cos(-midAngle * RAD);
    const dx = cos * pull;
    const dy = sin * pull;

    return (
      <g transform={`translate(${dx}, ${dy})`} style={{ transition: 'transform 200ms ease' }}>
        <Sector {...props} outerRadius={outerRadius + 8} />
      </g>
    );
  };

  return (
    <div className={className}>
      <Card className="bg-card border-border/50 dark:border-border/30 shadow-sm transition-all duration-200">
        <CardHeader className="pb-6">
          {/* Header */}
          <div className="space-y-4 mb-6">
            {/* Title and Description */}
            <div className="flex items-center gap-4">
           
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
            
          </div>
          
        </CardHeader>
        
        <CardContent className="pb-8">
          {/* Donut Chart */}
          <div className="w-full aspect-[2/1] mb-2">
            <ChartContainer config={donutChartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        nameKey="label"
                        formatter={(value, name, item) => {
                          const count = (value as number) ?? 0;
                          const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 1000) / 10 : 0;
                          const color = (item && 'payload' in (item as any)) ? (item as any).payload.color : undefined;
                          return (
                            <div className="flex items-center justify-between gap-8 w-full">
                              <div className="flex items-center gap-2">
                                <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
                                <span className="text-xs text-muted-foreground">{name}</span>
                              </div>
                              <span className="text-xs font-medium text-foreground">{count} • {percent}%</span>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <Pie
                    data={ratingDistribution}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={60}
                    outerRadius={115}
                    paddingAngle={2}
                    stroke="#ffffff"
                    strokeWidth={2}
                    activeIndex={typeof activeIndex === 'number' ? activeIndex : undefined}
                    activeShape={activeSliceShape}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {ratingDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        tabIndex={0}
                        role="button"
                        aria-label={`${entry.label}: ${entry.value} reviews`}
                        onFocus={() => setActiveIndex(index)}
                        onBlur={() => setActiveIndex(null)}
                        onKeyDown={(e: any) => {
                          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                            e.preventDefault();
                            const dir = e.key === 'ArrowRight' ? 1 : -1;
                            const next = ((activeIndex ?? 0) + dir + ratingDistribution.length) % ratingDistribution.length;
                            setActiveIndex(next);
                          }
                        }}
                      />
                    ))}
                    <Label
                      position="center"
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          const { cx, cy } = viewBox as { cx: number; cy: number };
                          const hovered = typeof activeIndex === 'number' ? ratingDistribution[activeIndex] : null;
                          const centerPrimary = hovered ? hovered.value.toLocaleString() : totalReviews.toLocaleString();
                          const centerSecondary = hovered
                            ? `${hovered.label} • ${totalReviews > 0 ? Math.round((hovered.value / totalReviews) * 1000) / 10 : 0}%`
                            : 'Reviews';
                          return (
                            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={cx} y={cy} className="fill-foreground text-3xl font-bold">
                                {centerPrimary}
                              </tspan>
                              <tspan x={cx} y={cy + 18} className="fill-muted-foreground text-xs">
                                {centerSecondary}
                              </tspan>
                            </text>
                          );
                        }
                        return null;
                      }}
                    />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          {/* Removed static legend to show data only on hover */}
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2 font-semibold text-sm text-foreground">
              <span>Patient satisfaction</span>
              <span className={`${satisfactionRate > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {satisfactionRate.toFixed(1)}%
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Showing total reviews for {timeRangeLabel}
            </div>
          </div>
          {/* Mobile legend for accessibility */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs md:hidden">
            {ratingDistribution.map((d) => (
              <div key={d.rating} className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-[2px]" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground">{d.label}</span>
                <span className="text-foreground font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export both names to maintain compatibility
export { PatientSatisfactionChart as PatientVolumeChart };
