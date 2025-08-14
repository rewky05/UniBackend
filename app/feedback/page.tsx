'use client';

import { useState } from 'react';
import { useRealFeedback } from '@/hooks/useRealData';
import { useClinicsWithRatings } from '@/hooks/useFeedback';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatDateToText } from '@/lib/utils';
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
  Building2
} from 'lucide-react';



const ratings = ['All', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];
const statuses = ['All', 'Pending', 'Reviewed', 'Flagged'];
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
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedClinic, setSelectedClinic] = useState('All');
  const [selectedSort, setSelectedSort] = useState('date-desc');
  const { feedback, loading, error } = useRealFeedback();
  const { clinics: clinicsWithRatings, loading: clinicsLoading } = useClinicsWithRatings();
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);

  const filteredFeedback = feedback.filter(item => {
    const matchesSearch = (item.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.doctorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.clinic || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = selectedRating === 'All' || 
                         selectedRating === `${item.rating || 0} Star${(item.rating || 0) !== 1 ? 's' : ''}`;
    const matchesStatus = selectedStatus === 'All' || 
                         (item.status || '').toLowerCase() === selectedStatus.toLowerCase();
    const matchesClinic = selectedClinic === 'All' || 
                          item.clinicId === selectedClinic;

    return matchesSearch && matchesRating && matchesStatus && matchesClinic;
  });

  // Sort the filtered feedback
  const sortedFeedback = [...filteredFeedback].sort((a, b) => {
    switch (selectedSort) {
      case 'date-desc':
        return new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime();
      case 'date-asc':
        return new Date(a.date || a.createdAt || 0).getTime() - new Date(b.date || b.createdAt || 0).getTime();
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

  const averageRating = feedback.length > 0 ? feedback.reduce((sum, item) => sum + (item.rating || 0), 0) / feedback.length : 0;
  const totalFeedback = feedback.length;
  const pendingReviews = feedback.filter(item => item.status === 'pending').length;
  const flaggedReviews = feedback.filter(item => item.status === 'flagged').length;

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
                {clinicsWithRatings.length > 0 
                  ? Math.max(...clinicsWithRatings.map(c => c.averageRating)).toFixed(1)
                  : '0.0'
                }
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {clinicsWithRatings.length > 0 
                  ? clinicsWithRatings.reduce((highest, current) => 
                      current.averageRating > highest.averageRating ? current : highest
                    ).clinicName
                  : 'No clinics'
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
                    placeholder="Search by patient, doctor, or clinic..."
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
                     {clinicsWithRatings.map((clinic) => (
                       <SelectItem key={clinic.clinicId} value={clinic.clinicId}>
                         {clinic.clinicName} ({clinic.averageRating.toFixed(1)}⭐)
                       </SelectItem>
                     ))}
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
                      <TableRow key={item.id} className="hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {item.patientInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{item.patientName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div>
                          <div className="font-medium">{item.doctorName}</div>
                          <div className="text-sm text-muted-foreground">{item.doctorSpecialty}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-sm">{item.clinic || 'N/A'}</TableCell>
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
                  <SheetTitle>Patient Feedback Details</SheetTitle>
                  <SheetDescription>Complete review from {selectedFeedback.patientName}</SheetDescription>
                </SheetHeader>
                
                <div className="mt-8 space-y-6">
                  {/* Patient Information */}
                                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">PATIENT INFORMATION</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Patient Name</span>
                        <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                          {selectedFeedback.patientName}
                        </span>
                                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Date Submitted</span>
                        <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                          {formatDateToText(selectedFeedback.date || selectedFeedback.createdAt || Date.now())}
                        </span>
                                      </div>
                                    </div>
                                  </div>

                  {/* Healthcare Provider Information */}
                                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">HEALTHCARE PROVIDER</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Doctor Name</span>
                        <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                          {selectedFeedback.doctorName}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Specialty</span>
                        <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                          {selectedFeedback.doctorSpecialty || 'N/A'}
                        </span>
                      </div>
                      <div className="flex flex-col md:col-span-2">
                        <span className="text-xs text-muted-foreground">Clinic</span>
                        <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                          {selectedFeedback.clinic || 'N/A'}
                        </span>
                      </div>
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
                                
                  {/* Rating */}
                                <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">RATING</h3>
                    <div className="flex items-center space-x-3 border rounded px-3 py-2 bg-muted/30">
                                    <div className="flex">
                        {renderStars(selectedFeedback.rating || 0)}
                                    </div>
                      <span className={`font-medium text-lg ${getRatingColor(selectedFeedback.rating || 0)}`}>
                        {selectedFeedback.rating || 0} out of 5
                                    </span>
                                  </div>
                                </div>

                  {/* Patient Comment */}
                                <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">PATIENT COMMENT</h3>
                    <div className="border rounded px-3 py-2 bg-muted/30">
                      <p className="text-sm leading-relaxed">
                        {selectedFeedback.comment || 'No comment provided'}
                      </p>
                    </div>
                                </div>

                  {/* Tags */}
                  {selectedFeedback.tags && selectedFeedback.tags.length > 0 && (
                                <div>
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">TAGS</h3>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedFeedback.tags.map((tag, index) => (
                                      <Badge key={index} variant="secondary">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                  )}

                  {/* Actions */}
                                <div className="flex justify-between items-center pt-4 border-t">
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                      Flag for Review
                                    </Button>
                                    <Button size="sm">
                                      Mark as Reviewed
                                    </Button>
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