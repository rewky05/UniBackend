// "use client";

// import { useState, useEffect } from "react";
// import { useParams } from "next/navigation";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";
// import { DoctorSelector } from "@/components/schedules/doctor-selector";
// import { EmptyState } from "@/components/schedules/empty-state";
// import { DoctorInfoBanner } from "@/components/schedules/doctor-info-banner";
// import { ScheduleCard, type SpecialistSchedule } from "@/components/schedules/schedule-card";
// import { ProfessionalFeeStats } from "@/components/doctors/professional-fee-stats";
// import { useRealDoctors, useRealAppointments } from "@/hooks/useRealData";
// import { useScheduleData } from "@/hooks/use-schedule-data";
// import { useDoctorActions } from "@/hooks/useDoctors";
// import { useAuth } from "@/hooks/useAuth";
// import { formatPhilippinePeso, formatDateToText, formatDateTimeToText } from '@/lib/utils';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Accordion,
//   AccordionItem,
//   AccordionTrigger,
//   AccordionContent,
// } from "@/components/ui/accordion";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
// import {
//   User,
//   Mail,
//   Phone,
//   MapPin,
//   Calendar,
//   FileText,
//   Upload,
//   Download,
//   Check,
//   X,
//   Edit,
//   Clock,
//   Building,
//   GraduationCap,
//   Award,
//   Activity,
// } from "lucide-react";

// export default function DoctorDetailPage() {
//   const params = useParams();
//   const doctorId = params.id as string;
//   const { doctors, loading, error } = useRealDoctors();
//   const { appointments, loading: appointmentsLoading } = useRealAppointments();
//   const { updateDoctorStatus, loading: actionLoading, error: actionError } = useDoctorActions();
//   const { user } = useAuth();
//   const [verificationStatus, setVerificationStatus] = useState("");
//   const [verificationNotes, setVerificationNotes] = useState("");
//   const [isSaving, setIsSaving] = useState(false);
//   const [showConfirmDialog, setShowConfirmDialog] = useState(false);
//   const [pendingStatus, setPendingStatus] = useState<string>("");

//   // Use the Firebase-integrated schedule data hook
//   const {
//     schedules,
//     loading: scheduleLoading,
//     error: scheduleError,
//     handleScheduleAdd,
//     handleScheduleEdit,
//     handleScheduleDelete,
//   } = useScheduleData(doctorId);

//   // Find the specific doctor from Firebase data
//   const doctor = doctors.find(d => d.id === doctorId);

//   // Initialize verification status from doctor data
//   useEffect(() => {
//     if (doctor) {
//       setVerificationStatus(doctor.status || 'pending');
//     }
//   }, [doctor]);

//   const handleStatusChange = (newStatus: string) => {
//     setPendingStatus(newStatus);
//   };

//   const handleConfirmStatusChange = async () => {
//     if (!pendingStatus || !user) return;
    
//     setIsSaving(true);
//     try {
//       await updateDoctorStatus(
//         doctorId, 
//         pendingStatus as 'pending' | 'verified' | 'suspended',
//         user.email, // Using email as verifiedBy identifier
//         verificationNotes
//       );
      
//       // Update local state
//       setVerificationStatus(pendingStatus);
//       setShowConfirmDialog(false);
//       setPendingStatus("");
//       setVerificationNotes("");
      
//       // Show success message
//       alert(`Doctor status successfully updated to ${pendingStatus}`);
//     } catch (error) {
//       console.error('Error updating doctor status:', error);
//       alert('Failed to update doctor status. Please try again.');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const getStatusConfirmationMessage = (status: string) => {
//     switch (status) {
//       case 'verified':
//         return 'Are you sure you want to verify this doctor? This will grant them full access to the system and send them a confirmation email.';
//       case 'pending':
//         return 'Are you sure you want to set this doctor status to pending? This will restrict their access until further verification.';
//       case 'suspended':
//         return 'Are you sure you want to suspend this doctor? This will immediately revoke their access to the system.';
//       default:
//         return 'Are you sure you want to change this doctor\'s status?';
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "verified":
//         return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400";
//       case "pending":
//         return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400";
//       case "suspended":
//         return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400";
//       default:
//         return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400";
//     }
//   };

