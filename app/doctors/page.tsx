"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNavigationLoading } from "@/hooks/useNavigationLoading";
import { useRealDoctors, useRealClinics, useRealReferrals } from "@/hooks/useRealData";
import { realDataService } from "@/lib/services/real-data.service";
import { ProfessionalFeeStats } from "@/components/doctors/professional-fee-stats";
import { FeeRequestNotificationButton } from "@/components/fee-requests/fee-request-notification-button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatPhilippinePeso, formatDateToText, formatDateTimeToText, safeGetTimestamp } from "@/lib/utils";
import { useDoctorActions } from "@/hooks/useDoctors";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useScheduleData } from "@/hooks/use-schedule-data";
import { DoctorInfoBanner } from "@/components/schedules/doctor-info-banner";
import { ScheduleCard } from "@/components/schedules/schedule-card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SimpleConfirmationModal } from "@/components/ui/simple-confirmation-modal";
import { ResultModal } from "@/components/ui/result-modal";
// Email service is now handled via API route
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
  Loader2,
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
import { ReportActions } from "@/components/ui/report-actions";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const specialties = [
  "All Specialties",
  "Cardiology",
  "Dermatology",
  "Emergency Medicine",
  "Family Medicine",
  "Internal Medicine",
  "Neurology",
  "Obstetrics and Gynecology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Surgery",
  "Urology",
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
  const { toast } = useToast();
  const { updateDoctorStatus, loading: actionLoading, error: actionError } = useDoctorActions();
  const { navigateWithLoading } = useNavigationLoading({
    loadingMessage: '', // No message for clean navigation
    delay: 1000,
  });

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
  const [pendingStatus, setPendingStatus] = useState<string>("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState<{
    success: boolean;
    emailSent: boolean;
    emailError?: string;
    doctorName: string;
    newStatus: string;
  } | null>(null);
  const { referrals, loading: referralsLoading } = useRealReferrals();
  
  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    contactNumber: string;
    gender: string;
    civilStatus: string;
    address: string;
    specialty: string;
    prcId: string;
    prcExpiryDate: string;
    medicalLicenseNumber: string;
    professionalFee: number;
  }>({
    contactNumber: '',
    gender: '',
    civilStatus: '',
    address: '',
    specialty: '',
    prcId: '',
    prcExpiryDate: '',
    medicalLicenseNumber: '',
    professionalFee: 0
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const handleConfirmStatusChange = async (notes: string): Promise<{ success: boolean; emailSent?: boolean; emailError?: string }> => {
    if (!pendingStatus || !user || !selectedDoctor) {
      return { success: false, emailError: 'Missing required data' };
    }
    
    setIsSaving(true);
    try {
      // Update doctor status in database
      await updateDoctorStatus(
        selectedDoctor.id, 
        pendingStatus as 'pending' | 'verified' | 'suspended',
        user.email,
        notes
      );
      
      // Send email notification via API route
      let emailSent = false;
      let emailError: string | undefined;
      
      try {
        const emailData = {
          doctorName: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
          doctorEmail: selectedDoctor.email,
          verificationDate: new Date().toISOString(),
          adminName: user.email,
          clinicName: selectedDoctor.clinicName || 'UniHealth Medical System',
          specialty: selectedDoctor.specialty || 'General Medicine',
          newStatus: pendingStatus as 'verified' | 'suspended' | 'pending',
          reason: notes || undefined
        };

        console.log('📧 [CLIENT] Sending email request:', {
          doctorName: emailData.doctorName,
          doctorEmail: emailData.doctorEmail,
          newStatus: emailData.newStatus,
          apiUrl: '/api/send-verification-email'
        });

        const response = await fetch('/api/send-verification-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        console.log('📧 [CLIENT] API Response status:', response.status);
        console.log('📧 [CLIENT] API Response headers:', Object.fromEntries(response.headers.entries()));

        let result;
        try {
          result = await response.json();
          console.log('📧 [CLIENT] API Response body:', result);
        } catch (jsonError) {
          console.error('❌ [CLIENT] Failed to parse JSON response:', jsonError);
          console.error('❌ [CLIENT] Response status:', response.status);
          console.error('❌ [CLIENT] Response text:', await response.text());
          throw new Error(`Invalid response format from server. Status: ${response.status}`);
        }

        if (response.ok && result.success) {
          emailSent = true;
          console.log('✅ [CLIENT] Email sent successfully:', result.messageId);
        } else {
          emailError = result.error || 'Failed to send email';
          console.error('❌ [CLIENT] Email failed:', emailError);
          console.error('❌ [CLIENT] Full error response:', result);
        }
      } catch (error) {
        console.error('❌ [CLIENT] Error sending email notification:', error);
        emailError = error instanceof Error ? error.message : 'Failed to send email';
      }
      
      // Update local state
      setVerificationStatus(pendingStatus);
      setPendingStatus("");
      setVerificationNotes("");
      
      // Show result modal
      setResultData({
        success: true,
        emailSent,
        emailError,
        doctorName: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        newStatus: pendingStatus
      });
      setShowResultModal(true);

      return { success: true, emailSent, emailError };
    } catch (error) {
      console.error('Error updating doctor status:', error);
      
      // Show error result modal
      setResultData({
        success: false,
        emailSent: false,
        emailError: error instanceof Error ? error.message : 'Failed to update doctor status',
        doctorName: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
        newStatus: pendingStatus
      });
      setShowResultModal(true);
      
      return { success: false, emailError: error instanceof Error ? error.message : 'Failed to update doctor status' };
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
        return `${a.firstName} ${a.middleName || ''} ${a.lastName}`.localeCompare(`${b.firstName} ${b.middleName || ''} ${b.lastName}`);
      case 'name-desc':
        return `${b.firstName} ${b.middleName || ''} ${b.lastName}`.localeCompare(`${a.firstName} ${a.middleName || ''} ${a.lastName}`);
      case 'specialty-asc':
        return (a.specialty || '').localeCompare(b.specialty || '');
      case 'specialty-desc':
        return (b.specialty || '').localeCompare(a.specialty || '');
      case 'date-desc':
        return safeGetTimestamp(b.createdAt) - safeGetTimestamp(a.createdAt);
      case 'date-asc':
        return safeGetTimestamp(a.createdAt) - safeGetTimestamp(b.createdAt);
      case 'status-asc':
        return (a.status || '').localeCompare(b.status || '');
      case 'status-desc':
        return (b.status || '').localeCompare(a.status || '');
      default:
        return 0;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDoctors = sortedDoctors.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSpecialty, selectedStatus, selectedClinic, selectedSort]);

  // PDF report columns configuration
  const pdfColumns = [
    { key: 'name', label: 'Full Name', render: (doctor: any) => `${doctor.firstName} ${doctor.middleName || ''} ${doctor.lastName}` },
    { key: 'email', label: 'Email' },
    { key: 'specialty', label: 'Specialty' },
    { key: 'status', label: 'Status', render: (doctor: any) => doctor.status?.charAt(0).toUpperCase() + doctor.status?.slice(1) },
    { key: 'clinicAffiliations', label: 'Clinic Affiliations', render: (doctor: any) => 
      doctor.clinicAffiliations?.map((clinicId: string) => getClinicName(clinicId)).join(', ') || 'N/A' 
    },
    { key: 'createdAt', label: 'Date Added', render: (doctor: any) => formatDateToText(doctor.createdAt) },
  ];

  // PDF report filters
  const pdfFilters = [
    { label: 'Search', value: searchQuery || 'None' },
    { label: 'Specialty', value: selectedSpecialty },
    { label: 'Status', value: selectedStatus },
    { label: 'Clinic', value: selectedClinic },
  ].filter(filter => filter.value !== 'All Specialties' && filter.value !== 'All Status' && filter.value !== 'All Clinics');

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

  // Inline editing functions
  const handleStartEdit = () => {
    setEditData({
      contactNumber: selectedDoctor.contactNumber || '',
      gender: selectedDoctor.gender || '',
      civilStatus: selectedDoctor.civilStatus || '',
      address: selectedDoctor.address || '',
      specialty: selectedDoctor.specialty || '',
      prcId: selectedDoctor.prcId || '',
      prcExpiryDate: selectedDoctor.prcExpiryDate || selectedDoctor.prcExpiry || '', // Use prcExpiryDate from database, fallback to prcExpiry
      medicalLicenseNumber: selectedDoctor.medicalLicenseNumber || selectedDoctor.medicalLicense || '', // Use medicalLicenseNumber from database, fallback to medicalLicense
      professionalFee: selectedDoctor.professionalFee || 0
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      contactNumber: '',
      gender: '',
      civilStatus: '',
      address: '',
      specialty: '',
      prcId: '',
      prcExpiryDate: '',
      medicalLicenseNumber: '',
      professionalFee: 0
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedDoctor || !user) return;
    
    // Validate required fields
    if (!editData.specialty?.trim()) {
      toast({
        title: "Validation Error",
        description: "Specialty is required.",
        variant: "destructive",
      });
      return;
    }
    
    // Show confirmation dialog instead of directly saving
    setShowSaveConfirmation(true);
  };

  const handleConfirmSave = async () => {
    if (!selectedDoctor || !user) return;
    
    console.log('Current selectedDoctor before update:', selectedDoctor);
    console.log('Current editData:', editData);
    
    setIsSavingEdit(true);
    try {
      // Prepare the data for database update
      const updateData: any = {};
      
      // Map the edit fields to the correct database field names
      if (editData.contactNumber !== undefined) {
        updateData.contactNumber = editData.contactNumber;
      }
      if (editData.gender !== undefined) {
        updateData.gender = editData.gender;
      }
      if (editData.civilStatus !== undefined) {
        updateData.civilStatus = editData.civilStatus;
      }
      if (editData.address !== undefined) {
        updateData.address = editData.address;
      }
      if (editData.specialty !== undefined) {
        updateData.specialty = editData.specialty;
      }
      if (editData.prcId !== undefined) {
        updateData.prcId = editData.prcId;
      }
      if (editData.prcExpiryDate !== undefined) {
        // Convert date to ISO string format for database storage
        updateData.prcExpiryDate = editData.prcExpiryDate;
        console.log('PRC Expiry date being saved:', editData.prcExpiryDate);
      }
      if (editData.medicalLicenseNumber !== undefined) {
        updateData.medicalLicenseNumber = editData.medicalLicenseNumber;
        console.log('Medical License being saved:', editData.medicalLicenseNumber);
      }
      if (editData.professionalFee !== undefined) {
        updateData.professionalFee = Number(editData.professionalFee) || 0;
      }

      // Save to database using the real data service
      console.log('Saving updateData:', updateData);
      await realDataService.updateDoctor(selectedDoctor.id, updateData);
      
      // Reset editing state first
      setIsEditing(false);
      setEditData({
        contactNumber: '',
        gender: '',
        civilStatus: '',
        address: '',
        specialty: '',
        prcId: '',
        prcExpiryDate: '',
        medicalLicenseNumber: '',
        professionalFee: 0
      });
      
      // Update local state to reflect changes with proper field mapping
      const updatedDoctor = {
        ...selectedDoctor,
        ...updateData,
        // Ensure the display fields are properly updated
        prcExpiryDate: updateData.prcExpiryDate || selectedDoctor.prcExpiryDate,
        medicalLicenseNumber: updateData.medicalLicenseNumber || selectedDoctor.medicalLicenseNumber
      };
      console.log('Updated doctor state:', updatedDoctor);
      setSelectedDoctor(updatedDoctor);
      
      // Show success message
      toast({
        title: "Success",
        description: "Doctor information updated successfully!",
      });
    } catch (error) {
      console.error('Error updating doctor:', error);
      toast({
        title: "Error",
        description: "Failed to update doctor information. Please try again.",
        variant: "destructive",
      });
      // Reset editing state on error as well
      setIsEditing(false);
      setEditData({
        contactNumber: '',
        gender: '',
        civilStatus: '',
        address: '',
        specialty: '',
        prcId: '',
        prcExpiryDate: '',
        medicalLicenseNumber: '',
        professionalFee: 0
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
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
            <Button onClick={() => navigateWithLoading('/doctors/add')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Specialist
            </Button>
            {/* <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export List
            </Button> */}
          </div>
        </div>

        {/* Show loading state */}
        {(loading || clinicsLoading || referralsLoading) && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading specialist data and statistics...</p>
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
                          <SelectItem key={clinic.id} value={clinic.id || ""}>
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
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedSpecialty("All Specialties");
                        setSelectedClinic("All Clinics");
                        setSelectedStatus("All Status");
                        setSelectedSort("date-desc");
                      }}
                      disabled={searchQuery === "" && selectedSpecialty === "All Specialties" && selectedClinic === "All Clinics" && selectedStatus === "All Status" && selectedSort === "date-desc"}
                      className="w-32"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Doctors Table */}
            <Card className="card-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Specialist Doctors ({filteredDoctors.length})
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Comprehensive list of specialist healthcare professionals
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <FeeRequestNotificationButton />
                    <ReportActions
                      title="Specialist Doctors Report"
                      subtitle={`${filteredDoctors.length} specialists found`}
                      data={sortedDoctors}
                      columns={pdfColumns}
                      filters={pdfFilters}
                      filename={`specialist_doctors_report_${formatDateToText(new Date().toISOString()).replace(/\s+/g, '_')}.pdf`}
                    />
                  </div>
                </div>
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
                         paginatedDoctors.map((doctor) => (
                          <TableRow key={doctor.id} className="table-row-hover">
                                                     <TableCell>
                             <div className="flex items-center space-x-3">
                               <Avatar className="h-8 w-8">
                                 <AvatarImage src={doctor.profileImageUrl || ""} />
                                                                   <AvatarFallback>
                                    {`${doctor.firstName} ${doctor.middleName || ''} ${doctor.lastName}`
                                      .split(" ")
                                      .filter((n: string) => n.trim())
                                      .map((n: string) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                               </Avatar>
                                                               <div className="font-medium">
                                  {doctor.firstName} {doctor.middleName || ''} {doctor.lastName}
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setIsSheetOpen(true);
                              }}
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
                
                {/* Pagination */}
                {sortedDoctors.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={sortedDoctors.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                )}
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
                <div className="flex items-center justify-between">
                                     <SheetTitle>{selectedDoctor.firstName} {selectedDoctor.middleName || ''} {selectedDoctor.lastName} - Specialist Details</SheetTitle>
                  <Badge className={getStatusColor(selectedDoctor.status || 'pending')}>
                    {getStatusIcon(selectedDoctor.status || 'pending')}
                    <span className="ml-1 capitalize">{selectedDoctor.status}</span>
                  </Badge>
                </div>
                <SheetDescription className="mt-1">Full profile and professional information</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col items-center md:items-start gap-6 mt-6">
                {/* <Avatar className="h-20 w-20 mb-2">
                  <AvatarImage src={selectedDoctor.profileImageUrl || ""} />
                  <AvatarFallback className="text-lg">
                    {`${selectedDoctor.firstName} ${selectedDoctor.lastName}`.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar> */}
                {/* Professional Fee Statistics */}
                <div className="">
                  <ProfessionalFeeStats
                    doctorId={selectedDoctor.id?.toString() || ""}
                    professionalFee={selectedDoctor.professionalFee || 0}
                    referrals={referrals}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Accordion type="single" collapsible defaultValue="overview">
                  {/* Overview Section */}
                  <AccordionItem value="overview">
                    <AccordionTrigger className="text-lg font-semibold">Overview</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-8">
                                                 {/* Personal Information */}
                         <div>
                                                       <div className="flex items-center justify-between mb-4">
                              <h3 className="text-base font-semibold text-foreground">Personal Information</h3>
                              <div className="flex gap-2">
                                {isEditing ? (
                                  <>
                                                                         <Button 
                                       variant="outline" 
                                       size="sm" 
                                       onClick={handleCancelEdit}
                                       disabled={isSavingEdit}
                                       className="min-w-[80px]"
                                     >
                                       Cancel
                                     </Button>
                                                                         <Button 
                                       size="sm" 
                                       onClick={handleSaveEdit}
                                       disabled={isSavingEdit}
                                       className="min-w-[100px]"
                                     >
                                       Save Changes
                                     </Button>
                                  </>
                                ) : (
                                  <Button variant="outline" size="sm" onClick={handleStartEdit}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit Details
                                  </Button>
                                )}
                              </div>
                            </div>
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
                               {isEditing ? (
                                 <Input
                                   value={editData.contactNumber || ''}
                                   onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                                   placeholder="Enter contact number"
                                   className="font-medium text-base"
                                 />
                               ) : (
                                 <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                   {selectedDoctor.contactNumber || 'No contact number'}
                                 </span>
                               )}
                             </div>
                                                         <div className="flex flex-col">
                               <span className="text-xs text-muted-foreground mb-1">Gender</span>
                               {isEditing ? (
                                 <Select value={editData.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
                                   <SelectTrigger className="font-medium text-base">
                                     <SelectValue placeholder="Select gender" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="male">Male</SelectItem>
                                     <SelectItem value="female">Female</SelectItem>
                                     <SelectItem value="other">Other</SelectItem>
                                     <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                   </SelectContent>
                                 </Select>
                               ) : (
                                 <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                   {selectedDoctor.gender ? selectedDoctor.gender.charAt(0).toUpperCase() + selectedDoctor.gender.slice(1) : 'Not specified'}
                                 </span>
                               )}
                             </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground mb-1">Date of Birth</span>
                              <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedDoctor.dateOfBirth ? formatDateToText(selectedDoctor.dateOfBirth) : 'Not specified'}</span>
                            </div>
                                                         <div className="flex flex-col">
                               <span className="text-xs text-muted-foreground mb-1">Civil Status</span>
                               {isEditing ? (
                                 <Select value={editData.civilStatus || ''} onValueChange={(value) => handleInputChange('civilStatus', value)}>
                                   <SelectTrigger className="font-medium text-base">
                                     <SelectValue placeholder="Select civil status" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="single">Single</SelectItem>
                                     <SelectItem value="married">Married</SelectItem>
                                     <SelectItem value="divorced">Divorced</SelectItem>
                                     <SelectItem value="widowed">Widowed</SelectItem>
                                     <SelectItem value="separated">Separated</SelectItem>
                                   </SelectContent>
                                 </Select>
                               ) : (
                                 <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                   {selectedDoctor.civilStatus ? selectedDoctor.civilStatus.charAt(0).toUpperCase() + selectedDoctor.civilStatus.slice(1) : 'Not specified'}
                                 </span>
                               )}
                             </div>
                                                         <div className="flex flex-col md:col-span-2">
                               <span className="text-xs text-muted-foreground mb-1">Address</span>
                               {isEditing ? (
                                 <Input
                                   value={editData.address || ''}
                                   onChange={(e) => handleInputChange('address', e.target.value)}
                                   placeholder="Enter address"
                                   className="font-medium text-base"
                                 />
                               ) : (
                                 <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                   {selectedDoctor.address || 'No address'}
                                 </span>
                               )}
                             </div>
                          </div>
                        </div>
                                                 {/* Professional Information */}
                         <div>
                           <h3 className="text-base font-semibold mb-4 text-foreground">Professional Information</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="flex flex-col">
                               <span className="text-xs text-muted-foreground mb-1">Specialty</span>
                               {isEditing ? (
                                 <Select value={editData.specialty || ''} onValueChange={(value) => handleInputChange('specialty', value)}>
                                   <SelectTrigger className="font-medium text-base">
                                     <SelectValue placeholder="Select specialty" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="Cardiology">Cardiology</SelectItem>
                                     <SelectItem value="Dermatology">Dermatology</SelectItem>
                                     <SelectItem value="Emergency Medicine">Emergency Medicine</SelectItem>
                                     <SelectItem value="Family Medicine">Family Medicine</SelectItem>
                                     <SelectItem value="Internal Medicine">Internal Medicine</SelectItem>
                                     <SelectItem value="Neurology">Neurology</SelectItem>
                                     <SelectItem value="Obstetrics and Gynecology">Obstetrics and Gynecology</SelectItem>
                                     <SelectItem value="Oncology">Oncology</SelectItem>
                                     <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                                     <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                                     <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                                     <SelectItem value="Radiology">Radiology</SelectItem>
                                     <SelectItem value="Surgery">Surgery</SelectItem>
                                     <SelectItem value="Urology">Urology</SelectItem>
                                   </SelectContent>
                                 </Select>
                               ) : (
                                 <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                   {selectedDoctor.specialty || 'Not specified'}
                                 </span>
                               )}
                             </div>
                                                         <div className="flex flex-col">
                               <span className="text-xs text-muted-foreground mb-1">PRC ID</span>
                               {isEditing ? (
                                 <Input
                                   value={editData.prcId || ''}
                                   onChange={(e) => handleInputChange('prcId', e.target.value)}
                                   placeholder="Enter PRC ID"
                                   className="font-medium text-base"
                                 />
                               ) : (
                                 <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                   {selectedDoctor.prcId || 'Not specified'}
                                 </span>
                               )}
                             </div>
                                                         <div className="flex flex-col">
                               <span className="text-xs text-muted-foreground mb-1">PRC Expiry</span>
                               {isEditing ? (
                                                                   <Input
                                    type="date"
                                    value={editData.prcExpiryDate ? editData.prcExpiryDate.split('T')[0] : ''}
                                    onChange={(e) => handleInputChange('prcExpiryDate', e.target.value)}
                                    className="font-medium text-base"
                                  />
                                                               ) : (
                                  <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                    {selectedDoctor.prcExpiryDate ? formatDateToText(selectedDoctor.prcExpiryDate) : selectedDoctor.prcExpiry ? formatDateToText(selectedDoctor.prcExpiry) : 'Not specified'}
                                  </span>
                                )}
                             </div>
                                                         <div className="flex flex-col">
                               <span className="text-xs text-muted-foreground mb-1">Medical License</span>
                               {isEditing ? (
                                 <Input
                                   value={editData.medicalLicenseNumber || ''}
                                   onChange={(e) => handleInputChange('medicalLicenseNumber', e.target.value)}
                                   placeholder="Enter medical license number"
                                   className="font-medium text-base"
                                 />
                                                               ) : (
                                  <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                    {selectedDoctor.medicalLicenseNumber || selectedDoctor.medicalLicense || 'Not specified'}
                                  </span>
                                )}
                             </div>
                                                         <div className="flex flex-col">
                               <span className="text-xs text-muted-foreground mb-1">Professional Fee</span>
                               {isEditing ? (
                                 <Input
                                   type="number"
                                   value={editData.professionalFee || 0}
                                   onChange={(e) => handleInputChange('professionalFee', parseFloat(e.target.value) || 0)}
                                   placeholder="Enter professional fee"
                                   className="font-medium text-base"
                                 />
                               ) : (
                                 <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                                   {formatPhilippinePeso(selectedDoctor.professionalFee)}
                                 </span>
                               )}
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
                           doctor={{ ...selectedDoctor, id: selectedDoctor.id?.toString() || '', name: `${selectedDoctor.firstName || ''} ${selectedDoctor.middleName || ''} ${selectedDoctor.lastName || ''}` }}
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
                            <Button onClick={() => setShowVerificationModal(true)} disabled={isSaving || actionLoading}>
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
                {/* <SheetClose asChild>
                  <Button variant="ghost">Close</Button>
                </SheetClose> */}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
      {/* Simple Confirmation Modal */}
      {selectedDoctor && (
        <SimpleConfirmationModal
          isOpen={showVerificationModal}
          onClose={() => {
            setShowVerificationModal(false);
            setPendingStatus("");
          }}
          onConfirm={handleConfirmStatusChange}
          doctor={{
            firstName: selectedDoctor.firstName,
            lastName: selectedDoctor.lastName,
            email: selectedDoctor.email,
            currentStatus: selectedDoctor.status || 'pending',
            newStatus: pendingStatus as 'pending' | 'verified' | 'suspended'
          }}
          isLoading={isSaving || actionLoading}
        />
      )}

      {/* Result Modal */}
      {resultData && (
        <ResultModal
          isOpen={showResultModal}
          onClose={() => {
            setShowResultModal(false);
            setResultData(null);
          }}
          success={resultData.success}
          emailSent={resultData.emailSent}
          emailError={resultData.emailError}
          doctorName={resultData.doctorName}
          newStatus={resultData.newStatus}
        />
      )}

             {/* Bulk Import Dialog */}
       <BulkImportDialog
         open={showBulkImport}
         onOpenChange={setShowBulkImport}
         onSuccess={() => {
           // Refresh the doctors list
           window.location.reload();
         }}
       />

       {/* Save Confirmation Dialog */}
       <ConfirmationDialog
         open={showSaveConfirmation}
         onOpenChange={setShowSaveConfirmation}
         title="Confirm Changes"
         description="Are you sure you want to save these changes to the doctor's information? This action cannot be undone."
         confirmText="Save Changes"
         cancelText="Cancel"
         variant="default"
         onConfirm={handleConfirmSave}
         loading={isSavingEdit}
       />
     </DashboardLayout>
   );
 }
