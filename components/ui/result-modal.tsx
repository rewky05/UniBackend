"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Mail, XCircle } from "lucide-react";

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  success: boolean;
  emailSent: boolean;
  emailError?: string;
  doctorName: string;
  newStatus: string;
}

export function ResultModal({
  isOpen,
  onClose,
  success,
  emailSent,
  emailError,
  doctorName,
  newStatus
}: ResultModalProps) {
  const getStatusIcon = () => {
    if (success && emailSent) {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    } else if (success && !emailSent) {
      return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
    } else {
      return <XCircle className="h-6 w-6 text-red-600" />;
    }
  };

  const getStatusTitle = () => {
    if (success && emailSent) {
      return 'Status Updated Successfully';
    } else if (success && !emailSent) {
      return 'Status Updated (Email Failed)';
    } else {
      return 'Update Failed';
    }
  };

  const getStatusDescription = () => {
    if (success && emailSent) {
      return `Dr. ${doctorName}'s status has been updated to ${newStatus} and confirmation email sent.`;
    } else if (success && !emailSent) {
      return `Dr. ${doctorName}'s status has been updated to ${newStatus}, but the email notification failed to send.`;
    } else {
      return `Failed to update Dr. ${doctorName}'s status. Please try again.`;
    }
  };

  const getEmailStatus = () => {
    if (emailSent) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        text: 'Email sent successfully',
        color: 'text-green-700 dark:text-green-300'
      };
    } else if (emailError) {
      return {
        icon: <XCircle className="h-4 w-4 text-red-600" />,
        text: `Email failed: ${emailError}`,
        color: 'text-red-700 dark:text-red-300'
      };
    } else {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
        text: 'Email not sent',
        color: 'text-yellow-700 dark:text-yellow-300'
      };
    }
  };

  const emailStatus = getEmailStatus();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusTitle()}
          </DialogTitle>
          <DialogDescription>
            {getStatusDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="space-y-2">
              <div className="font-medium">Dr. {doctorName}</div>
              <div className="text-sm text-muted-foreground">
                Status changed to: <span className="font-medium capitalize">{newStatus}</span>
              </div>
            </div>
          </div>

          {/* Email Status */}
          <Alert className={success ? "border-green-200 bg-green-50 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:bg-red-900/20"}>
            <Mail className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              {emailStatus.icon}
              <span className={emailStatus.color}>
                {emailStatus.text}
              </span>
            </AlertDescription>
          </Alert>

          {/* Additional Info */}
          {success && emailSent && (
            <div className="text-sm text-muted-foreground">
              The doctor has been notified via email and can now access their account.
            </div>
          )}
          
          {success && !emailSent && (
            <div className="text-sm text-muted-foreground">
              The status was updated successfully, but you may want to contact the doctor directly.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            {success ? 'Done' : 'Try Again'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
