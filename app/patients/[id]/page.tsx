'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Save, X, User, Phone, Mail, MapPin, Calendar, GraduationCap, Heart } from 'lucide-react';
import { RealDataService } from '@/lib/services/real-data.service';
import { useToast } from '@/hooks/use-toast';
import { PersonalInfoForm } from '@/components/patients/personal-info-form';
import { Patient } from '@/lib/types/database';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);

  const patientId = params.id as string;

  useEffect(() => {
    const fetchPatient = async () => {
      console.log('🔄 Fetching patient data for ID:', patientId);
      try {
        const realDataService = new RealDataService();
        const patients = await realDataService.getPatients();
        console.log('📋 All patients:', patients);
        
        const patientData = patients.find(p => p.id === patientId);
        console.log('📋 Found patient data:', patientData);
        
        if (!patientData) {
          throw new Error('Patient not found');
        }
        
        console.log('✅ Setting patient and editData:', patientData);
        setPatient(patientData);
        setEditData(patientData);
      } catch (error) {
        console.error('❌ Error fetching patient:', error);
        toast({
          title: "Error",
          description: "Failed to load patient details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatient();
    }
  }, [patientId, toast]);

  // Debug editData changes
  useEffect(() => {
    console.log('🔄 editData changed:', editData);
  }, [editData]);

  const handleEdit = () => {
    console.log('🔍 Edit button clicked');
    console.log('📋 Current patient data:', patient);
    console.log('📋 Patient type:', typeof patient);
    console.log('📋 Patient keys:', patient ? Object.keys(patient) : 'No patient data');
    
    if (!patient) {
      console.log('❌ No patient data to edit');
      return;
    }
    
    setIsEditing(true);
    setEditData(patient);
    
    console.log('✅ Edit mode enabled, editData will be set to:', patient);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(patient);
  };

  const handleSave = async () => {
    console.log('💾 Save button clicked');
    console.log('📋 Edit data to save:', editData);
    
    if (!editData) {
      console.log('❌ No edit data to save');
      return;
    }

    setSaving(true);
    try {
      console.log('🔄 Starting save process...');
      const realDataService = new RealDataService();
      await realDataService.updatePatient(patientId, editData);
      
      console.log('✅ Patient updated successfully');
      setPatient(editData);
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Patient information updated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('❌ Error updating patient:', error);
      toast({
        title: "Error",
        description: "Failed to update patient information.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formatEducationalAttainment = (education: string) => {
    const educationMap: { [key: string]: string } = {
      'elementary': 'Elementary',
      'high-school': 'High School',
      'vocational': 'Vocational',
      'bachelors-degree': "Bachelor's Degree",
      'masters-degree': "Master's Degree",
      'doctorate': 'Doctorate',
      'post-graduate': 'Post Graduate'
    };
    return educationMap[education] || education;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading patient details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Patient Not Found</h1>
          <p className="text-gray-600 mb-4">The patient you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/patients')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.firstName} {patient.middleName} {patient.lastName}
            </h1>
            <p className="text-gray-600">Patient ID: {patient.id}</p>
          </div>
        </div>
        
        {!isEditing ? (
          <Button onClick={handleEdit} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Patient
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

             {isEditing ? (
         /* Edit Mode */
         <div className="space-y-6">
           {console.log('🎯 Rendering edit mode, editData:', editData)}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update patient's personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PersonalInfoForm
                data={editData}
                onChange={(data) => {
                  console.log('📝 Form data changed:', data);
                  console.log('📝 Current editData:', editData);
                  const newEditData = { ...editData, ...data };
                  console.log('📝 New editData:', newEditData);
                  setEditData(newEditData);
                }}
                disabled={saving}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        /* View Mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="text-sm">{patient.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Middle Name</label>
                  <p className="text-sm">{patient.middleName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-sm">{patient.lastName}</p>
                </div>
                                 <div>
                   <label className="text-sm font-medium text-gray-500">User ID</label>
                   <p className="text-sm">{patient.userId}</p>
                 </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                                 <div className="flex items-center gap-2">
                   <Calendar className="h-4 w-4 text-gray-400" />
                   <span className="text-sm">{patient.dateOfBirth}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <MapPin className="h-4 w-4 text-gray-400" />
                   <span className="text-sm">{patient.address || 'Not provided'}</span>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Demographics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Demographics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                                 <div>
                   <label className="text-sm font-medium text-gray-500">Gender</label>
                   <p className="text-sm">{capitalizeFirstLetter(patient.gender)}</p>
                 </div>
                 <div className="col-span-2">
                   <label className="text-sm font-medium text-gray-500">Address</label>
                   <p className="text-sm">{patient.address || 'Not provided'}</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm">{patient.emergencyContact.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Relationship</label>
                  <p className="text-sm">{capitalizeFirstLetter(patient.emergencyContact.relationship)}</p>
                </div>
                                 <div>
                   <label className="text-sm font-medium text-gray-500">Contact Number</label>
                   <p className="text-sm">{patient.emergencyContact.phone}</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm">{new Date(patient.createdAt).toLocaleDateString()}</p>
                </div>
                                 <div>
                   <label className="text-sm font-medium text-gray-500">Last Updated</label>
                   <p className="text-sm">{new Date(patient.lastUpdated).toLocaleDateString()}</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 