//   const getDocumentStatusColor = (status: string) => {
//     switch (status) {
//       case "verified":
//         return "text-green-600";
//       case "pending":
//         return "text-yellow-600";
//       case "rejected":
//         return "text-red-600";
//       default:
//         return "text-gray-600";
//     }
//   };

//   // Show loading state
//   if (loading || appointmentsLoading) {
//     return (
//       <DashboardLayout title="">
//         <div className="flex items-center justify-center min-h-[400px]">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
//             <p className="text-muted-foreground">Loading doctor details and statistics...</p>
//           </div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   // Show error state
//   if (error) {
//     return (
//       <DashboardLayout title="">
//         <div className="flex items-center justify-center min-h-[400px]">
//           <div className="text-center">
//             <div className="text-red-500 mb-4">⚠️</div>
//             <p className="text-red-600 mb-2">Failed to load doctor details</p>
//             <p className="text-muted-foreground text-sm">{error}</p>
//           </div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   // Show not found state
//   if (!doctor) {
//     return (
//       <DashboardLayout title="">
//         <div className="flex items-center justify-center min-h-[400px]">
//           <div className="text-center">
//             <div className="text-gray-500 mb-4">👤</div>
//             <p className="text-gray-600 mb-2">Doctor not found</p>
//             <p className="text-muted-foreground text-sm">The requested doctor could not be found.</p>
//           </div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   return (
//     <DashboardLayout title={`${doctor.firstName} ${doctor.lastName} - Doctor Details`}>
//       <div className="space-y-6">
//         {/* Header */}
//         <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
//           <div className="flex items-start space-x-4">
//             <Avatar className="h-20 w-20">
//               <AvatarImage src={doctor.profileImageUrl || ""} />
//               <AvatarFallback className="text-lg">
//                 {`${doctor.firstName} ${doctor.lastName}`
//                   .split(" ")
//                   .map((n) => n[0])
//                   .join("")}
//               </AvatarFallback>
//             </Avatar>
//             <div>
//               <h1 className="text-3xl font-bold">{`${doctor.firstName} ${doctor.lastName}`}</h1>
//               <p className="text-lg text-muted-foreground">
//                 {doctor.specialty}
//               </p>
//               <div className="flex items-center space-x-4 mt-2">
//                 <Badge className={getStatusColor(doctor.status || 'pending')}>
//                   {doctor.status === "verified" && (
//                     <Check className="h-3 w-3 mr-1" />
//                   )}
//                   {doctor.status === "pending" && (
//                     <Clock className="h-3 w-3 mr-1" />
//                   )}
//                   {doctor.status === "suspended" && (
//                     <X className="h-3 w-3 mr-1" />
//                   )}
//                   <span className="capitalize">{doctor.status || 'pending'}</span>
//                 </Badge>
//                 <span className="text-sm text-muted-foreground">
//                   Joined {formatDateToText(doctor.createdAt || new Date())}
//                 </span>
//               </div>
//             </div>
//           </div>
//           <div className="flex gap-2">
//             <Button variant="outline">
//               <Edit className="h-4 w-4 mr-2" />
//               Edit Profile
//             </Button>
//             {/* <Button>
//               <FileText className="h-4 w-4 mr-2" />
//               Generate Report
//             </Button> */}
//           </div>
//         </div>

