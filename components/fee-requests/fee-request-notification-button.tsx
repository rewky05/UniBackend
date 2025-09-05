"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Bell } from "lucide-react";
import { FeeRequestsDialog } from "./fee-requests-dialog";
import { usePendingFeeRequests } from "@/hooks/useFeeRequests";

interface FeeRequestNotificationButtonProps {
  className?: string;
}

export function FeeRequestNotificationButton({ 
  className 
}: FeeRequestNotificationButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { requests: pendingRequests, loading, count } = usePendingFeeRequests();

  // Log when button is clicked
  const handleClick = () => {
    console.log('🖱️ [FeeRequestNotificationButton] Button clicked:', {
      pendingCount: count,
      loading,
      isDialogOpen
    });
    setIsDialogOpen(true);
  };

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Log when component receives data
  useEffect(() => {
    if (isMounted) {
      console.log('📊 [FeeRequestNotificationButton] Component data updated:', {
        pendingCount: count,
        loading,
        hasRequests: pendingRequests.length > 0,
        requests: pendingRequests.map(req => ({
          id: req.id,
          doctorName: req.doctorName,
          status: req.status,
          previousFee: req.previousFee,
          requestedFee: req.requestedFee
        }))
      });
    }
  }, [count, loading, pendingRequests, isMounted]);

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <Button
        variant="outline"
        className={`relative ${className}`}
        disabled
      >
        <DollarSign className="h-4 w-4 mr-2" />
        Professional Fee Change
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        className={`relative ${className}`}
        disabled={loading}
      >
        <DollarSign className="h-4 w-4 mr-2" />
        Professional Fee Change
        {count > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
          >
            {count > 99 ? '99+' : count}
          </Badge>
        )}
      </Button>

      <FeeRequestsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        pendingCount={count}
      />
    </>
  );
}
