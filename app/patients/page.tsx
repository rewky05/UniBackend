"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useNavigationLoading } from "@/hooks/useNavigationLoading";
import { formatDateToText, safeGetTimestamp } from "@/lib/utils";
import { RealDataService } from "@/lib/services/real-data.service";
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
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  UserCheck,
  UserX,
  Loader2,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { ReportActions } from "@/components/ui/report-actions";
import { Pagination } from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

// Utility function for flexible address resolution
function getFlexibleAddress(patient: Patient): string {
  // Priority 1: Use addressLine if available
  if (patient.addressLine) {
    return patient.addressLine;
  }
  
  // Priority 2: Use address + separate fields if available
  if (patient.address) {
    const parts = [patient.address];
    if (patient.city) parts.push(patient.city);
    if (patient.province) parts.push(patient.province);
    if (patient.zipCode) parts.push(patient.zipCode);
    return parts.join(', ');
  }
  
  // Priority 3: Use separate fields only
  if (patient.city || patient.province || patient.zipCode) {
    const parts = [];
    if (patient.city) parts.push(patient.city);
    if (patient.province) parts.push(patient.province);
    if (patient.zipCode) parts.push(patient.zipCode);
    return parts.join(', ');
  }
  
  return "N/A";
}

const statuses = ["All Status"];
const sortOptions = [
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
];

interface Patient {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  contactNumber?: string;
  email?: string;
  isActive?: boolean;
  profileImageUrl?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  address?: string;
  addressLine?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  bloodType?: string;
  allergies?: string[];
  medicalConditions?: string[];
  educationalAttainment?: string;
  createdAt: string;
  lastUpdated: string;
}

