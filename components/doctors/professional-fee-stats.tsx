"use client";

import { useMemo } from "react";
import { Referral } from "@/lib/types/database";
import { formatPhilippinePeso } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  CheckCircle,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface ProfessionalFeeStatsProps {
  doctorId: string;
  professionalFee: number;
  referrals: Referral[];
}

export function ProfessionalFeeStats({
  doctorId,
  professionalFee,
  referrals,
}: ProfessionalFeeStatsProps) {
  const stats = useMemo(() => {
    // Filter referrals for this doctor (as assigned specialist)
    const doctorReferrals = referrals.filter(
      (referral) => referral.assignedSpecialistId === doctorId
    );

    const completedReferrals = doctorReferrals.filter(
      (referral) => referral.status === "completed"
    );

    const confirmedReferrals = doctorReferrals.filter(
      (referral) => referral.status === "confirmed"
    );

    const pendingAcceptanceReferrals = doctorReferrals.filter(
      (referral) => referral.status === "pending_acceptance"
    );

    const pendingReferrals = doctorReferrals.filter(
      (referral) => referral.status === "pending"
    );

    const cancelledReferrals = doctorReferrals.filter(
      (referral) => referral.status === "cancelled"
    );

    const completedCount = completedReferrals.length;
    const confirmedCount = confirmedReferrals.length;
    const pendingAcceptanceCount = pendingAcceptanceReferrals.length;
    const pendingCount = pendingReferrals.length;
    const cancelledCount = cancelledReferrals.length;
    const totalAccumulatedFees = completedCount * professionalFee;
    const potentialRevenue = (completedCount + confirmedCount) * professionalFee;

    return {
      completedReferrals: completedCount,
      confirmedReferrals: confirmedCount,
      pendingAcceptanceReferrals: pendingAcceptanceCount,
      pendingReferrals: pendingCount,
      cancelledReferrals: cancelledCount,
      totalReferrals: doctorReferrals.length,
      totalAccumulatedFees,
      potentialRevenue,
      professionalFee,
    };
  }, [doctorId, professionalFee, referrals]);

  return (
    <Card className="card-shadow">
             <CardHeader>
         <CardTitle className="flex items-center">
           <DollarSign className="h-5 w-5 mr-2" />
           Professional Fee Statistics
         </CardTitle>
         <CardDescription>
           Financial overview of completed referrals and accumulated fees
         </CardDescription>
       </CardHeader>
             <CardContent className="space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* Professional Fee Rate */}
           <div className="text-center p-4 bg-blue-50 rounded-lg dark:bg-blue-950/20">
             <div className="flex items-center justify-center mb-2">
               <Calculator className="h-6 w-6 text-blue-600" />
             </div>
             <p className="text-sm font-medium text-muted-foreground">
               Professional Fee Rate
             </p>
             <p className="text-xl font-bold text-blue-600">
               {formatPhilippinePeso(stats.professionalFee)}
             </p>
           </div>

           {/* Completed Referrals */}
           <div className="text-center p-4 bg-green-50 rounded-lg dark:bg-green-950/20">
             <div className="flex items-center justify-center mb-2">
               <CheckCircle className="h-6 w-6 text-green-600" />
             </div>
             <p className="text-sm font-medium text-muted-foreground">
               Completed Referrals
             </p>
             <p className="text-xl font-bold text-green-600">
               {stats.completedReferrals}
             </p>
           </div>

           {/* Total Accumulated Fees */}
           <div className="text-center p-4 bg-purple-50 rounded-lg dark:bg-purple-950/20">
             <div className="flex items-center justify-center mb-2">
               <TrendingUp className="h-6 w-6 text-purple-600" />
             </div>
             <p className="text-sm font-medium text-muted-foreground">
               Total Accumulated Fees
             </p>
             <p className="text-xl font-bold text-purple-600">
               {formatPhilippinePeso(stats.totalAccumulatedFees)}
             </p>
           </div>
         </div>

         {/* Simple Summary */}
         {/* <div className="text-center text-sm text-muted-foreground">
           <p>
             {stats.completedReferrals} completed referrals × {formatPhilippinePeso(stats.professionalFee)} = {formatPhilippinePeso(stats.totalAccumulatedFees)}
           </p>
         </div> */}
       </CardContent>
    </Card>
  );
}
