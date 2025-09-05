'use client';

import { useRealHealthcareData } from '@/hooks/useRealData';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatDateToText } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

export default function RealDataDemo() {
  const { 
    doctors, 
    clinics, 
    feedback, 
    dashboardData, 
    recentActivity, 
    appointments,
    patients,
    referrals,
    users,
    loading, 
    error 
  } = useRealHealthcareData();

  if (loading) {
    return (
      <DashboardLayout title="Your Real Data Demo">
        <LoadingSpinner size="lg" text="Loading your real Firebase data..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Your Real Data Demo">
        <ErrorMessage error={error} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="🎉 Your Real Firebase Data (Specialists Only)">
      <div className="space-y-6">
        {/* Dashboard Stats */}
        {dashboardData && (
          <Card>
            <CardHeader>
              <CardTitle>📊 Real-time Dashboard Statistics (Specialists)</CardTitle>
              <CardDescription>Calculated from your actual Firebase data - specialists only</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.totalDoctors}</div>
                  <div className="text-sm text-muted-foreground">Total Specialists</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{dashboardData.verifiedDoctors}</div>
                  <div className="text-sm text-muted-foreground">Verified Specialists</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{dashboardData.totalClinics}</div>
                  <div className="text-sm text-muted-foreground">Total Clinics</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{dashboardData.averageRating.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Avg Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Doctors */}
          <Card>
            <CardHeader>
              <CardTitle>��‍⚕️ Your Specialist Doctors ({doctors.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{doctor.firstName} {doctor.lastName}</div>
                      <div className="text-sm text-muted-foreground">{doctor.specialty}</div>
                      {doctor.email && (
                        <div className="text-xs text-muted-foreground">{doctor.email}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant={doctor.status === 'verified' ? 'default' : 'secondary'}>
                        {doctor.status || 'Active'}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        Specialist
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Clinics */}
          <Card>
            <CardHeader>
              <CardTitle>🏥 Your Clinics ({clinics.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {clinics.map((clinic) => (
                  <div key={clinic.id} className="p-3 border rounded">
                    <div className="font-medium">{clinic.name}</div>
                    <div className="text-sm text-muted-foreground">{clinic.resolvedAddress || clinic.addressLine || 'Address not available'}</div>
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="outline">{clinic.type}</Badge>
                      <Badge variant={clinic.isActive ? 'default' : 'secondary'}>
                        {clinic.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>💬 Patient Feedback ({feedback.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedback.map((fb) => (
                <div key={fb.id} className="p-4 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{fb.patientFirstName} {fb.patientLastName}</div>
                      <div className="text-sm text-muted-foreground">
                        for {fb.doctorFirstName} {fb.doctorLastName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < (fb.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <Badge variant={fb.sentiment === 'positive' ? 'default' : 'secondary'}>
                        {fb.sentiment}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm">{fb.comments}</p>
                  <div className="text-xs text-muted-foreground mt-2">
                    {fb.clinicName} • {formatDateToText(fb.timestamp || new Date())}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ Recent Activity ({recentActivity.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 border rounded">
                  <Badge variant="outline">{activity.type}</Badge>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.action}</div>
                    <div className="text-xs text-muted-foreground">{activity.user}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold">{appointments.length}</div>
                <div className="text-sm text-muted-foreground">Appointments</div>
              </div>
              <div>
                <div className="text-lg font-bold">{patients.length}</div>
                <div className="text-sm text-muted-foreground">Patients</div>
              </div>
              <div>
                <div className="text-lg font-bold">{referrals.length}</div>
                <div className="text-sm text-muted-foreground">Referrals</div>
              </div>
              <div>
                <div className="text-lg font-bold">{users.length}</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}