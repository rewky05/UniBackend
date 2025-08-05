"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRealDoctors, useRealClinics } from "@/hooks/useRealData";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatPhilippinePeso, formatDateToText } from "@/lib/utils";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Download,
  UserCheck,
  UserX,
  Calendar,
  MapPin,
} from "lucide-react";
import Link from "next/link";

const specialties = [
  "All Specialties",
  "Cardiology",
  "Pediatrics",
  "Dermatology",
  "Orthopedics",
  "Neurology",
];
const statuses = ["All Status", "Verified", "Pending", "Suspended"];
const sortOptions = [
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'specialty-asc', label: 'Specialty A-Z' },
  { value: 'specialty-desc', label: 'Specialty Z-A' },
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'status-asc', label: 'Status A-Z' },
  { value: 'status-desc', label: 'Status Z-A' },
];

export default function DoctorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [selectedClinic, setSelectedClinic] = useState("All Clinics");
  const [selectedSort, setSelectedSort] = useState("date-desc");
  const [selectedStatus, setSelectedStatus] = useState(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      const normalizedParam =
        statusParam.charAt(0).toUpperCase() +
        statusParam.slice(1).toLowerCase();
      if (statuses.includes(normalizedParam)) {
        return normalizedParam;
      }
    }
    return "All Status";
  });

  // Real Firebase data
  const { doctors, loading, error } = useRealDoctors();
  const { clinics, loading: clinicsLoading } = useRealClinics();

  // Create clinic name mapping
  const getClinicName = (clinicId: string) => {
    if (clinicsLoading) {
      return 'Loading...';
    }
    const clinic = clinics.find(c => c.id === clinicId);
    return clinic ? clinic.name : `Clinic ${clinicId}`;
  };

  // Update url filter status
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    let changed = false;

    if (selectedStatus !== "All Status") {
      if (currentParams.get("status") !== selectedStatus.toLowerCase()) {
        currentParams.set("status", selectedStatus.toLowerCase());
        changed = true;
      }
    } else {
      if (currentParams.has("status")) {
        currentParams.delete("status");
        changed = true;
      }
    }
    if (changed) {
      router.replace(`?${currentParams.toString()}`);
    }
  }, [selectedStatus, selectedSpecialty, searchQuery, router, searchParams]);

      const filteredDoctors = doctors.filter((doctor: any) => {
    const matchesSearch =
      `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (doctor.email && doctor.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === "All Specialties" || doctor.specialty === selectedSpecialty;
    const matchesStatus =
      selectedStatus === "All Status" ||
      doctor.status === selectedStatus.toLowerCase();
    const matchesClinic =
      selectedClinic === "All Clinics" ||
      (doctor.clinicAffiliations && doctor.clinicAffiliations.includes(selectedClinic));

    return matchesSearch && matchesSpecialty && matchesStatus && matchesClinic;
  });

  // Sort the filtered doctors
  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    switch (selectedSort) {
      case 'name-asc':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'name-desc':
        return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
      case 'specialty-asc':
        return (a.specialty || '').localeCompare(b.specialty || '');
      case 'specialty-desc':
        return (b.specialty || '').localeCompare(a.specialty || '');
      case 'date-desc':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'date-asc':
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      case 'status-asc':
        return (a.status || '').localeCompare(b.status || '');
      case 'status-desc':
        return (b.status || '').localeCompare(a.status || '');
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400";
      case "suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <UserCheck className="h-3 w-3" />;
      case "pending":
        return <Calendar className="h-3 w-3" />;
      case "suspended":
        return <UserX className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout title="">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Specialist Doctor Management</h2>
            <p className="text-muted-foreground">
              Manage specialist healthcare professionals and their credentials
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/doctors/add">
                <Plus className="h-4 w-4 mr-2" />
                Add Specialist
              </Link>
            </Button>
            {/* <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export List
            </Button> */}
          </div>
        </div>

        {/* Show loading state */}
        {(loading || clinicsLoading) && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading specialist data...</p>
            </div>
          </div>
        )}

        {/* Show error state */}
        {error && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 mb-4">⚠️</div>
              <p className="text-red-600 mb-2">Failed to load specialist data</p>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Show content when not loading and no error */}
        {!loading && !clinicsLoading && !error && (
          <>
            {/* Search and Filters */}
            <Card className="card-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search specialists by name, email, or specialty..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                                         <Select
                       value={selectedSpecialty}
                       onValueChange={setSelectedSpecialty}
                     >
                       <SelectTrigger className="w-40">
                         <SelectValue placeholder="Specialty" />
                       </SelectTrigger>
                       <SelectContent>
                         {specialties.map((specialty) => (
                           <SelectItem key={specialty} value={specialty}>
                             {specialty}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                     <Select
                       value={selectedClinic}
                       onValueChange={setSelectedClinic}
                     >
                       <SelectTrigger className="w-40">
                         <SelectValue placeholder="Clinic" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="All Clinics">All Clinics</SelectItem>
                         {clinics.map((clinic) => (
                           <SelectItem key={clinic.id} value={clinic.id}>
                             {clinic.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                    <Select
                      value={selectedStatus}
                      onValueChange={setSelectedStatus}
                    >
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

            {/* Doctors Table */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Specialist Doctors ({filteredDoctors.length})
                </CardTitle>
                <CardDescription>
                  Comprehensive list of specialist healthcare professionals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Specialty</TableHead>
                        {/* <TableHead>Professional Fee</TableHead> */}
                        <TableHead>Clinics</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>PRC Expiry</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                                         <TableBody>
                       {sortedDoctors.length === 0 ? (
                         <TableRow>
                           <TableCell colSpan={7} className="text-center py-8">
                             <div className="flex flex-col items-center space-y-2">
                               <div className="text-muted-foreground text-lg">👨‍⚕️</div>
                               <p className="text-muted-foreground font-medium">No specialists found</p>
                               <p className="text-sm text-muted-foreground">
                                 Try adjusting your search criteria or filters
                               </p>
                             </div>
                           </TableCell>
                         </TableRow>
                       ) : (
                         sortedDoctors.map((doctor) => (
                          <TableRow key={doctor.id} className="table-row-hover">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={doctor.profileImageUrl || ""} />
                                <AvatarFallback>
                                  {`${doctor.firstName} ${doctor.lastName}`
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{doctor.firstName} {doctor.lastName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {doctor.email}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {doctor.contactNumber}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{doctor.specialty}</Badge>
                          </TableCell>
                          {/* <TableCell>
                            <div className="text-sm">
                              {formatPhilippinePeso(doctor.professionalFee)}
                            </div>
                          </TableCell> */}
                          <TableCell>
                            <div className="space-y-1">
                              {doctor.clinicAffiliations?.map((clinic: string, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center text-sm"
                                >
                                  <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                                  {getClinicName(clinic)}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(doctor.status || 'pending')}>
                              {getStatusIcon(doctor.status || 'pending')}
                              <span className="ml-1 capitalize">
                                {doctor.status}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {doctor.prcExpiryDate ? formatDateToText(doctor.prcExpiryDate) : 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              PRC: {doctor.prcId}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {doctor.createdAt ? formatDateToText(doctor.createdAt) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/doctors/${doctor.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                {/* <DropdownMenuItem asChild>
                                  <Link href={`/doctors/${doctor.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem> */}
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
