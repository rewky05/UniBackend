"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatConsultationTime } from "@/lib/utils/consultation-time";
import type { ConsultationTimeStats } from "@/lib/utils/consultation-time";

interface ConsultationTimeStatsProps {
  stats: ConsultationTimeStats;
  className?: string;
}

export function ConsultationTimeStats({ stats, className }: ConsultationTimeStatsProps) {
  const {
    averageConsultationTimeMinutes,
    totalCompletedConsultations,
    shortestConsultationMinutes,
    longestConsultationMinutes,
    averageBySpecialty,
    individualConsultations = []
  } = stats;

  // Calculate trend (placeholder - you can implement actual trend calculation)
  const trend = "stable"; // "up", "down", "stable"
  const trendPercentage = 0; // Replace with actual trend calculation

  return (
    <div className={className}>
      <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Average Consultation Time
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Based on {totalCompletedConsultations} completed consultations
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
            {trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
            {trend === "stable" && <Minus className="h-4 w-4 text-gray-600" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Average */}
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {formatConsultationTime(averageConsultationTimeMinutes)}
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Average consultation time
            </p>
          </div>

          {/* Range Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-700 dark:text-green-400">
                {formatConsultationTime(shortestConsultationMinutes)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Shortest</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-700 dark:text-red-400">
                {formatConsultationTime(longestConsultationMinutes)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Longest</p>
            </div>
          </div>

          {/* Specialty Breakdown */}
          {Object.keys(averageBySpecialty).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Average by Specialty
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(averageBySpecialty)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5) // Show top 5 specialties
                  .map(([specialty, time]) => (
                    <Badge 
                      key={specialty} 
                      variant="secondary"
                      className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {specialty}: {formatConsultationTime(time)}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Trend Info */}
          <div className="text-center pt-2 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {trendPercentage > 0 && `+${trendPercentage}% from last month`}
              {trendPercentage < 0 && `${trendPercentage}% from last month`}
              {trendPercentage === 0 && "No change from last month"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