//         {/* Replace Tabs with Accordion */}
//         <Accordion type="single" collapsible defaultValue="overview">
//           {/* Overview Section */}
//           <AccordionItem value="overview">
//             <AccordionTrigger>Overview</AccordionTrigger>
//             <AccordionContent>
//               <div className="grid gap-6 md:grid-cols-2">
//                 {/* Personal Information */}
//                 <Card className="card-shadow">
//                   <CardHeader>
//                     <CardTitle className="flex items-center">
//                       <User className="h-5 w-5 mr-2" />
//                       Personal Information
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-4">
//                     <div className="flex items-center space-x-3">
//                       <Mail className="h-4 w-4 text-muted-foreground" />
//                       <span>{doctor.email || 'No email'}</span>
//                     </div>
//                     <div className="flex items-center space-x-3">
//                       <Phone className="h-4 w-4 text-muted-foreground" />
//                       <span>{doctor.contactNumber}</span>
//                     </div>
//                     <div className="flex items-center space-x-3">
//                       <MapPin className="h-4 w-4 text-muted-foreground" />
//                       <span>{doctor.address || 'No address'}</span>
//                     </div>
//                     <div className="flex items-center space-x-3">
//                       <Calendar className="h-4 w-4 text-muted-foreground" />
//                       <span>
//                         Born {doctor.dateOfBirth ? formatDateToText(doctor.dateOfBirth) : 'Not specified'}
//                       </span>
//                     </div>
//                     <div className="grid grid-cols-2 gap-4 pt-2">
//                       <div>
//                         <p className="text-sm font-medium text-muted-foreground">Gender</p>
//                         <p>{doctor.gender ? doctor.gender.charAt(0).toUpperCase() + doctor.gender.slice(1) : 'Not specified'}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm font-medium text-muted-foreground">Civil Status</p>
//                         <p>{doctor.civilStatus ? doctor.civilStatus.charAt(0).toUpperCase() + doctor.civilStatus.slice(1) : 'Not specified'}</p>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//                 {/* Professional Information */}
//                 <Card className="card-shadow">
//                   <CardHeader>
//                     <CardTitle className="flex items-center">
//                       <Award className="h-5 w-5 mr-2" />
//                       Professional Information
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-4">
//                     <div>
//                       <p className="text-sm font-medium text-muted-foreground">PRC ID</p>
//                       <p>{doctor.prcId || 'Not specified'}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium text-muted-foreground">PRC Expiry</p>
//                       <p>{doctor.prcExpiryDate ? formatDateToText(doctor.prcExpiryDate) : 'Not specified'}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium text-muted-foreground">Medical License</p>
//                       <p>{doctor.medicalLicenseNumber || 'Not specified'}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium text-muted-foreground">Professional Fee</p>
//                       <p>{formatPhilippinePeso(doctor.professionalFee)}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium text-muted-foreground">Last Login</p>
//                       <p>{doctor.lastLogin ? formatDateTimeToText(doctor.lastLogin) : 'Not specified'}</p>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>
              
