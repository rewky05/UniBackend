"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRealDoctors, useRealClinics } from "@/hooks/useRealData";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatPhilippinePeso, formatDateToText, formatDateTimeToText } from "@/lib/utils";
import { useDoctorActions } from "@/hooks/useDoctors";
import { useAuth } from "@/hooks/useAuth";
import { useScheduleData } from "@/hooks/use-schedule-data";
import { DoctorInfoBanner } from "@/components/schedules/doctor-info-banner";
import { ScheduleCard } from "@/components/schedules/schedule-card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  User,
  Mail,
  Phone,
  Award,
  Check,
  Clock,
  X,
  Upload,
} from "lucide-react";
import Link from "next/link";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BulkImportDialog } from "@/components/doctors/bulk-import-dialog";

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
  const { user } = useAuth();
  const { updateDoctorStatus, loading: actionLoading, error: actionError } = useDoctorActions();

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
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>("");
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Real Firebase data
  const { doctors, loading, error } = useRealDoctors();
  const { clinics, loading: clinicsLoading } = useRealClinics();

  // Use the Firebase-integrated schedule data hook
  const {
    schedules,
    loading: scheduleLoading,
    error: scheduleError,
    handleScheduleAdd,
    handleScheduleEdit,
    handleScheduleDelete,
  } = useScheduleData(selectedDoctor?.id?.toString() || "");

  // Initialize verification status from doctor data
  useEffect(() => {
    if (selectedDoctor) {
      setVerificationStatus(selectedDoctor.status || 'pending');
    }
  }, [selectedDoctor]);

  const handleStatusChange = (newStatus: string) => {
    setPendingStatus(newStatus);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatus || !user || !selectedDoctor) return;
    
    setIsSaving(true);
    try {
      await updateDoctorStatus(
        selectedDoctor.id, 
        pendingStatus as 'pending' | 'verified' | 'suspended',
        user.email,
        verificationNotes
      );
      
      // Update local state
      setVerificationStatus(pendingStatus);
      setShowConfirmDialog(false);
      setPendingStatus("");
      setVerificationNotes("");
      
      // Show success message
      alert(`Doctor status successfully updated to ${pendingStatus}`);
    } catch (error) {
      console.error('Error updating doctor status:', error);
      alert('Failed to update doctor status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusConfirmationMessage = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Are you sure you want to verify this doctor? This will grant them full access to the system and send them a confirmation email.';
      case 'pending':
        return 'Are you sure you want to set this doctor status to pending? This will restrict their access until further verification.';
      case 'suspended':
        return 'Are you sure you want to suspend this doctor? This will immediately revoke their access to the system.';
      default:
        return 'Are you sure you want to change this doctor\'s status?';
    }
  };

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
            <Button 
              variant="outline"
              onClick={() => setShowBulkImport(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
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
                         <TableHead>Full Name</TableHead>
                         <TableHead>Contact Number</TableHead>
                         <TableHead>Email</TableHead>
                         <TableHead>Specialty</TableHead>
                         {/* <TableHead>Professional Fee</TableHead> */}
                         <TableHead>Clinics</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead className="w-[50px]">Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                                         <TableBody>
                       {sortedDoctors.length === 0 ? (
                                                   <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
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
                               <Avatar className="h-8 w-8">
                                 <AvatarImage src={doctor.profileImageUrl || ""} />
                                 <AvatarFallback>
                                   {`${doctor.firstName} ${doctor.lastName}`
                                     .split(" ")
                                     .map((n: string) => n[0])
                                     .join("")}
                                 </AvatarFallback>
                               </Avatar>
                               <div className="font-medium">
                                 {doctor.firstName} {doctor.lastName}
                               </div>
                             </div>
                           </TableCell>
                           <TableCell>
                             <div className="text-sm text-muted-foreground">
                               {doctor.contactNumber || 'No contact number'}
                             </div>
                           </TableCell>
                           <TableCell>
                             <div className="text-sm text-muted-foreground">
                               {doctor.email || 'No email'}
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setIsSheetOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setIsSheetOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Suspend Account
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
      {/* Sheet for doctor details */}
      {selectedDoctor && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="right" className="w-full max-w-md sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl backdrop-blur-md overflow-y-auto">
            <div className="p-6">
              <SheetHeader>
                <SheetTitle>{selectedDoctor.firstName} {selectedDoctor.lastName} - Specialist Details</SheetTitle>
                <SheetDescription>Full profile and professional information</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col items-center md:items-start gap-6 mt-6">
                <Avatar className="h-20 w-20 mb-2">
                  <AvatarImage src={selectedDoctor.profileImageUrl || ""} />
                  <AvatarFallback className="text-lg">
                    {`${selectedDoctor.firstName} ${selectedDoctor.lastName}`.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <Badge className={getStatusColor(selectedDoctor.status || 'pending')}>
                  {getStatusIcon(selectedDoctor.status || 'pending')}
                  <span className="ml-1 capitalize">{selectedDoctor.status}</span>
                </Badge>
              </div>
              <div className="mt-8">
                <Accordion type="single" collapsible defaultValue="overview">
                  {/* Overview Section */}
                  <AccordionItem value="overview">
                    <AccordionTrigger className="text-lg font-semibold">Overview</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-8">
                        {/* Personal Information */}
                        <div>
                          <h3 className="text-base font-semibold mb-4 text-foreground">Personal Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                         <div className="flex flex-col">
                               <span className="text-xs text-muted-foreground mb-1">First Name</span>
                               <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                 {selectedDoctor.firstName || 'Not specified'}
                               </span>
                             </div>
                             <div className="flex flex-col">
                               <span className="text-xs text-muted-foreground mb-1">Middle Name</span>
                               <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                 {selectedDoctor.middleName || "N/A"}
                               </span>
                             </div>
                             <div className="flex flex-col">
                               <span className="text-xs text-muted-foreground mb-1">Last Name</span>
                               <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                 {selectedDoctor.lastName || 'Not specified'}
                               </span>
                             </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground mb-1">Email</span>
                              <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedDoctor.email || 'No email'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground mb-1">Contact Number</span>
                              <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedDoctor.contactNumber}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground mb-1">Gender</span>
                              <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedDoctor.gender ? selectedDoctor.gender.charAt(0).toUpperCase() + selectedDoctor.gender.slice(1) : 'Not specified'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground mb-1">Date of Birth</span>
                              <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedDoctor.dateOfBirth ? formatDateToText(selectedDoctor.dateOfBirth) : 'Not specified'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground mb-1">Civil Status</span>
                              <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedDoctor.civilStatus ? selectedDoctor.civilStatus.charAt(0).toUpperCase() + selectedDoctor.civilStatus.slice(1) : 'Not specified'}</span>
                            </div>
                            <div className="flex flex-col md:col-span-2">
                              <span className="text-xs text-muted-foreground mb-1">Address</span>
                              <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedDoctor.address || 'No address'}</span>
                            </div>
                          </div>
                        </div>
                        {/* Professional Information */}
                        <div>
                          <h3 className="text-base font-semibold mb-4 text-foreground">Professional Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground mb-1">Specialty</span>
                              <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedDoctor.specialty || 'Not specified'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground mb-1">PRC ID</span>
                              <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedDoctor.prcId || 'Not specified'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground mb-1">PRC Expiry</span>
                              <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedDoctor.prcExpiryDate ? formatDateToText(selectedDoctor.prcExpiryDate) : 'Not specified'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground mb-1">Medical License</span>
                              <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedDoctor.medicalLicenseNumber || 'Not specified'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground mb-1">Professional Fee</span>
                              <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{formatPhilippinePeso(selectedDoctor.professionalFee)}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground mb-1">Last Login</span>
                              <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedDoctor.lastLogin ? formatDateTimeToText(selectedDoctor.lastLogin) : 'Not specified'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  {/* Schedules Section */}
                  <AccordionItem value="schedules">
                    <AccordionTrigger className="text-lg font-semibold">Schedules</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6">
                        <h3 className="text-base font-semibold mb-4 text-foreground">Schedule Management</h3>
                                                 <DoctorInfoBanner
                           doctor={{ ...selectedDoctor, id: selectedDoctor.id?.toString() || '', name: `${selectedDoctor.firstName || ''} ${selectedDoctor.lastName || ''}` }}
                         />
                        {scheduleError && (
                          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{scheduleError}</p>
                          </div>
                        )}
                        <div className="space-y-6">
                                                     <ScheduleCard
                             schedules={schedules}
                             onScheduleAdd={handleScheduleAdd}
                             onScheduleEdit={handleScheduleEdit}
                             onScheduleDelete={handleScheduleDelete}
                             specialistId={selectedDoctor.id?.toString() || ""}
                           />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  {/* Verification Section */}
                  <AccordionItem value="verification">
                    <AccordionTrigger className="text-lg font-semibold">Verification</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6">
                        <h3 className="text-base font-semibold mb-4 text-foreground">Verification Control</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="status" className="text-sm font-medium">Current Status</Label>
                            <div className="p-3 border rounded-lg bg-muted/50">
                              <Badge className={getStatusColor(verificationStatus)}>
                                {verificationStatus === "verified" && <Check className="h-3 w-3 mr-1" />}
                                {verificationStatus === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                {verificationStatus === "suspended" && <X className="h-3 w-3 mr-1" />}
                                <span className="capitalize">{verificationStatus || 'pending'}</span>
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newStatus" className="text-sm font-medium">Change Status To</Label>
                            <Select value={pendingStatus} onValueChange={handleStatusChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select new status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending Review</SelectItem>
                                <SelectItem value="verified">Verified</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes" className="text-sm font-medium">Verification Notes</Label>
                          <Textarea
                            id="notes"
                            placeholder="Add notes about the verification process..."
                            value={verificationNotes}
                            onChange={(e) => setVerificationNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                        {actionError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{actionError}</p>
                          </div>
                        )}
                        {pendingStatus && (
                          <div className="flex justify-end">
                            <Button onClick={() => setShowConfirmDialog(true)} disabled={isSaving || actionLoading}>
                              {isSaving || actionLoading ? "Updating..." : "Update Status"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              <div className="flex justify-end gap-2 mt-8">
                <Button variant="outline"><Edit className="h-4 w-4 mr-2" /> Edit Details</Button>
                {/* <SheetClose asChild>
                  <Button variant="ghost">Close</Button>
                </SheetClose> */}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              {getStatusConfirmationMessage(pendingStatus)}
              {verificationNotes && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Verification Notes:</p>
                  <p className="text-sm text-muted-foreground">{verificationNotes}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowConfirmDialog(false);
              setPendingStatus("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmStatusChange}
              disabled={isSaving || actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving || actionLoading ? "Updating..." : "Confirm Change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        onSuccess={() => {
          // Refresh the doctors list
          window.location.reload();
        }}
      />
    </DashboardLayout>
  );
}
