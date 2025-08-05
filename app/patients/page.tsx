"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatDateToText } from "@/lib/utils";
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

const statuses = ["All Status", "Active", "Inactive", "Discharged"];
const sortOptions = [
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'status-asc', label: 'Status A-Z' },
  { value: 'status-desc', label: 'Status Z-A' },
];

// Static patient data for now
const patients = [
  {
    id: "1",
    firstName: "Juan",
    middleName: "Miguel",
    lastName: "Dela Cruz",
    gender: "Male",
    dateOfBirth: "1990-01-01",
    contactNumber: "09171234567",
    email: "juan.delacruz@email.com",
    status: "active",
    profileImageUrl: "",
  },
  {
    id: "2",
    firstName: "Maria",
    middleName: "",
    lastName: "Santos",
    gender: "Female",
    dateOfBirth: "1985-05-10",
    contactNumber: "09181234567",
    email: "maria.santos@email.com",
    status: "discharged",
    profileImageUrl: "",
  },
  {
    id: "3",
    firstName: "Pedro",
    middleName: "Antonio",
    lastName: "Reyes",
    gender: "Male",
    dateOfBirth: "1992-09-20",
    contactNumber: "09191234567",
    email: "pedro.reyes@email.com",
    status: "inactive",
    profileImageUrl: "",
  },
];

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedSort, setSelectedSort] = useState("date-desc");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.email && patient.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      selectedStatus === "All Status" || patient.status === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    switch (selectedSort) {
      case 'name-asc':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'name-desc':
        return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
      case 'date-desc':
        return new Date(b.dateOfBirth || 0).getTime() - new Date(a.dateOfBirth || 0).getTime();
      case 'date-asc':
        return new Date(a.dateOfBirth || 0).getTime() - new Date(b.dateOfBirth || 0).getTime();
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
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400";
      case "discharged":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <UserCheck className="h-3 w-3" />;
      case "inactive":
        return <UserX className="h-3 w-3" />;
      case "discharged":
        return <Calendar className="h-3 w-3" />;
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

        {/* Patients Table */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Patients ({filteredPatients.length})
            </CardTitle>
            <CardDescription>
              Comprehensive list of patients in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="text-muted-foreground text-lg">  </div>
                          <p className="text-muted-foreground font-medium">No patients found</p>
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your search criteria or filters
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedPatients.map((patient) => (
                      <TableRow key={patient.id} className="table-row-hover">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={patient.profileImageUrl || ""} />
                              <AvatarFallback>
                                {`${patient.firstName} ${patient.lastName}`
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                                                             <div className="font-medium">
                                 {patient.firstName} {patient.lastName}
                               </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{patient.gender}</TableCell>
                                                 <TableCell>{formatDateToText(patient.dateOfBirth)}</TableCell>
                        <TableCell>{patient.contactNumber}</TableCell>
                        <TableCell>{patient.email}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(patient.status || 'inactive')}>
                            {getStatusIcon(patient.status || 'inactive')}
                            <span className="ml-1 capitalize">
                              {patient.status}
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
                                  setSelectedPatient(patient);
                                  setIsSheetOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href="#">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Deactivate Account
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
      </div>
      {/* Sheet for patient details */}
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
                <Badge className={getStatusColor(selectedPatient.status || 'inactive')}>
                  {getStatusIcon(selectedPatient.status || 'inactive')}
                  <span className="ml-1 capitalize">{selectedPatient.status}</span>
                </Badge>
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
                    <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">{selectedPatient.gender}</span>
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
                    <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">123 Main St, Manila, Philippines</span>
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-2">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Name</span>
                      <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">Maria Dela Cruz</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Relationship</span>
                      <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">Mother</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Contact Number</span>
                      <span className="font-medium text-base border rounded px-3 py-2 bg-muted/30">09181234567</span>
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
    </DashboardLayout>
  );
} 