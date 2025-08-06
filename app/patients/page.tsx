"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatDateToText } from "@/lib/utils";
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
  bloodType?: string;
  allergies?: string[];
  medicalConditions?: string[];
  educationalAttainment?: string;
  createdAt: string;
  lastUpdated: string;
}

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedSort, setSelectedSort] = useState("date-desc");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch patients from both Firebase nodes
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        const realDataService = new RealDataService();
        
        // Fetch from both nodes
        const [usersSnapshot, patientsSnapshot] = await Promise.all([
          realDataService.getUsers(),
          realDataService.getPatients()
        ]);

        // Filter only patient users
        const patientUsers = usersSnapshot.filter(user => user.role === 'patient');
        
        // Combine data from both nodes
        const combinedPatients: Patient[] = patientUsers.map(user => {
          // Find corresponding patient data
          const patientData = patientsSnapshot.find(p => p.id === user.id);
          
          return {
            id: user.id || '',
            firstName: user.firstName || '',
            middleName: patientData?.middleName || '',
            lastName: user.lastName || '',
            gender: patientData?.gender || '',
            dateOfBirth: patientData?.dateOfBirth || '',
            contactNumber: user.contactNumber || '',
            email: user.email || '',
            isActive: patientData?.isActive || true, // Default to true for patients
            profileImageUrl: '',
            emergencyContact: patientData?.emergencyContact,
            address: patientData?.address || '',
            bloodType: patientData?.bloodType || '',
            allergies: patientData?.allergies || [],
            medicalConditions: patientData?.medicalConditions || [],
            educationalAttainment: patientData?.educationalAttainment || '',
            createdAt: user.createdAt || '',
            lastUpdated: patientData?.lastUpdated || user.createdAt || ''
          };
        });
        
        setPatients(combinedPatients);
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
    const matchesSearch =
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.email && patient.email.toLowerCase().includes(searchQuery.toLowerCase()));
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
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'date-asc':
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      default:
        return 0;
    }
  });

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
      'masters-degree': 'Master\'s Degree',
      'doctorate': 'Doctorate',
      'post-graduate': 'Post Graduate',
      'other': 'Other'
    };
    
    return formatMap[str] || str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsSheetOpen(true);
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
            <Button asChild>
              <Link href="/patients/add">
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Link>
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
                    placeholder="Search patients by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {/* <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select> */}
                <Select value={selectedSort} onValueChange={setSelectedSort}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
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

        {/* Patients Table */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patients ({sortedPatients.length})
            </CardTitle>
            <CardDescription>
              Manage patient information and records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedPatients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No patients found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedStatus !== "All Status"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by adding your first patient."}
                </p>
                {!searchQuery && selectedStatus === "All Status" && (
                  <Button asChild>
                    <Link href="/patients/add">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Patient
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Contact Number</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={patient.profileImageUrl} />
                              <AvatarFallback>
                                {patient.firstName?.charAt(0) || ''}{patient.lastName?.charAt(0) || ''}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {patient.firstName || 'N/A'} {patient.lastName || 'N/A'}
                              </div>
                              {!patient.isActive && (
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400">
                                  Deactivated
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{patient.email || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{patient.contactNumber || 'N/A'}</div>
                        </TableCell>
                        <TableCell>
                          {patient.dateOfBirth ? formatDateToText(patient.dateOfBirth) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewPatient(patient)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewPatient(patient)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Deactivate Account
                              </DropdownMenuItem>
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

        {/* Patient Details Sheet */}
        {selectedPatient && (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent side="right" className="w-full max-w-md sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl backdrop-blur-md overflow-y-auto">
              <div className="p-6">
                <SheetHeader>
                  <SheetTitle>{selectedPatient.firstName} {selectedPatient.lastName} - Patient Details</SheetTitle>
                  <SheetDescription>Full profile and contact information</SheetDescription>
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
                      <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedPatient.gender ? capitalizeFirstLetter(selectedPatient.gender) : "N/A"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Date of Birth</span>
                      <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{formatDateToText(selectedPatient.dateOfBirth)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Contact Number</span>
                      <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedPatient.contactNumber}</span>
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <span className="text-xs text-muted-foreground">Email</span>
                      <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedPatient.email}</span>
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <span className="text-xs text-muted-foreground">Address</span>
                      <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedPatient.address || "N/A"}</span>
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <span className="text-xs text-muted-foreground">Educational Attainment</span>
                      <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedPatient.educationalAttainment ? formatEducationalAttainment(selectedPatient.educationalAttainment) : "N/A"}</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold mb-2">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Name</span>
                        <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                          {selectedPatient.emergencyContact?.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Relationship</span>
                        <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                          {selectedPatient.emergencyContact?.relationship ? capitalizeFirstLetter(selectedPatient.emergencyContact.relationship) : "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Contact Number</span>
                        <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">
                          {selectedPatient.emergencyContact?.phone || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-8">
                  <Button variant="outline"><Edit className="h-4 w-4 mr-2" /> Edit Details</Button>
                  <Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Deactivate Account</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </DashboardLayout>
  );
} 