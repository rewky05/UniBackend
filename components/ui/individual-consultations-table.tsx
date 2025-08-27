"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatConsultationTime } from "@/lib/utils/consultation-time";
import { formatDateToText } from "@/lib/utils";
import { Clock, User, UserCheck, Calendar, Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { IndividualConsultation } from "@/lib/utils/consultation-time";

interface IndividualConsultationsTableProps {
  consultations: IndividualConsultation[];
  className?: string;
  limit?: number;
}

interface FilterState {
  searchTerm: string;
  specialty: string;
  doctorName: string;
  patientName: string;
  consultationType: string;
  dateFrom: string;
  dateTo: string;
  durationMin: string;
  durationMax: string;
}

export function IndividualConsultationsTable({ 
  consultations, 
  className, 
  limit = 10 
}: IndividualConsultationsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    specialty: 'all',
    doctorName: 'all',
    patientName: '',
    consultationType: 'all',
    dateFrom: '',
    dateTo: '',
    durationMin: '',
    durationMax: ''
  });

  // Get unique specialties for filter dropdown
  const specialties = useMemo(() => {
    const uniqueSpecialties = new Set<string>();
    consultations.forEach(consultation => {
      if (consultation.specialty) {
        uniqueSpecialties.add(consultation.specialty);
      }
    });
    return Array.from(uniqueSpecialties).sort();
  }, [consultations]);

  // Get unique doctor names for filter dropdown
  const doctorNames = useMemo(() => {
    const uniqueDoctors = new Set<string>();
    consultations.forEach(consultation => {
      if (consultation.doctorName) {
        uniqueDoctors.add(consultation.doctorName);
      }
    });
    return Array.from(uniqueDoctors).sort();
  }, [consultations]);

  // Apply filters to consultations
  const filteredConsultations = useMemo(() => {
    return consultations.filter(consultation => {
      // Search term filter (searches across patient name, doctor name, and specialty)
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          consultation.patientName?.toLowerCase().includes(searchLower) ||
          consultation.doctorName?.toLowerCase().includes(searchLower) ||
          consultation.specialty?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Specialty filter
      if (filters.specialty && filters.specialty !== 'all' && consultation.specialty !== filters.specialty) {
        return false;
      }

      // Doctor name filter
      if (filters.doctorName && filters.doctorName !== 'all' && consultation.doctorName !== filters.doctorName) {
        return false;
      }

      // Patient name filter
      if (filters.patientName && !consultation.patientName?.toLowerCase().includes(filters.patientName.toLowerCase())) {
        return false;
      }

      // Consultation type filter
      if (filters.consultationType && filters.consultationType !== 'all' && consultation.type !== filters.consultationType) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom && consultation.appointmentDate < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && consultation.appointmentDate > filters.dateTo) {
        return false;
      }

      // Duration range filter
      if (filters.durationMin) {
        const minDuration = parseInt(filters.durationMin);
        if (consultation.consultationTimeMinutes < minDuration) {
          return false;
        }
      }
      if (filters.durationMax) {
        const maxDuration = parseInt(filters.durationMax);
        if (consultation.consultationTimeMinutes > maxDuration) {
          return false;
        }
      }

      return true;
    });
  }, [consultations, filters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredConsultations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedConsultations = filteredConsultations.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      specialty: 'all',
      doctorName: 'all',
      patientName: '',
      consultationType: 'all',
      dateFrom: '',
      dateTo: '',
      durationMin: '',
      durationMax: ''
    });
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'specialty' || key === 'doctorName' || key === 'consultationType') {
      return value !== 'all';
    }
    return value !== '';
  });

  if (consultations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Individual Consultation Times
          </CardTitle>
          <CardDescription>
            Detailed consultation times for each completed appointment and referral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No completed consultations found</p>
            <p className="text-sm">Consultation times will appear here once appointments or referrals are completed.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Individual Consultation Times
            </CardTitle>
            <CardDescription>
              {hasActiveFilters 
                ? `Showing ${filteredConsultations.length} of ${consultations.length} consultations (filtered)`
                : `Showing ${paginatedConsultations.length} of ${consultations.length} completed consultations`
              }
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
                  {Object.values(filters).filter(v => v !== '').length}
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Filters Section */}
      {showFilters && (
        <CardContent className="border-b pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Term */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients, doctors, specialties..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Specialty Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Specialty</label>
              <Select value={filters.specialty} onValueChange={(value) => handleFilterChange('specialty', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All specialties</SelectItem>
                  {specialties.map(specialty => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Doctor Name Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Doctor</label>
              <Select value={filters.doctorName} onValueChange={(value) => handleFilterChange('doctorName', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All doctors</SelectItem>
                  {doctorNames.map(doctor => (
                    <SelectItem key={doctor} value={doctor}>
                      {doctor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Consultation Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={filters.consultationType} onValueChange={(value) => handleFilterChange('consultationType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>

            {/* Duration Range Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Duration (min)</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.durationMin}
                onChange={(e) => handleFilterChange('durationMin', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Duration (min)</label>
              <Input
                type="number"
                placeholder="480"
                value={filters.durationMax}
                onChange={(e) => handleFilterChange('durationMax', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      )}

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedConsultations.map((consultation, index) => (
                <TableRow key={`${consultation.type}-${consultation.id}-${index}`}>
                  <TableCell>
                    <Badge 
                      variant={consultation.type === 'appointment' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {consultation.type === 'appointment' ? (
                        <Calendar className="h-3 w-3 mr-1" />
                      ) : (
                        <UserCheck className="h-3 w-3 mr-1" />
                      )}
                      {consultation.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{consultation.patientName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span>{consultation.doctorName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {consultation.specialty ? (
                      <Badge variant="outline" className="text-xs">
                        {consultation.specialty}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDateToText(consultation.appointmentDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">
                      {consultation.appointmentTime}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatConsultationTime(consultation.consultationTimeMinutes)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredConsultations.length)} of {filteredConsultations.length} results
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* No results message */}
        {filteredConsultations.length === 0 && hasActiveFilters && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No consultations match your current filters</p>
            <p className="text-sm">Try adjusting your search criteria or clear all filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
