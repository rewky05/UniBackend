"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFeeRequestActions } from "@/hooks/useFeeRequests";
import { formatPhilippinePeso } from "@/lib/utils";

interface FeeChangeRequestDemoProps {
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  currentFee: number;
  onRequestSubmitted?: () => void;
}

export function FeeChangeRequestDemo({
  doctorId,
  doctorName,
  doctorEmail,
  currentFee,
  onRequestSubmitted
}: FeeChangeRequestDemoProps) {
  const { toast } = useToast();
  const { createFeeRequest, loading } = useFeeRequestActions();
  
  const [requestedFee, setRequestedFee] = useState<number>(currentFee);
  const [reason, setReason] = useState("");

  const handleSubmitRequest = async () => {
    if (requestedFee === currentFee) {
      toast({
        title: "No Change Required",
        description: "The requested fee is the same as your current fee.",
        variant: "destructive",
      });
      return;
    }

    if (requestedFee < 0) {
      toast({
        title: "Invalid Amount",
        description: "Professional fee cannot be negative.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createFeeRequest({
        doctorId,
        doctorName,
        doctorEmail,
        previousFee: currentFee,
        requestedFee,
        reason: reason.trim() || undefined
      }, doctorEmail);

      toast({
        title: "Request Submitted",
        description: "Your fee change request has been submitted for review.",
      });

      // Reset form
      setRequestedFee(currentFee);
      setReason("");
      
      // Notify parent component
      onRequestSubmitted?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const feeDifference = requestedFee - currentFee;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Request Fee Change
        </CardTitle>
        <CardDescription>
          Submit a request to change your professional consultation fee
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-fee">Current Professional Fee</Label>
          <div className="p-3 bg-muted rounded-md">
            <span className="font-medium text-lg">
              {formatPhilippinePeso(currentFee)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="requested-fee">Requested Professional Fee</Label>
          <Input
            id="requested-fee"
            type="number"
            value={requestedFee}
            onChange={(e) => setRequestedFee(parseFloat(e.target.value) || 0)}
            placeholder="Enter new fee amount"
            min="0"
            step="100"
          />
        </div>

        {requestedFee !== currentFee && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
            <div className="text-sm">
              <span className="text-muted-foreground">Fee Change: </span>
              <span className={`font-medium ${
                feeDifference > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {feeDifference > 0 ? '+' : ''}
                {formatPhilippinePeso(feeDifference)}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Change (Optional)</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why you want to change your fee..."
            rows={3}
          />
        </div>

        <Button 
          onClick={handleSubmitRequest}
          disabled={loading || requestedFee === currentFee}
          className="w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Request
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          Your request will be reviewed by the administration team
        </div>
      </CardContent>
    </Card>
  );
}
