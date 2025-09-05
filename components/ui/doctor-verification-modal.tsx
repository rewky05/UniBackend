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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertTriangle, Mail, User, Calendar, Building } from "lucide-react";

interface DoctorVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<{ success: boolean; emailSent?: boolean; emailError?: string }>;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    specialty: string;
    clinicName?: string;
    currentStatus: 'pending' | 'verified' | 'suspended';
    newStatus: 'pending' | 'verified' | 'suspended';
  };
  isLoading?: boolean;
}

export function DoctorVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  doctor,
  isLoading = false
}: DoctorVerificationModalProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setEmailError(null);
    setEmailStatus('sending');
    setIsSendingEmail(true);
    
    try {
      const result = await onConfirm(notes);
      
      if (result.success) {
        if (result.emailSent) {
          setEmailStatus('sent');
          setEmailSent(true);
        } else if (result.emailError) {
          setEmailStatus('failed');
          setEmailError(result.emailError);
        }
        
        // Reset form after successful submission
        setTimeout(() => {
          setNotes("");
          setEmailSent(false);
          setEmailStatus('idle');
          onClose();
        }, 3000);
      } else {
        setEmailStatus('failed');
        setEmailError('Failed to update doctor status');
      }
    } catch (error) {
      console.error('Error confirming doctor verification:', error);
      setEmailStatus('failed');
      setEmailError(error instanceof Error ? error.message : 'Failed to update doctor status');
    } finally {
      setIsSubmitting(false);
      setIsSendingEmail(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNotes("");
      setEmailSent(false);
      setEmailError(null);
      setEmailStatus('idle');
      setIsSendingEmail(false);
      onClose();
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          label: 'Verified',
          description: 'Doctor will receive full system access'
        };
      case 'suspended':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle,
          label: 'Suspended',
          description: 'Doctor access will be revoked immediately'
        };
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: AlertTriangle,
          label: 'Pending',
          description: 'Doctor access will be restricted until verification'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: AlertTriangle,
          label: 'Unknown',
          description: 'Status change will be applied'
        };
    }
  };

  const currentStatusConfig = getStatusConfig(doctor.currentStatus);
  const newStatusConfig = getStatusConfig(doctor.newStatus);

  const getConfirmationMessage = () => {
    switch (doctor.newStatus) {
      case 'verified':
        return `Are you sure you want to verify Dr. ${doctor.firstName} ${doctor.lastName}? This will grant them full access to the system and send them a confirmation email.`;
      case 'suspended':
        return `Are you sure you want to suspend Dr. ${doctor.firstName} ${doctor.lastName}? This will immediately revoke their access to the system and notify them via email.`;
      case 'pending':
        return `Are you sure you want to set Dr. ${doctor.firstName} ${doctor.lastName}'s status to pending? This will restrict their access until further verification and notify them via email.`;
      default:
        return `Are you sure you want to change Dr. ${doctor.firstName} ${doctor.lastName}'s status?`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Doctor Status Change Confirmation
          </DialogTitle>
          <DialogDescription>
            Review the details below before confirming the status change.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Doctor Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3">Doctor Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Name:</span>
                <span className="text-sm">Dr. {doctor.firstName} {doctor.lastName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{doctor.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Specialty:</span>
                <span className="text-sm">{doctor.specialty}</span>
              </div>
              {doctor.clinicName && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Clinic:</span>
                  <span className="text-sm">{doctor.clinicName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Change */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Status Change</h3>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge className={currentStatusConfig.color}>
                  {currentStatusConfig.label}
                </Badge>
                <span className="text-gray-400">→</span>
                <Badge className={newStatusConfig.color}>
                  {newStatusConfig.label}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {newStatusConfig.description}
            </p>
          </div>

          {/* Email Notification */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Email Notification
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  An email will be sent to <strong>{doctor.email}</strong> notifying them of this status change.
                </p>
                
                {/* Email Status Indicator */}
                {emailStatus !== 'idle' && (
                  <div className="mt-3 flex items-center gap-2">
                    {emailStatus === 'sending' && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                          Sending email...
                        </span>
                      </>
                    )}
                    {emailStatus === 'sent' && (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700 dark:text-green-300">
                          Email sent successfully!
                        </span>
                      </>
                    )}
                    {emailStatus === 'failed' && (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-700 dark:text-red-300">
                          Email failed to send
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Confirmation Message */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {getConfirmationMessage()}
            </AlertDescription>
          </Alert>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="verification-notes">
              Verification Notes (Optional)
            </Label>
            <Textarea
              id="verification-notes"
              placeholder="Add any notes about this verification decision..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              These notes will be included in the activity log and may be visible to the doctor.
            </p>
          </div>

          {/* Success/Error Messages */}
          {emailSent && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Doctor status updated successfully! Confirmation email has been sent.
              </AlertDescription>
            </Alert>
          )}

          {emailError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {emailError}
              </AlertDescription>
            </Alert>
          )}
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
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                {isSendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                )}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Change
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
