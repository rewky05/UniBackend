"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useFeeRequests, useFeeRequestActions, useFilteredFeeRequests } from "@/hooks/useFeeRequests";
import { formatPhilippinePeso, formatDateTimeToText } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  MoreHorizontal,
  Check,
  X,
  DollarSign,
  Calendar,
  User,
  MessageSquare,
  Loader2,
} from "lucide-react";
import type { FeeChangeRequest, FeeChangeRequestFilters } from "@/lib/types";

interface FeeRequestsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pendingCount: number;
}

export function FeeRequestsDialog({ 
  isOpen, 
  onClose, 
  pendingCount 
}: FeeRequestsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { requests, loading, error } = useFeeRequests();
  const [isMounted, setIsMounted] = useState(false);
  const { 
    updateRequestStatus, 
    bulkApproveRequests, 
    bulkRejectRequests, 
    loading: actionLoading 
  } = useFeeRequestActions();

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Log when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log('🚀 [FeeRequestsDialog] Dialog opened with data:', {
        pendingCount,
        totalRequests: requests.length,
        loading,
        error,
        user: user?.email
      });
    }
  }, [isOpen, pendingCount, requests.length, loading, error, user?.email]);

  // State for filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkReviewNotes, setBulkReviewNotes] = useState("");
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false);
  
  // Confirmation and success modals
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    type: 'approve' | 'reject';
    requestId: string;
    doctorName: string;
    reviewNotes?: string;
  } | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState<{
    type: 'approve' | 'reject';
    success: boolean;
    message: string;
  } | null>(null);

  // Filter configuration
  const filters: FeeChangeRequestFilters = useMemo(() => ({
    status: statusFilter === "all" ? undefined : statusFilter,
    doctorName: searchQuery || undefined,
  }), [statusFilter, searchQuery]);

  // Get filtered requests
  const filteredRequests = useFilteredFeeRequests(requests, filters);

  // Log filtered requests when they change
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 [FeeRequestsDialog] Filtered requests updated:', {
        totalRequests: requests.length,
        filteredCount: filteredRequests.length,
        searchQuery,
        statusFilter,
        filteredRequests: filteredRequests.map(req => ({
          id: req.id,
          doctorName: req.doctorName,
          status: req.status,
          previousFee: req.previousFee,
          requestedFee: req.requestedFee
        }))
      });
    }
  }, [isOpen, requests.length, filteredRequests.length, searchQuery, statusFilter, filteredRequests]);

  // Reset selections when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedRequests([]);
      setShowBulkActions(false);
      setBulkReviewNotes("");
      setSearchQuery("");
      setStatusFilter("all");
    }
  }, [isOpen]);

  // Handle individual request selection
  const handleRequestSelect = (requestId: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests(prev => [...prev, requestId]);
    } else {
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(filteredRequests.map(req => req.id));
    } else {
      setSelectedRequests([]);
    }
  };

  // Handle individual request approval
  const handleApproveRequest = (requestId: string, reviewNotes?: string) => {
    const request = requests.find(req => req.id === requestId);
    if (!request) return;

    setConfirmationData({
      type: 'approve',
      requestId,
      doctorName: request.doctorName,
      reviewNotes
    });
    setShowConfirmationDialog(true);
  };

  // Execute approval after confirmation
  const executeApproval = async () => {
    if (!user?.email || !confirmationData) return;

    try {
      await updateRequestStatus(confirmationData.requestId, {
        status: "approved",
        reviewedBy: user.email,
        reviewNotes: confirmationData.reviewNotes
      }, user.email);

      setSuccessData({
        type: 'approve',
        success: true,
        message: "Fee change request has been approved successfully."
      });
      setShowSuccessDialog(true);

      // Remove from selected if it was selected
      setSelectedRequests(prev => prev.filter(id => id !== confirmationData.requestId));
    } catch (error) {
      setSuccessData({
        type: 'approve',
        success: false,
        message: "Failed to approve request. Please try again."
      });
      setShowSuccessDialog(true);
    } finally {
      setShowConfirmationDialog(false);
      setConfirmationData(null);
    }
  };

  // Handle individual request rejection
  const handleRejectRequest = (requestId: string, reviewNotes: string) => {
    const request = requests.find(req => req.id === requestId);
    if (!request) return;

    setConfirmationData({
      type: 'reject',
      requestId,
      doctorName: request.doctorName,
      reviewNotes
    });
    setShowConfirmationDialog(true);
  };

  // Execute rejection after confirmation
  const executeRejection = async () => {
    if (!user?.email || !confirmationData) return;

    try {
      await updateRequestStatus(confirmationData.requestId, {
        status: "rejected",
        reviewedBy: user.email,
        reviewNotes: confirmationData.reviewNotes
      }, user.email);

      setSuccessData({
        type: 'reject',
        success: true,
        message: "Fee change request has been rejected."
      });
      setShowSuccessDialog(true);

      // Remove from selected if it was selected
      setSelectedRequests(prev => prev.filter(id => id !== confirmationData.requestId));
    } catch (error) {
      setSuccessData({
        type: 'reject',
        success: false,
        message: "Failed to reject request. Please try again."
      });
      setShowSuccessDialog(true);
    } finally {
      setShowConfirmationDialog(false);
      setConfirmationData(null);
    }
  };

  // Handle bulk approval
  const handleBulkApprove = () => {
    if (!user?.email || selectedRequests.length === 0) return;

    setConfirmationData({
      type: 'approve',
      requestId: 'bulk',
      doctorName: `${selectedRequests.length} requests`,
      reviewNotes: bulkReviewNotes
    });
    setShowConfirmationDialog(true);
  };

  // Execute bulk approval after confirmation
  const executeBulkApproval = async () => {
    if (!user?.email || selectedRequests.length === 0) return;

    try {
      await bulkApproveRequests(selectedRequests, user.email, bulkReviewNotes);
      
      setSuccessData({
        type: 'approve',
        success: true,
        message: `${selectedRequests.length} requests have been approved successfully.`
      });
      setShowSuccessDialog(true);

      setSelectedRequests([]);
      setShowBulkActions(false);
      setBulkReviewNotes("");
    } catch (error) {
      setSuccessData({
        type: 'approve',
        success: false,
        message: "Failed to approve requests. Please try again."
      });
      setShowSuccessDialog(true);
    } finally {
      setShowConfirmationDialog(false);
      setConfirmationData(null);
    }
  };

  // Handle bulk rejection
  const handleBulkReject = () => {
    if (!user?.email || selectedRequests.length === 0) return;

    setConfirmationData({
      type: 'reject',
      requestId: 'bulk',
      doctorName: `${selectedRequests.length} requests`,
      reviewNotes: bulkReviewNotes
    });
    setShowConfirmationDialog(true);
    setShowBulkRejectDialog(false); // Close the bulk reject dialog
  };

  // Execute bulk rejection after confirmation
  const executeBulkRejection = async () => {
    if (!user?.email || selectedRequests.length === 0) return;

    try {
      await bulkRejectRequests(selectedRequests, user.email, bulkReviewNotes);
      
      setSuccessData({
        type: 'reject',
        success: true,
        message: `${selectedRequests.length} requests have been rejected.`
      });
      setShowSuccessDialog(true);

      setSelectedRequests([]);
      setShowBulkActions(false);
      setBulkReviewNotes("");
      setShowBulkRejectDialog(false);
    } catch (error) {
      setSuccessData({
        type: 'reject',
        success: false,
        message: "Failed to reject requests. Please try again."
      });
      setShowSuccessDialog(true);
    } finally {
      setShowConfirmationDialog(false);
      setConfirmationData(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Calendar className="h-3 w-3" />;
      case "approved":
        return <Check className="h-3 w-3" />;
      case "rejected":
        return <X className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const isAllSelected = filteredRequests.length > 0 && selectedRequests.length === filteredRequests.length;
  const isPartiallySelected = selectedRequests.length > 0 && selectedRequests.length < filteredRequests.length;

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Professional Fee Change
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount} <span className="ml-1">pending</span>
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Review and manage professional fee change requests from specialists
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by doctor name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                      disabled={searchQuery === "" && statusFilter === "all"}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedRequests.length > 0 && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {selectedRequests.length} request{selectedRequests.length !== 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRequests([])}
                      >
                        Clear Selection
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleBulkApprove}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Approve All
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setShowBulkRejectDialog(true)}
                        disabled={actionLoading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject All
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Requests Table */}
            <Card className="flex-1 overflow-hidden">
              <CardContent className="p-0 h-full">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading fee change requests...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="text-red-500 mb-4">⚠️</div>
                      <p className="text-red-600 mb-2">Failed to load requests</p>
                      <p className="text-muted-foreground text-sm">{error}</p>
                    </div>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">No fee change requests found</p>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery || statusFilter !== "all" 
                          ? "Try adjusting your search criteria or filters"
                          : "No requests have been submitted yet"
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-auto h-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Previous Fee</TableHead>
                          <TableHead>Requested Fee</TableHead>
                          <TableHead>Difference</TableHead>
                          <TableHead>Request Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-12">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedRequests.includes(request.id)}
                                onCheckedChange={(checked) => 
                                  handleRequestSelect(request.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{request.doctorName}</div>
                                <div className="text-sm text-muted-foreground">{request.doctorEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {formatPhilippinePeso(request.previousFee)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {formatPhilippinePeso(request.requestedFee)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={`font-medium ${
                                request.requestedFee > request.previousFee 
                                  ? 'text-green-600' 
                                  : request.requestedFee < request.previousFee 
                                    ? 'text-red-600' 
                                    : 'text-gray-600'
                              }`}>
                                {request.requestedFee > request.previousFee ? '+' : ''}
                                {formatPhilippinePeso(request.requestedFee - request.previousFee)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDateTimeToText(request.requestDate)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(request.status)}>
                                {getStatusIcon(request.status)}
                                <span className="ml-1 capitalize">{request.status}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {request.status === "pending" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => handleApproveRequest(request.id)}
                                        className="text-green-600"
                                      >
                                        <Check className="h-4 w-4 mr-2" />
                                        Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleRejectRequest(request.id, "Rejected by admin")}
                                        className="text-red-600"
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Reject
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {request.reason && (
                                    <DropdownMenuItem disabled>
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Reason: {request.reason}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Confirmation Dialog */}
      <Dialog open={showBulkRejectDialog} onOpenChange={setShowBulkRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Fee Change Requests</DialogTitle>
            <DialogDescription>
              You are about to reject {selectedRequests.length} fee change request{selectedRequests.length !== 1 ? 's' : ''}. 
              Please provide a reason for rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Reason for Rejection</Label>
              <Textarea
              className="mt-2"
                id="reject-reason"
                placeholder="Enter reason for rejection..."
                value={bulkReviewNotes}
                onChange={(e) => setBulkReviewNotes(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBulkRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkReject}
                disabled={!bulkReviewNotes.trim() || actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Reject All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmationData?.type === 'approve' ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-red-600" />
              )}
              Confirm {confirmationData?.type === 'approve' ? 'Approval' : 'Rejection'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmationData?.type === 'approve' ? 'approve' : 'reject'} the fee change request for{' '}
              <span className="font-semibold">{confirmationData?.doctorName}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {confirmationData?.reviewNotes && (
              <div>
                <Label>Review Notes:</Label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {confirmationData.reviewNotes}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmationDialog(false);
                  setConfirmationData(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant={confirmationData?.type === 'approve' ? 'default' : 'destructive'}
                onClick={confirmationData?.requestId === 'bulk' 
                  ? (confirmationData?.type === 'approve' ? executeBulkApproval : executeBulkRejection)
                  : (confirmationData?.type === 'approve' ? executeApproval : executeRejection)
                }
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : confirmationData?.type === 'approve' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                {confirmationData?.type === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {successData?.success ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-red-600" />
              )}
              {successData?.success ? 'Success' : 'Error'}
            </DialogTitle>
            <DialogDescription>
              {successData?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessDialog(false);
                setSuccessData(null);
              }}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
