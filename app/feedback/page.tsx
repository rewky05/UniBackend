'use client';

import { useState } from 'react';
import { useRealFeedback } from '@/hooks/useRealData';
import { useClinicsWithRatings, useFeedbackActions } from '@/hooks/useFeedback';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatDateToText, safeGetTimestamp } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  MessageSquare,
  Search,
  Star,
  Calendar,
  User,
  Eye,
  TrendingUp,
  Filter,
  Building2,
  Flag,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


const ratings = ['All', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];

const sortOptions = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'rating-desc', label: 'Highest Rating' },
  { value: 'rating-asc', label: 'Lowest Rating' },
  { value: 'patient-asc', label: 'Patient Name A-Z' },
  { value: 'patient-desc', label: 'Patient Name Z-A' },
  { value: 'doctor-asc', label: 'Doctor Name A-Z' },
  { value: 'doctor-desc', label: 'Doctor Name Z-A' },
];

export default function FeedbackPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState('All');

  const [selectedClinic, setSelectedClinic] = useState('All');
  const [selectedSort, setSelectedSort] = useState('date-desc');
  const { feedback, loading, error } = useRealFeedback();
  const { clinics: clinicsWithRatings, loading: clinicsLoading } = useClinicsWithRatings();
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const { updateFeedbackStatus, loading: actionLoading, error: actionError } = useFeedbackActions();
  const { toast } = useToast();
  const { user } = useAuth();

  const filteredFeedback = feedback.filter(item => {
    // First, filter out items with unknown or missing essential data
    const hasValidPatientData = item.patientName && 
                               item.patientName !== 'Unknown Patient' && 
                               item.patientName.trim() !== '';
    
    const hasValidDoctorData = item.doctorName && 
                              item.doctorName !== 'Unknown Doctor' && 
                              item.doctorName.trim() !== '';
    
    // Check both clinicName and practiceLocationName for valid clinic data
    const clinicName = item.clinicName || item.practiceLocationName;
    const hasValidClinicData = clinicName && 
                              clinicName !== 'Unknown Clinic' && 
                              clinicName !== 'N/A' && 
                              clinicName.trim() !== '';
    
    const hasValidRating = item.rating && item.rating > 0;
    
    // Only show feedback with complete, valid data
    if (!hasValidPatientData || !hasValidDoctorData || !hasValidClinicData || !hasValidRating) {
      return false;
    }
    
    // Then apply search and filter criteria
    const matchesSearch = (item.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.doctorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (clinicName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.patientEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = selectedRating === 'All' || 
                         selectedRating === `${item.rating || 0} Star${(item.rating || 0) !== 1 ? 's' : ''}`;

    const matchesClinic = selectedClinic === 'All' || 
                          item.clinicId === selectedClinic;

    return matchesSearch && matchesRating && matchesClinic;
  });

  // Sort the filtered feedback
  const sortedFeedback = [...filteredFeedback].sort((a, b) => {
    switch (selectedSort) {
      case 'date-desc':
        return safeGetTimestamp(b.date || b.createdAt) - safeGetTimestamp(a.date || a.createdAt);
      case 'date-asc':
        return safeGetTimestamp(a.date || a.createdAt) - safeGetTimestamp(b.date || b.createdAt);
      case 'rating-desc':
        return (b.rating || 0) - (a.rating || 0);
      case 'rating-asc':
        return (a.rating || 0) - (b.rating || 0);
      case 'patient-asc':
        return (a.patientName || '').localeCompare(b.patientName || '');
      case 'patient-desc':
        return (b.patientName || '').localeCompare(a.patientName || '');
      case 'doctor-asc':
        return (a.doctorName || '').localeCompare(b.doctorName || '');
      case 'doctor-desc':
        return (b.doctorName || '').localeCompare(a.doctorName || '');
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reviewed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400';
      case 'flagged':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading feedback data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-red-600 mb-2">Failed to load feedback data</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Use filtered feedback for accurate stats
  const averageRating = filteredFeedback.length > 0 ? filteredFeedback.reduce((sum, item) => sum + (item.rating || 0), 0) / filteredFeedback.length : 0;
  const totalFeedback = filteredFeedback.length;
  const pendingReviews = filteredFeedback.filter(item => item.status === 'pending').length;
  const flaggedReviews = filteredFeedback.filter(item => item.status === 'flagged').length;

  // Helper function to determine if flag for review should be clickable
  const canFlagForReview = (feedback: any) => {
    const status = feedback.status?.toLowerCase() || 'pending';
    const rating = feedback.rating || 0;
    return status === 'pending' && rating <= 3;
  };

  // Helper function to determine if mark as reviewed should be clickable
  const canMarkAsReviewed = (feedback: any) => {
    const status = feedback.status?.toLowerCase() || 'pending';
    return status === 'flagged';
  };

  // Helper function to get the current status display
  const getStatusDisplay = (feedback: any) => {
    const status = feedback.status?.toLowerCase() || 'pending';
    switch (status) {
      case 'reviewed':
        return { text: 'Reviewed', icon: CheckCircle, variant: 'default' as const };
      case 'flagged':
        return { text: 'Flagged for Review', icon: AlertCircle, variant: 'destructive' as const };
      case 'pending':
        return { text: 'Pending Review', icon: Eye, variant: 'secondary' as const };
      default:
        return { text: 'Pending Review', icon: Eye, variant: 'secondary' as const };
    }
  };

  // Handle flag for review
  const handleFlagForReview = async (feedbackId: string) => {
    if (!feedbackId) {
      toast({
        title: "Error",
        description: "Invalid feedback ID.",
        variant: "destructive",
      });
      return;
    }

    // Get current user's full name and ID
    const reviewerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin User' : 'Admin User';
    const reviewerId = (user as any)?.uid || 'current-user';

    try {
      await updateFeedbackStatus(feedbackId, 'flagged', reviewerName, reviewerId);
      toast({
        title: "Feedback Flagged",
        description: "The feedback has been flagged for review.",
      });
      setSelectedFeedback(null); // Close the sheet
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to flag feedback for review.",
        variant: "destructive",
      });
    }
  };

  // Handle mark as reviewed
  const handleMarkAsReviewed = async (feedbackId: string) => {
    if (!feedbackId) {
      toast({
        title: "Error",
        description: "Invalid feedback ID.",
        variant: "destructive",
      });
      return;
    }

    // Get current user's full name and ID
    const reviewerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin User' : 'Admin User';
    const reviewerId = (user as any)?.uid || 'current-user';

    try {
      await updateFeedbackStatus(feedbackId, 'reviewed', reviewerName, reviewerId);
      toast({
        title: "Feedback Reviewed",
        description: "The feedback has been marked as reviewed.",
      });
      setSelectedFeedback(null); // Close the sheet
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark feedback as reviewed.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Patient Feedback</h2>
            <p className="text-muted-foreground">
              Monitor and review patient feedback for healthcare quality assurance
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50 hover:from-blue-100/70 hover:to-indigo-100/70 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Total Feedback
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalFeedback}</div>
              <div className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50 hover:from-blue-100/70 hover:to-indigo-100/70 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Average Rating
              </CardTitle>
              <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{averageRating.toFixed(1)}</div>
              <div className="flex items-center mt-1">
                {renderStars(Math.round(averageRating))}
              </div>
            </CardContent>
          </Card>

                     <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50 hover:from-blue-100/70 hover:to-indigo-100/70 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                 Highest Rating
               </CardTitle>
               <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                 {filteredFeedback.length > 0 
                   ? Math.max(...filteredFeedback.map(f => f.rating || 0)).toFixed(1)
                   : '0.0'
                 }
               </div>
               <div className="text-xs text-muted-foreground mt-1">
                 {filteredFeedback.length > 0 
                   ? (() => {
                       const maxRating = Math.max(...filteredFeedback.map(f => f.rating || 0));
                       const highestRatedFeedback = filteredFeedback.find(f => f.rating === maxRating);
                       return highestRatedFeedback?.clinicName || highestRatedFeedback?.practiceLocationName || 'Unknown';
                     })()
                   : 'No feedback'
                 }
               </div>
             </CardContent>
           </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50 hover:from-blue-100/70 hover:to-indigo-100/70 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Flagged Reviews
              </CardTitle>
              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{flaggedReviews}</div>
              <div className="text-xs text-red-600 dark:text-red-400 flex items-center mt-1">
                Need immediate review
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Filters */}
        <Card className="bg-card border-border/50 dark:border-border/30 card-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient name, email, doctor, or clinic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                                 <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                   <SelectTrigger className="w-40">
                     <SelectValue placeholder="Clinic" />
                   </SelectTrigger>
                                      <SelectContent>
                      <SelectItem value="All">All Clinics</SelectItem>
                      {(() => {
                        // Get unique clinics from filtered feedback
                        const uniqueClinics = new Map();
                        filteredFeedback.forEach(feedback => {
                          const clinicName = feedback.clinicName || feedback.practiceLocationName;
                          const clinicId = feedback.clinicId;
                          if (clinicName && clinicId && !uniqueClinics.has(clinicId)) {
                            // Calculate average rating for this clinic from filtered feedback
                            const clinicFeedbacks = filteredFeedback.filter(f => 
                              (f.clinicName || f.practiceLocationName) === clinicName
                            );
                            const avgRating = clinicFeedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / clinicFeedbacks.length;
                            uniqueClinics.set(clinicId, {
                              clinicId,
                              clinicName,
                              averageRating: avgRating
                            });
                          }
                        });
                        return Array.from(uniqueClinics.values())
                          .filter(clinic => 
                            clinic.clinicName && 
                            clinic.clinicName !== 'Unknown Clinic' && 
                            clinic.clinicName.trim() !== ''
                          )
                          .map((clinic) => (
                            <SelectItem key={clinic.clinicId} value={clinic.clinicId}>
                              {clinic.clinicName} ({clinic.averageRating.toFixed(1)}⭐)
                            </SelectItem>
                          ));
                      })()}
                    </SelectContent>
                 </Select>
                
                                 <Select value={selectedRating} onValueChange={setSelectedRating}>
                   <SelectTrigger className="w-32">
                     <SelectValue placeholder="Rating" />
                   </SelectTrigger>
                                      <SelectContent>
                     {ratings.map((rating) => (
                       <SelectItem key={rating} value={rating}>
                         {rating === 'All' ? 'All Ratings' : rating}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                

                
                 <Select value={selectedSort} onValueChange={setSelectedSort}>
                   <SelectTrigger className="w-40">
                     <SelectValue placeholder="Sort by" />
                   </SelectTrigger>
                   <SelectContent>
                     {sortOptions.map((option) => (
                       <SelectItem key={option.value} value={option.value}>
                         {option.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Table */}
        <Card className="bg-card border-border/50 dark:border-border/30 card-shadow">
          <CardHeader className="border-b border-border/20 dark:border-border/10">
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Patient Reviews ({filteredFeedback.length})
            </CardTitle>
            <CardDescription>
              Comprehensive list of patient feedback and ratings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border/50 dark:border-border/30">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 dark:bg-muted/20">
                    <TableHead className="text-foreground font-medium w-[200px]">Patient</TableHead>
                    <TableHead className="text-foreground font-medium w-[200px]">Doctor</TableHead>
                    <TableHead className="text-foreground font-medium w-[150px]">Clinic</TableHead>
                    <TableHead className="text-foreground font-medium w-[120px]">Rating</TableHead>
                    
                    <TableHead className="text-foreground font-medium w-[150px]">Date</TableHead>
                    <TableHead className="w-[80px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                                 <TableBody>
                   {sortedFeedback.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={6} className="text-center py-8">
                         <div className="flex flex-col items-center space-y-2">
                           <div className="text-muted-foreground text-lg">📭</div>
                           <p className="text-muted-foreground font-medium">No feedback found</p>
                           <p className="text-sm text-muted-foreground">
                             Try adjusting your search criteria or filters
                           </p>
                         </div>
                       </TableCell>
                     </TableRow>
                   ) : (
                     sortedFeedback.map((item) => (
                      <TableRow 
                        key={item.id} 
                                                 className="hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors"
                      >
                                             <TableCell className="py-4">
                         <div className="flex items-center space-x-3">
                           <Avatar className="h-8 w-8">
                             <AvatarFallback className="text-xs">
                               {item.patientFirstName && item.patientLastName 
                                 ? `${item.patientFirstName[0]}${item.patientLastName[0]}`.toUpperCase()
                                 : item.patientName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'P'
                               }
                             </AvatarFallback>
                           </Avatar>
                                                       <div>
                              <div className="font-medium">{item.patientName}</div>
                              {item.patientEmail && (
                                <div className="text-xs text-muted-foreground">{item.patientEmail}</div>
                              )}
                            </div>
                         </div>
                       </TableCell>
                      <TableCell className="py-4">
                                                 <div>
                           <div className="font-medium">{item.doctorName}</div>
                           {item.doctorFirstName && item.doctorLastName && (
                             <div className="text-sm text-muted-foreground">
                               {item.doctorFirstName} {item.doctorLastName}
                             </div>
                           )}
                         </div>
                      </TableCell>
                                              <TableCell className="py-4 text-sm">{item.clinicName || item.practiceLocationName}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center space-x-1">
                          <span className={`font-medium ${getRatingColor(item.rating || 0)}`}>
                            {item.rating || 0}
                          </span>
                          <div className="flex">
                            {renderStars(item.rating || 0)}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatDateToText(item.date || item.createdAt || Date.now())}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setSelectedFeedback(item)}
                          className="h-8 w-8"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Details Sheet */}
                            {selectedFeedback && (
          <Sheet open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
            <SheetContent side="right" className="w-full max-w-md sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl backdrop-blur-md overflow-y-auto">
              <div className="p-6">
                                 <SheetHeader>
                   <div className="flex items-center justify-between">
                     <div>
                       <SheetTitle>Patient Feedback Details</SheetTitle>
                       <SheetDescription>Complete review from {selectedFeedback.patientName}</SheetDescription>
                     </div>
                     <div className="flex items-center space-x-2">
                       <div className="flex">
                         {renderStars(selectedFeedback.rating || 0)}
                       </div>
                       <span className={`font-medium text-lg ${getRatingColor(selectedFeedback.rating || 0)}`}>
                         {selectedFeedback.rating || 0} out of 5
                       </span>
                     </div>
                   </div>
                 </SheetHeader>
                
                <div className="mt-8 space-y-6">
                                     {/* Patient Information */}
                   <div>
                     <h3 className="text-sm font-semibold mb-3 text-muted-foreground">PATIENT INFORMATION</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {selectedFeedback.patientName && (
                         <div className="flex flex-col">
                           <span className="text-xs text-muted-foreground">Patient Name</span>
                           <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                             {selectedFeedback.patientName}
                           </span>
                         </div>
                       )}
                       {selectedFeedback.patientEmail && (
                         <div className="flex flex-col">
                           <span className="text-xs text-muted-foreground">Patient Email</span>
                           <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                             {selectedFeedback.patientEmail}
                           </span>
                         </div>
                       )}
                       {(selectedFeedback.date || selectedFeedback.createdAt || selectedFeedback.timestamp) && (
                         <div className="flex flex-col">
                           <span className="text-xs text-muted-foreground">Date Submitted</span>
                           <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                             {formatDateToText(selectedFeedback.date || selectedFeedback.createdAt || selectedFeedback.timestamp || Date.now())}
                           </span>
                         </div>
                       )}
                       {selectedFeedback.appointmentDate && (
                         <div className="flex flex-col">
                           <span className="text-xs text-muted-foreground">Appointment Date</span>
                           <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                             {formatDateToText(selectedFeedback.appointmentDate)}
                           </span>
                         </div>
                       )}
                     </div>
                   </div>

                                                       {/* Healthcare Provider Information */}
                   {(selectedFeedback.doctorName || selectedFeedback.doctorId || selectedFeedback.providerId || selectedFeedback.clinicName || selectedFeedback.practiceLocationName || selectedFeedback.clinicId) && (
                     <div>
                       <h3 className="text-sm font-semibold mb-3 text-muted-foreground">HEALTHCARE PROVIDER</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {selectedFeedback.doctorName && (
                           <div className="flex flex-col">
                             <span className="text-xs text-muted-foreground">Doctor Name</span>
                             <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                               {selectedFeedback.doctorName}
                             </span>
                           </div>
                         )}
                         
                         {(selectedFeedback.clinicName || selectedFeedback.practiceLocationName) && (
                           <div className="flex flex-col">
                             <span className="text-xs text-muted-foreground">Clinic</span>
                             <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                               {selectedFeedback.clinicName || selectedFeedback.practiceLocationName}
                             </span>
                           </div>
                         )}
                         
                         {selectedFeedback.clinicId && (
                           <div className="flex flex-col md:col-span-2">
                             <span className="text-xs text-muted-foreground">Clinic Rating</span>
                             <div className="flex items-center space-x-2 border rounded px-3 py-2 bg-muted/30">
                               <div className="flex">
                                 {renderStars(Math.round(
                                   clinicsWithRatings.find(c => c.clinicId === selectedFeedback.clinicId)?.averageRating || 0
                                 ))}
                               </div>
                               <span className="font-medium text-base">
                                 {clinicsWithRatings.find(c => c.clinicId === selectedFeedback.clinicId)?.averageRating.toFixed(1) || '0.0'}
                               </span>
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                   )}
                                
                                                         {/* Patient Comment */}
                    {selectedFeedback.comment && (
                      <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">PATIENT COMMENT</h3>
                        <div className="border rounded px-3 py-2 bg-muted/30">
                          <p className="text-sm leading-relaxed">
                            {selectedFeedback.comment}
                          </p>
                        </div>
                      </div>
                    )}

                                     {/* Additional Information */}
                   {(selectedFeedback.appointmentType || selectedFeedback.treatmentType || selectedFeedback.isAnonymous !== undefined) && (
                     <div>
                       <h3 className="text-sm font-semibold mb-3 text-muted-foreground">APPOINTMENT DETAILS</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {(selectedFeedback.appointmentType || selectedFeedback.treatmentType) && (
                           <div className="flex flex-col">
                             <span className="text-xs text-muted-foreground">Treatment Type</span>
                             <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                               {selectedFeedback.appointmentType || selectedFeedback.treatmentType}
                             </span>
                           </div>
                         )}
                         {selectedFeedback.isAnonymous !== undefined && (
                           <div className="flex flex-col">
                             <span className="text-xs text-muted-foreground">Anonymous Review</span>
                             <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                               {selectedFeedback.isAnonymous ? 'Yes' : 'No'}
                             </span>
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                  {/* Tags */}
                  {selectedFeedback.tags && selectedFeedback.tags.length > 0 && (
                                <div>
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">TAGS</h3>
                                                                     <div className="flex flex-wrap gap-2">
                                     {selectedFeedback.tags.map((tag: string, index: number) => (
                                       <Badge key={index} variant="secondary">
                                         {tag.charAt(0).toUpperCase() + tag.slice(1)}
                                       </Badge>
                                     ))}
                                   </div>
                                </div>
                  )}

                  

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex gap-2">
                      {(() => {
                        const status = selectedFeedback.status?.toLowerCase() || 'pending';
                        const rating = selectedFeedback.rating || 0;
                        
                        if (status === 'reviewed') {
                          return (
                            <Button variant="outline" size="sm" disabled>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Already Reviewed
                            </Button>
                          );
                        }
                        
                                                 if (status === 'flagged') {
                           return (
                             <>
                               <Button variant="outline" size="sm" disabled>
                                 <Flag className="h-4 w-4 mr-1" />
                                 Already Flagged
                               </Button>
                               <Button 
                                 size="sm" 
                                 onClick={() => handleMarkAsReviewed(selectedFeedback.id)}
                                 disabled={actionLoading}
                               >
                                 <CheckCircle className="h-4 w-4 mr-1" />
                                 {actionLoading ? 'Updating...' : 'Mark as Reviewed'}
                               </Button>
                             </>
                           );
                         }
                        
                                                 if (status === 'pending' && rating <= 3) {
                           return (
                             <Button 
                               variant="outline" 
                               size="sm" 
                               onClick={() => handleFlagForReview(selectedFeedback.id)}
                               disabled={actionLoading}
                             >
                               <Flag className="h-4 w-4 mr-1" />
                               {actionLoading ? 'Updating...' : 'Flag for Review'}
                             </Button>
                           );
                         }
                        
                                                 return (
                           <Button variant="outline" size="sm" disabled>
                             <Eye className="h-4 w-4 mr-1" />
                             Keep up the good work!
                           </Button>
                         );
                      })()}
                    </div>
                  </div>
                              </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </DashboardLayout>
  );
}