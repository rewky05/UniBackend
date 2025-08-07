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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Search,
  Star,
  Calendar,
  User,
  Eye,
  TrendingUp,
  TrendingDown,
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
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Feedback
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFeedback}</div>
              <div className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Rating
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <div className="flex items-center mt-1">
                {renderStars(Math.round(averageRating))}
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Highest Rating
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
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

          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Flagged Reviews
              </CardTitle>
              <Eye className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flaggedReviews}</div>
              <div className="text-xs text-red-600 flex items-center mt-1">
                Need immediate review
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Filters */}
        <Card id="review-feedback" className="card-shadow">
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
                {/* <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Table */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Patient Reviews ({filteredFeedback.length})
            </CardTitle>
            <CardDescription>
              Comprehensive list of patient feedback and ratings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Date</TableHead>
                    {/* <TableHead>Status</TableHead> */}
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                                 <TableBody>
                   {sortedFeedback.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={7} className="text-center py-8">
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
                      <TableRow key={item.id} className="table-row-hover">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {item.patientInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{item.patientName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.doctorName}</div>
                          <div className="text-sm text-muted-foreground">{item.doctorSpecialty}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{item.clinic || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span className={`font-medium ${getRatingColor(item.rating || 0)}`}>
                            {item.rating || 0}
                          </span>
                          <div className="flex">
                            {renderStars(item.rating || 0)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate">{item.comment || 'No comment'}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(item.tags || []).slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {(item.tags || []).length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{(item.tags || []).length - 2} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{formatDateToText(item.date || item.createdAt || Date.now())}</span>
                        </div>
                      </TableCell>
                      {/* <TableCell>
                        <Badge className={getStatusColor(item.status || 'pending')}>
                          {item.status || 'pending'}
                        </Badge>
                      </TableCell> */}
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setSelectedFeedback(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Patient Feedback Details</DialogTitle>
                              <DialogDescription>
                                Complete review from {item.patientName}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedFeedback && (
                              <div className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <h4 className="font-medium mb-2">Patient Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedFeedback.patientName}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{formatDateToText(selectedFeedback.date)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Healthcare Provider</h4>
                                    <div className="space-y-2 text-sm">
                                      <div>{selectedFeedback.doctorName}</div>
                                      <div className="text-muted-foreground">{selectedFeedback.doctorSpecialty}</div>
                                      <div className="text-muted-foreground">{selectedFeedback.clinic}</div>
                                      {selectedFeedback.clinicId && (
                                        <div className="flex items-center space-x-2 mt-2">
                                          <span className="text-xs text-muted-foreground">Clinic Rating:</span>
                                          <div className="flex">
                                            {renderStars(Math.round(
                                              clinicsWithRatings.find(c => c.clinicId === selectedFeedback.clinicId)?.averageRating || 0
                                            ))}
                                          </div>
                                          <span className="text-xs font-medium">
                                            {clinicsWithRatings.find(c => c.clinicId === selectedFeedback.clinicId)?.averageRating.toFixed(1) || '0.0'}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Rating</h4>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex">
                                      {renderStars(selectedFeedback.rating)}
                                    </div>
                                    <span className={`font-medium ${getRatingColor(selectedFeedback.rating)}`}>
                                      {selectedFeedback.rating} out of 5
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Patient Comment</h4>
                                  <p className="text-sm bg-muted p-4 rounded-lg">
                                    {selectedFeedback.comment}
                                  </p>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Tags</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedFeedback.tags.map((tag, index) => (
                                      <Badge key={index} variant="secondary">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t">
                                  <Badge className={getStatusColor(selectedFeedback.status)}>
                                    {selectedFeedback.status}
                                  </Badge>
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
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}