//               {/* Professional Fee Statistics */}
//               <div className="mt-6">
//                 <ProfessionalFeeStats
//                   doctorId={doctorId}
//                   professionalFee={doctor.professionalFee || 0}
//                   appointments={appointments}
//                 />
//               </div>
//             </AccordionContent>
//           </AccordionItem>
//           {/* Schedules Section */}
//           <AccordionItem value="schedules">
//             <AccordionTrigger>Schedules</AccordionTrigger>
//             <AccordionContent>
//               <Card className="card-shadow">
//                 <CardHeader>
//                   <CardTitle className="flex items-center">
//                     <Calendar className="h-5 w-5 mr-2" />
//                     Schedule Management
//                   </CardTitle>
//                   <CardDescription>Manage doctor&apos;s availability and clinic schedules</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <DoctorInfoBanner doctor={{ ...doctor, id: doctor.id?.toString() || '', name: `${doctor.firstName} ${doctor.lastName}` }} />
//                   {scheduleError && (
//                     <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
//                       <p className="text-red-600 text-sm">{scheduleError}</p>
//                     </div>
//                   )}
//                   <div className="space-y-6">
//                     <ScheduleCard
//                       schedules={schedules}
//                       onScheduleAdd={handleScheduleAdd}
//                       onScheduleEdit={handleScheduleEdit}
//                       onScheduleDelete={handleScheduleDelete}
//                       specialistId={doctorId}
//                     />
//                   </div>
//                 </CardContent>
//               </Card>
//             </AccordionContent>
//           </AccordionItem>
//           {/* Verification Section */}
//           <AccordionItem value="verification">
//             <AccordionTrigger>Verification</AccordionTrigger>
//             <AccordionContent>
//               <Card className="card-shadow">
//                 <CardHeader>
//                   <CardTitle className="flex items-center">
//                     <Check className="h-5 w-5 mr-2" />
//                     Verification Control
//                   </CardTitle>
//                   <CardDescription>Manage doctor verification status and add admin notes</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                   <div className="grid gap-4 md:grid-cols-2">
//                     <div className="space-y-2">
//                       <Label htmlFor="status">Current Status</Label>
//                       <div className="p-3 border rounded-lg bg-muted/50">
//                         <Badge className={getStatusColor(verificationStatus)}>
//                           {verificationStatus === "verified" && <Check className="h-3 w-3 mr-1" />}
//                           {verificationStatus === "pending" && <Clock className="h-3 w-3 mr-1" />}
//                           {verificationStatus === "suspended" && <X className="h-3 w-3 mr-1" />}
//                           <span className="capitalize">{verificationStatus || 'pending'}</span>
//                         </Badge>
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="newStatus">Change Status To</Label>
//                       <Select value={pendingStatus} onValueChange={handleStatusChange}>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select new status" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="pending">Pending Review</SelectItem>
//                           <SelectItem value="verified">Verified</SelectItem>
//                           <SelectItem value="suspended">Suspended</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="notes">Verification Notes</Label>
//                     <Textarea
//                       id="notes"
//                       placeholder="Add notes about the verification process..."
//                       value={verificationNotes}
//                       onChange={(e) => setVerificationNotes(e.target.value)}
//                       rows={3}
//                     />
//                   </div>
//                   {actionError && (
//                     <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                       <p className="text-red-600 text-sm">{actionError}</p>
//                     </div>
//                   )}
//                   {pendingStatus && (
//                     <div className="flex justify-end">
//                       <Button onClick={() => setShowConfirmDialog(true)} disabled={isSaving || actionLoading}>
//                         {isSaving || actionLoading ? "Updating..." : "Update Status"}
//                       </Button>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </AccordionContent>
//           </AccordionItem>
//         </Accordion>
//        </div>

//                {/* Confirmation Dialog */}
//         <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
//           <AlertDialogContent>
//             <AlertDialogHeader>
//               <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
//               <AlertDialogDescription>
//                 {getStatusConfirmationMessage(pendingStatus)}
//                 {verificationNotes && (
//                   <div className="mt-3 p-3 bg-muted rounded-md">
//                     <p className="text-sm font-medium mb-1">Verification Notes:</p>
//                     <p className="text-sm text-muted-foreground">{verificationNotes}</p>
//                   </div>
//                 )}
//               </AlertDialogDescription>
//             </AlertDialogHeader>
//             <AlertDialogFooter>
//               <AlertDialogCancel onClick={() => {
//                 setShowConfirmDialog(false);
//                 setPendingStatus("");
//               }}>
//                 Cancel
//               </AlertDialogCancel>
//               <AlertDialogAction 
//                 onClick={handleConfirmStatusChange}
//                 disabled={isSaving || actionLoading}
//                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//               >
//                 {isSaving || actionLoading ? "Updating..." : "Confirm Change"}
//               </AlertDialogAction>
//             </AlertDialogFooter>
//           </AlertDialogContent>
//         </AlertDialog>
//      </DashboardLayout>
//    );
//  }
