"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertTriangle, User } from "lucide-react";

interface SimpleConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<{ success: boolean; emailSent?: boolean; emailError?: string }>;
  doctor: {
    firstName: string;
    lastName: string;
    email: string;
    currentStatus: 'pending' | 'verified' | 'suspended';
    newStatus: 'pending' | 'verified' | 'suspended';
  };
  isLoading?: boolean;
}

export function SimpleConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  doctor,
  isLoading = false
}: SimpleConfirmationModalProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await onConfirm(notes);
      
      // Close this modal and let the parent handle showing success/failure
      onClose();
    } catch (error) {
      console.error('Error confirming doctor verification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNotes("");
      onClose();
    }
  };

  const getStatusMessage = () => {
    switch (doctor.newStatus) {
      case 'verified':
        return `Verify Dr. ${doctor.firstName} ${doctor.lastName}?`;
      case 'suspended':
        return `Suspend Dr. ${doctor.firstName} ${doctor.lastName}?`;
      case 'pending':
        return `Set Dr. ${doctor.firstName} ${doctor.lastName} to pending?`;
      default:
        return `Change Dr. ${doctor.firstName} ${doctor.lastName}'s status?`;
    }
  };

  const getStatusDescription = () => {
    switch (doctor.newStatus) {
      case 'verified':
        return 'This will grant them full access to the system and send a confirmation email.';
      case 'suspended':
        return 'This will immediately revoke their access to the system and notify them via email.';
      case 'pending':
        return 'This will restrict their access until further verification and notify them via email.';
      default:
        return 'This will change their access level and notify them via email.';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {getStatusMessage()}
          </DialogTitle>
          <DialogDescription>
            {getStatusDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Doctor Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-sm">
              <div className="font-medium">Dr. {doctor.firstName} {doctor.lastName}</div>
              <div className="text-muted-foreground">{doctor.email}</div>
            </div>
          </div>

          {/* Notes Section */}
          {/* <div className="space-y-2">
            <Label htmlFor="verification-notes">
              Notes (Optional)
            </Label>
            <Textarea
              id="verification-notes"
              placeholder="Add any notes about this decision..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
              disabled={isSubmitting}
            />
          </div> */}

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action will send an email notification to the doctor.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || isLoading}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