export default function PatientsPage() {
  const { toast } = useToast();
  const { navigateWithLoading } = useNavigationLoading({
    loadingMessage: '', // No message for clean navigation
    delay: 1000,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedSort, setSelectedSort] = useState("date-desc");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    contactNumber: string;
    gender: string;
    address: string;
    educationalAttainment: string;
    bloodType: string;
    allergies: string[];
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  }>({
    contactNumber: '',
    gender: '',
    address: '',
    educationalAttainment: '',
    bloodType: '',
    allergies: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });
  const [allergyInput, setAllergyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // Debug effect to monitor editData changes
  useEffect(() => {
    console.log('=== EDIT DATA STATE CHANGE ===');
    console.log('isEditing:', isEditing);
    console.log('editData:', editData);
    console.log('selectedPatient:', selectedPatient);
  }, [editData, isEditing, selectedPatient]);

  // Fetch patients directly from patients node with user data
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        const realDataService = new RealDataService();
        
        // Fetch patients with user data already included
        const patientsData = await realDataService.getPatients();
        
        console.log('=== PATIENT FETCH DEBUG ===');
        console.log('Raw patients data from database:', patientsData);
        console.log('Sample patient raw data:', patientsData[0]);
        
        // Transform to match our Patient interface
        const transformedPatients: Patient[] = patientsData.map(patient => ({
          id: patient.id || '',
          firstName: patient.firstName || '',
          middleName: patient.middleName || '',
          lastName: patient.lastName || '',
          gender: patient.gender || '',
          dateOfBirth: patient.dateOfBirth || '',
          contactNumber: patient.contactNumber || '',
          email: patient.email || '',
          isActive: true, // Default to true for patients
          profileImageUrl: patient.profileImageUrl || '',
          emergencyContact: patient.emergencyContact,
          address: patient.address || '',
          addressLine: patient.addressLine || '',
          city: patient.city || '',
          province: patient.province || '',
          zipCode: patient.zipCode || '',
          bloodType: patient.bloodType || '',
          allergies: patient.allergies || [],
          medicalConditions: patient.medicalConditions || [],
          educationalAttainment: patient.highestEducationalAttainment || '',
          createdAt: patient.createdAt || '',
          lastUpdated: patient.lastUpdated || ''
        }));
        
        console.log('Transformed patients data:', transformedPatients);
        console.log('Sample transformed patient:', transformedPatients[0]);
        setPatients(transformedPatients);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const searchTerm = searchQuery.toLowerCase();
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const email = patient.email?.toLowerCase() || '';
    const address = getFlexibleAddress(patient).toLowerCase();
    
    const matchesSearch =
      fullName.includes(searchTerm) ||
      email.includes(searchTerm) ||
      address.includes(searchTerm);
    const matchesStatus =
      selectedStatus === "All Status" || patient.isActive;
    return matchesSearch && matchesStatus;
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    switch (selectedSort) {
      case 'name-asc':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'name-desc':
        return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
      case 'date-desc':
        return safeGetTimestamp(b.createdAt) - safeGetTimestamp(a.createdAt);
      case 'date-asc':
        return safeGetTimestamp(a.createdAt) - safeGetTimestamp(b.createdAt);
      default:
        return 0;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPatients = sortedPatients.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedSort]);

  // PDF report columns configuration
  const pdfColumns = [
    { key: 'name', label: 'Full Name', render: (patient: Patient) => `${patient.firstName} ${patient.lastName}` },
    { key: 'contactNumber', label: 'Contact Number' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address', render: (patient: Patient) => getFlexibleAddress(patient) },
    { key: 'dateOfBirth', label: 'Date of Birth', render: (patient: Patient) => formatDateToText(patient.dateOfBirth) },
    { key: 'gender', label: 'Gender', render: (patient: Patient) => capitalizeFirstLetter(patient.gender) },
    { key: 'isActive', label: 'Status', render: (patient: Patient) => patient.isActive ? 'Active' : 'Deactivated' },
    { key: 'createdAt', label: 'Date Added', render: (patient: Patient) => formatDateToText(patient.createdAt) },
  ];

  // PDF report filters
  const pdfFilters = [
    { label: 'Search', value: searchQuery || 'None' },
    { label: 'Status', value: selectedStatus },
  ].filter(filter => filter.value !== 'All Status');

  const getStatusColor = (status: boolean) => {
    return status ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400";
  };

  const getStatusIcon = (status: boolean) => {
    return status ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />;
  };

  // Helper function to format educational attainment for display
  const formatEducationalAttainment = (str: string) => {
    if (!str) return str;
    
    // Handle kebab-case values
    const formatMap: Record<string, string> = {
      'elementary': 'Elementary',
      'junior-high-school': 'Junior High School',
      'senior-high-school': 'Senior High School',
      'vocational': 'Vocational',
      'associate-degree': 'Associate Degree',
      'bachelors-degree': 'Bachelor\'s Degree',
      'bachelor\'s degree': 'Bachelor\'s Degree',
      'bachelors degree': 'Bachelor\'s Degree',
      'masters-degree': 'Master\'s Degree',
      'master\'s degree': 'Master\'s Degree',
      'masters degree': 'Master\'s Degree',
      'doctorate': 'Doctorate',
      'post-graduate': 'Post Graduate',
      'post graduate': 'Post Graduate',
      'other': 'Other'
    };
    
    // First check the format map
    const formatted = formatMap[str.toLowerCase()];
    if (formatted) return formatted;
    
    // If not in map, apply proper capitalization
    return str.split(' ').map(word => {
      if (word.toLowerCase() === 'of' || word.toLowerCase() === 'and' || word.toLowerCase() === 'the') {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  };

  // Helper function to capitalize first letter and handle special cases
  const capitalizeFirstLetter = (str: string) => {
    if (!str) return str;
    
    // Handle kebab-case values for gender and relationship
    const formatMap: Record<string, string> = {
      'male': 'Male',
      'female': 'Female',
      'other': 'Other',
      'prefer-not-to-say': 'Prefer not to say',
      'spouse': 'Spouse',
      'parent': 'Parent',
      'sibling': 'Sibling',
      'child': 'Child',
      'grandparent': 'Grandparent',
      'uncle-aunt': 'Uncle/Aunt',
      'cousin': 'Cousin',
      'friend': 'Friend',
      'guardian': 'Guardian'
    };
    
    // First check the format map
    const formatted = formatMap[str.toLowerCase()];
    if (formatted) return formatted;
    
    // If not in map, apply proper capitalization
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Helper function to format blood type and handle "not-known" values
  const formatBloodType = (bloodType: string) => {
    if (!bloodType) return "Not specified";
    
    // Handle "not-known" value
    if (bloodType.toLowerCase() === 'not-known') {
      return "Not known yet";
    }
    
    return bloodType;
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditing(false);
    setIsSheetOpen(true);
  };

  const handleStartEdit = () => {
    if (selectedPatient) {
      // Consolidate any existing address data into a single address field
      const consolidatedAddress = getFlexibleAddress(selectedPatient);
      
      console.log('=== PATIENT EDIT DEBUG ===');
      console.log('Selected Patient Full Data:', selectedPatient);
      console.log('Starting edit with patient data:', {
        gender: selectedPatient.gender,
        educationalAttainment: selectedPatient.educationalAttainment,
        contactNumber: selectedPatient.contactNumber,
        address: selectedPatient.address,
        emergencyContact: selectedPatient.emergencyContact
      });
      
      // Normalize gender value to match dropdown options
      const normalizeGender = (gender: string) => {
        if (!gender) return '';
        const genderLower = gender.toLowerCase();
        if (genderLower === 'male' || genderLower === 'female' || genderLower === 'other') {
          return genderLower;
        }
        if (genderLower === 'prefer not to say' || genderLower === 'prefer-not-to-say') {
          return 'prefer-not-to-say';
        }
        return genderLower;
      };

      // Normalize educational attainment value to match dropdown options
      const normalizeEducation = (education: string) => {
        if (!education) return '';
        const educationLower = education.toLowerCase();
        const educationMap: Record<string, string> = {
          'elementary': 'elementary',
          'junior high school': 'junior-high-school',
          'junior-high-school': 'junior-high-school',
          'senior high school': 'senior-high-school',
          'senior-high-school': 'senior-high-school',
          'vocational': 'vocational',
          'associate degree': 'associate-degree',
          'associate-degree': 'associate-degree',
          'bachelor\'s degree': 'bachelors-degree',
          'bachelors degree': 'bachelors-degree',
          'bachelors-degree': 'bachelors-degree',
          'master\'s degree': 'masters-degree',
          'masters degree': 'masters-degree',
          'masters-degree': 'masters-degree',
          'doctorate': 'doctorate',
          'post graduate': 'post-graduate',
          'post-graduate': 'post-graduate',
          'other': 'other'
        };
        return educationMap[educationLower] || educationLower;
      };

      // Normalize relationship value to match dropdown options
      const normalizeRelationship = (relationship: string) => {
        if (!relationship) return '';
        const relationshipLower = relationship.toLowerCase();
        const relationshipMap: Record<string, string> = {
          'spouse': 'spouse',
          'parent': 'parent',
          'sibling': 'sibling',
          'child': 'child',
          'grandparent': 'grandparent',
          'uncle/aunt': 'uncle-aunt',
          'uncle-aunt': 'uncle-aunt',
          'cousin': 'cousin',
          'friend': 'friend',
          'guardian': 'guardian',
          'other': 'other'
        };
        return relationshipMap[relationshipLower] || relationshipLower;
      };

      const newEditData = {
        contactNumber: selectedPatient.contactNumber || '',
        gender: normalizeGender(selectedPatient.gender || ''),
        address: consolidatedAddress !== "N/A" ? consolidatedAddress : '',
        educationalAttainment: normalizeEducation(selectedPatient.educationalAttainment || ''),
        bloodType: selectedPatient.bloodType || '',
        allergies: selectedPatient.allergies || [],
        emergencyContact: {
          name: selectedPatient.emergencyContact?.name || '',
          phone: selectedPatient.emergencyContact?.phone || '',
          relationship: normalizeRelationship(selectedPatient.emergencyContact?.relationship || '')
        }
      };
      
      console.log('Setting editData to:', newEditData);
      setEditData(newEditData);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      contactNumber: '',
      gender: '',
      address: '',
      educationalAttainment: '',
      bloodType: '',
      allergies: [],
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    });
  };

  const handleSaveEdit = () => {
    if (!selectedPatient) return;
    
    // Show confirmation dialog instead of saving immediately
    setShowSaveConfirmation(true);
  };

  const handleConfirmSave = async () => {
    if (!selectedPatient) return;

    setIsSaving(true);
    try {
      const realDataService = new RealDataService();
      
      // Prepare the update data with only the fields that can be edited
      const updateData = {
        contactNumber: editData.contactNumber,
        gender: editData.gender,
        address: editData.address,
        // Clear old address fields to consolidate into single address field
        addressLine: null,
        city: null,
        province: null,
        zipCode: null,
        highestEducationalAttainment: editData.educationalAttainment,
        bloodType: editData.bloodType,
        allergies: editData.allergies,
        emergencyContact: editData.emergencyContact,
      };

      // Update the patient data
      await realDataService.updatePatient(selectedPatient.id, updateData);

      // Update the local state with the new data
      const updatedPatient = {
        ...selectedPatient,
        contactNumber: editData.contactNumber,
        gender: editData.gender,
        address: editData.address,
        educationalAttainment: editData.educationalAttainment,
        bloodType: editData.bloodType,
        allergies: editData.allergies,
        emergencyContact: editData.emergencyContact,
      };
      setSelectedPatient(updatedPatient);
      setPatients(prevPatients => 
        prevPatients.map(p => 
          p.id === selectedPatient.id ? updatedPatient : p
        )
      );
      
      setIsEditing(false);
      setShowSaveConfirmation(false);
      toast({
        title: "Patient updated successfully",
        description: "The patient information has been updated.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "Error updating patient",
        description: "Failed to update patient information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    console.log('=== INPUT CHANGE DEBUG ===');
    console.log('Field:', field);
    console.log('Value:', value);
    console.log('Current editData before change:', editData);
    
    if (field === 'emergencyContact') {
      setEditData(prev => {
        const newData = {
          ...prev,
          emergencyContact: {
            ...prev.emergencyContact,
            ...value
          }
        };
        console.log('New editData after emergency contact change:', newData);
        return newData;
      });
    } else {
      setEditData(prev => {
        const newData = {
          ...prev,
          [field]: value
        };
        console.log('New editData after field change:', newData);
        return newData;
      });
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      const currentAllergies = editData.allergies || [];
      const newAllergies = [...currentAllergies, allergyInput.trim()];
      setEditData(prev => ({
        ...prev,
        allergies: newAllergies
      }));
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    const currentAllergies = editData.allergies || [];
    const newAllergies = currentAllergies.filter((_, i) => i !== index);
    setEditData(prev => ({
      ...prev,
      allergies: newAllergies
    }));
  };

  if (loading) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading patients...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Patient Management</h2>
            <p className="text-muted-foreground">
              Monitor and manage patients in the healthcare system
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigateWithLoading('/patients/add')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="card-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients by name, email, or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex gap-2">
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
                    setSelectedStatus("All Status");
                    setSelectedSort("date-desc");
                  }}
                  disabled={(searchQuery ?? "") === "" && selectedStatus === "All Status" && selectedSort === "date-desc"}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Patients ({sortedPatients.length})
                </CardTitle>
                <CardDescription className="mt-2">
                  Comprehensive list of patient records and information
                </CardDescription>
              </div>
              <ReportActions
                title="Patients Report"
                subtitle={`${sortedPatients.length} patients found`}
                data={sortedPatients}
                columns={pdfColumns}
                filters={pdfFilters}
                filename={`patients_report_${formatDateToText(new Date().toISOString()).replace(/\s+/g, '_')}.pdf`}
              />
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
                    <TableHead>Address</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="text-muted-foreground text-lg">👥</div>
                          <p className="text-muted-foreground font-medium">No patients found</p>
                          <p className="text-sm text-muted-foreground">
                            {searchQuery || selectedStatus !== "All Status"
                              ? "Try adjusting your search criteria or filters"
                              : "Get started by adding your first patient"}
                          </p>
                          {/* {!searchQuery && selectedStatus === "All Status" && (
                            <Button asChild size="sm" className="mt-2">
                              <Link href="/patients/add">
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Patient
                              </Link>
                            </Button>
                          )} */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPatients.map((patient) => (
                      <TableRow key={patient.id} className="table-row-hover">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={patient.profileImageUrl} />
                              <AvatarFallback>
                                {`${patient.firstName} ${patient.lastName}`
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">
                              {patient.firstName || 'N/A'} {patient.lastName || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {patient.contactNumber || 'No contact number'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {patient.email || 'No email'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-[200px] truncate" title={getFlexibleAddress(patient)}>
                            {getFlexibleAddress(patient)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {patient.dateOfBirth ? formatDateToText(patient.dateOfBirth) : 'Not specified'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(patient.isActive || true)}>
                            {getStatusIcon(patient.isActive || true)}
                            <span className="ml-1 capitalize">
                              {patient.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              handleViewPatient(patient);
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
            {sortedPatients.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedPatients.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            )}
          </CardContent>
        </Card>

        {/* Patient Details Sheet */}
        {selectedPatient && (
          <Sheet open={isSheetOpen} onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) {
              // Reset edit state when sheet closes
              setIsEditing(false);
              setEditData({
                contactNumber: '',
                gender: '',
                address: '',
                educationalAttainment: '',
                bloodType: '',
                allergies: [],
                emergencyContact: {
                  name: '',
                  phone: '',
                  relationship: ''
                }
              });
            }
          }}>
            <SheetContent side="right" className="w-full max-w-md sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl backdrop-blur-md overflow-y-auto">
              <div className="p-6">
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle>{selectedPatient.firstName} {selectedPatient.lastName} - Patient Details</SheetTitle>
                    <div className="flex gap-2">
                      {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={handleStartEdit}>
                          <Edit className="h-4 w-4 mr-2" /> Edit Details
                        </Button>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                          >
                            <X className="h-4 w-4 mr-2" /> Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Save
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <SheetDescription>
                    {isEditing 
                      ? "Edit the patient's information. Only specific fields can be modified."
                      : "Full profile and contact information"
                    }
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col items-center md:items-start gap-6 mt-6">
                  <Avatar className="h-20 w-20 mb-2">
                    <AvatarImage src={selectedPatient.profileImageUrl || ""} />
                    <AvatarFallback className="text-lg">
                      {`${selectedPatient.firstName} ${selectedPatient.lastName}`.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">First Name</span>
                      <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                        {selectedPatient.firstName}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Middle Name</span>
                      <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                        {selectedPatient.middleName || "N/A"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Last Name</span>
                      <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                        {selectedPatient.lastName}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Gender</span>
                      {isEditing ? (
                        <Select 
                          value={editData.gender || ''} 
                          onValueChange={(value) => handleInputChange('gender', value)}
                          onOpenChange={(open) => {
                            if (open) {
                              console.log('=== GENDER DROPDOWN DEBUG ===');
                              console.log('editData.gender:', editData.gender);
                              console.log('selectedPatient.gender:', selectedPatient?.gender);
                              console.log('finalValue:', editData.gender || '');
                              console.log('editData full:', editData);
                              console.log('Available gender options:', ['Male', 'Female', 'Other', 'Prefer not to say']);
                            }
                          }}
                        >
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
                          {selectedPatient.gender ? capitalizeFirstLetter(selectedPatient.gender) : "N/A"}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Date of Birth</span>
                      <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{formatDateToText(selectedPatient.dateOfBirth)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Contact Number</span>
                      {isEditing ? (
                        <Input
                          value={editData.contactNumber || ''}
                          onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                          placeholder="Enter contact number"
                          className="font-medium text-base"
                        />
                      ) : (
                        <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                          {selectedPatient.contactNumber || 'N/A'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <span className="text-xs text-muted-foreground">Email</span>
                      <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedPatient.email}</span>
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <span className="text-xs text-muted-foreground">Address</span>
                      {isEditing ? (
                        <Textarea
                          value={editData.address || ''}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Enter complete address"
                          rows={3}
                          className="font-medium text-base"
                        />
                      ) : (
                        <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                          {getFlexibleAddress(selectedPatient)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <span className="text-xs text-muted-foreground">Educational Attainment</span>
                      {isEditing ? (
                        <Select
                          value={editData.educationalAttainment || ''}
                          onValueChange={(value) => handleInputChange('educationalAttainment', value)}
                          onOpenChange={(open) => {
                            if (open) {
                              console.log('=== EDUCATIONAL DROPDOWN DEBUG ===');
                              console.log('editData.educationalAttainment:', editData.educationalAttainment);
                              console.log('selectedPatient.educationalAttainment:', selectedPatient?.educationalAttainment);
                              console.log('finalValue:', editData.educationalAttainment || '');
                              console.log('editData full:', editData);
                            }
                          }}
                        >
                          <SelectTrigger className="font-medium text-base">
                            <SelectValue placeholder="Select educational attainment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="elementary">Elementary</SelectItem>
                            <SelectItem value="junior-high-school">Junior High School</SelectItem>
                            <SelectItem value="senior-high-school">Senior High School</SelectItem>
                            <SelectItem value="vocational">Vocational</SelectItem>
                            <SelectItem value="associate-degree">Associate Degree</SelectItem>
                            <SelectItem value="bachelors-degree">Bachelor's Degree</SelectItem>
                            <SelectItem value="masters-degree">Master's Degree</SelectItem>
                            <SelectItem value="doctorate">Doctorate</SelectItem>
                            <SelectItem value="post-graduate">Post Graduate</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                          {selectedPatient.educationalAttainment ? formatEducationalAttainment(selectedPatient.educationalAttainment) : "N/A"}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Blood Type and Allergies */}
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold mb-2">Medical Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Blood Type</span>
                        {isEditing ? (
                          <Select
                            value={editData.bloodType || ''}
                            onValueChange={(value) => handleInputChange('bloodType', value)}
                          >
                            <SelectTrigger className="font-medium text-base">
                              <SelectValue placeholder="Select blood type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                              <SelectItem value="not-known">Not known yet</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                            {formatBloodType(selectedPatient?.bloodType || 'Not specified')}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Allergies</span>
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Enter allergy (e.g., Penicillin, Peanuts)"
                                value={allergyInput || ''}
                                onChange={(e) => setAllergyInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && allergyInput.trim()) {
                                    e.preventDefault();
                                    addAllergy();
                                  }
                                }}
                                className="font-medium text-base"
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={addAllergy}
                                disabled={!allergyInput?.trim()}
                                className="shrink-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            {editData.allergies && editData.allergies.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {editData.allergies.map((allergy, index) => (
                                  <Badge key={index} variant="secondary" className="gap-1">
                                    {allergy}
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeAllergy(index)}
                                      className="h-auto p-0 hover:bg-transparent"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="font-medium text-base border rounded px-3 py-2 bg-muted/30 min-h-[42px] flex items-center">
                            {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {selectedPatient.allergies.map((allergy, index) => (
                                  <Badge key={index} variant="secondary">
                                    {allergy}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              "No allergies recorded"
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold mb-2">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Name</span>
                        {isEditing ? (
                          <Input
                            value={editData.emergencyContact.name || ''}
                            onChange={(e) => handleInputChange('emergencyContact', { name: e.target.value })}
                            placeholder="Enter emergency contact name"
                            className="font-medium text-base"
                          />
                        ) : (
                          <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                            {selectedPatient.emergencyContact?.name || "N/A"}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Relationship</span>
                        {isEditing ? (
                          <Select
                            value={editData.emergencyContact.relationship || ''}
                            onValueChange={(value) => handleInputChange('emergencyContact', { relationship: value })}
                            onOpenChange={(open) => {
                              if (open) {
                                console.log('=== RELATIONSHIP DROPDOWN DEBUG ===');
                                console.log('editData.emergencyContact.relationship:', editData.emergencyContact?.relationship);
                                console.log('selectedPatient.emergencyContact.relationship:', selectedPatient?.emergencyContact?.relationship);
                                console.log('finalValue:', editData.emergencyContact?.relationship || '');
                              }
                            }}
                          >
                            <SelectTrigger className="font-medium text-base">
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spouse">Spouse</SelectItem>
                              <SelectItem value="parent">Parent</SelectItem>
                              <SelectItem value="sibling">Sibling</SelectItem>
                              <SelectItem value="child">Child</SelectItem>
                              <SelectItem value="grandparent">Grandparent</SelectItem>
                              <SelectItem value="uncle-aunt">Uncle/Aunt</SelectItem>
                              <SelectItem value="cousin">Cousin</SelectItem>
                              <SelectItem value="friend">Friend</SelectItem>
                              <SelectItem value="guardian">Guardian</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                            {selectedPatient.emergencyContact?.relationship ? capitalizeFirstLetter(selectedPatient.emergencyContact.relationship) : "N/A"}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Contact Number</span>
                        {isEditing ? (
                          <Input
                            value={editData.emergencyContact.phone || ''}
                            onChange={(e) => handleInputChange('emergencyContact', { phone: e.target.value })}
                            placeholder="Enter emergency contact number"
                            className="font-medium text-base"
                          />
                        ) : (
                          <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                            {selectedPatient.emergencyContact?.phone || "N/A"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-8">
                  <Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Deactivate Account</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Save Confirmation Dialog */}
        <ConfirmationDialog
          open={showSaveConfirmation}
          onOpenChange={setShowSaveConfirmation}
          title="Confirm Patient Update"
          description={`Are you sure you want to save the changes for ${selectedPatient?.firstName} ${selectedPatient?.lastName}? This action cannot be undone.`}
          confirmText="Save Changes"
          cancelText="Cancel"
          variant="default"
          onConfirm={handleConfirmSave}
          loading={isSaving}
        />
      </div>
    </DashboardLayout>
  );
} 