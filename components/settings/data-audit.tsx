'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Database, Download, Shield, Clock, AlertTriangle, CheckCircle, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface DataAuditProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export function DataAudit({ onUnsavedChanges }: DataAuditProps) {
  const { toast } = useToast();
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup] = useState('2024-01-20T02:30:00');
  const [backupStatus] = useState('completed');

  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Backup completed",
        description: "System data has been backed up successfully.",
        variant: "default",
      });
      
      setIsBackupDialogOpen(false);
    } catch (error) {
      toast({
        title: "Backup failed",
        description: "There was an error during the backup process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const getBackupStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400';
    }
  };

  const getBackupStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Retention Policy */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Data Retention Policy
          </CardTitle>
          <CardDescription>
            Current data retention and privacy policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Patient Medical Records:</strong> Retained for 10 years after last patient activity as per Philippine medical record retention requirements.
            </AlertDescription>
          </Alert>
          
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Administrative Logs:</strong> System activity logs are retained for 2 years for audit and compliance purposes.
            </AlertDescription>
          </Alert>
          
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>User Account Data:</strong> Admin user accounts and associated data are retained for 5 years after account deactivation.
            </AlertDescription>
          </Alert>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              All data retention policies comply with Philippine Data Privacy Act (DPA) and healthcare regulations. 
              Data is automatically purged according to these schedules unless legal holds are in place.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Recovery */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Backup & Recovery
          </CardTitle>
          <CardDescription>
            System backup management and data recovery options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Backup Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">Last Backup Status</h4>
                <Badge className={getBackupStatusColor(backupStatus)}>
                  {getBackupStatusIcon(backupStatus)}
                  <span className="ml-1 capitalize">{backupStatus}</span>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Last backup completed: {new Date(lastBackup).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Backup Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Manual Backup</h4>
                <p className="text-sm text-muted-foreground">
                  Trigger an immediate backup of all system data
                </p>
              </div>
              <Button 
                onClick={() => setIsBackupDialogOpen(true)}
                disabled={isBackingUp}
              >
                <Download className="h-4 w-4 mr-2" />
                Trigger Backup
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Automated Backups</h4>
                <p className="text-sm text-muted-foreground">
                  Daily automated backups at 2:00 AM (Asia/Manila)
                </p>
              </div>
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Backup Retention</h4>
                <p className="text-sm text-muted-foreground">
                  Backups are retained for 90 days with daily, weekly, and monthly snapshots
                </p>
              </div>
              <Badge variant="outline">
                90 Days
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Logs */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            System Logs & Audit Trail
          </CardTitle>
          <CardDescription>
            Access comprehensive system activity logs and audit trails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Administrative Activity</h4>
                <p className="text-sm text-muted-foreground">
                  View all admin user actions and system changes
                </p>
              </div>
              <Link href="/activity-logs">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  View Logs
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">System Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor system health and performance metrics
                </p>
              </div>
              <Button variant="outline" disabled>
                <FileText className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Security Events</h4>
                <p className="text-sm text-muted-foreground">
                  Track login attempts and security-related events
                </p>
              </div>
              <Button variant="outline" disabled>
                <Shield className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Data Export</h4>
                <p className="text-sm text-muted-foreground">
                  Export system data for compliance and reporting
                </p>
              </div>
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> All system activities are logged and monitored for security and compliance purposes. 
              Logs are encrypted and stored securely according to data protection regulations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Backup Confirmation Dialog */}
      <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm System Backup</DialogTitle>
            <DialogDescription>
              This will create a complete backup of all system data. The process may take several minutes to complete.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                The backup will include all patient records, doctor profiles, clinic data, and system configurations. 
                This operation will not affect system availability.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsBackupDialogOpen(false)}
              disabled={isBackingUp}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleTriggerBackup}
              disabled={isBackingUp}
              className="min-w-32"
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Backing up...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Start Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}