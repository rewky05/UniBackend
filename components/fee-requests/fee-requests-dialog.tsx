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
  const handleApproveRequest = async (requestId: string, reviewNotes?: string) => {
    if (!user?.email) return;

    try {
      await updateRequestStatus(requestId, {
        status: "approved",
        reviewedBy: user.email,
        reviewNotes
      }, user.email);

      toast({
        title: "Request Approved",
        description: "Fee change request has been approved successfully.",
      });

      // Remove from selected if it was selected
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle individual request rejection
  const handleRejectRequest = async (requestId: string, reviewNotes: string) => {
    if (!user?.email) return;

    try {
      await updateRequestStatus(requestId, {
        status: "rejected",
        reviewedBy: user.email,
        reviewNotes
      }, user.email);

      toast({
        title: "Request Rejected",
        description: "Fee change request has been rejected.",
      });

      // Remove from selected if it was selected
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle bulk approval
  const handleBulkApprove = async () => {
    if (!user?.email || selectedRequests.length === 0) return;

    try {
      await bulkApproveRequests(selectedRequests, user.email, bulkReviewNotes);
      
      toast({
        title: "Bulk Approval Complete",
        description: `${selectedRequests.length} requests have been approved successfully.`,
      });

      setSelectedRequests([]);
      setShowBulkActions(false);
      setBulkReviewNotes("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve requests. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle bulk rejection
  const handleBulkReject = async () => {
    if (!user?.email || selectedRequests.length === 0) return;

    try {
      await bulkRejectRequests(selectedRequests, user.email, bulkReviewNotes);
      
      toast({
        title: "Bulk Rejection Complete",
        description: `${selectedRequests.length} requests have been rejected.`,
      });

      setSelectedRequests([]);
      setShowBulkActions(false);
      setBulkReviewNotes("");
      setShowBulkRejectDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject requests. Please try again.",
        variant: "destructive",
      });
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
                  {pendingCount} Pending
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
    </>
  );
}
