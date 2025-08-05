'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Unlock, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { securityService } from '@/lib/services/security.service';
import type { SecurityRecord } from '@/lib/services/security.service';
import { getRemainingLockoutTime, isAccountLocked } from '@/lib/config/security';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

export function SecurityManagement() {
  const [securityRecords, setSecurityRecords] = useState<SecurityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Confirmation dialog states
  const [resetLockoutDialog, setResetLockoutDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [cleanupDialog, setCleanupDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadSecurityRecords = async () => {
    try {
      setLoading(true);
      const records = await securityService.getAllSecurityRecords();
      setSecurityRecords(records);
    } catch (error) {
      setError('Failed to load security records');
      console.error('Error loading security records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSecurityRecords();
    setRefreshing(false);
  };

  useEffect(() => {
    loadSecurityRecords();
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatRemainingTime = (lockoutUntil: number | null) => {
    if (!lockoutUntil) return 'Not locked';
    
    const remaining = getRemainingLockoutTime(lockoutUntil);
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.ceil(remaining / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  const getLockoutStatus = (record: SecurityRecord) => {
    const locked = isAccountLocked(record.lockoutUntil);
    const remaining = formatRemainingTime(record.lockoutUntil);
    
    if (locked) {
      return (
        <Badge variant="destructive">
          <Lock className="h-3 w-3 mr-1" />
          Locked ({remaining})
        </Badge>
      );
    }
    
    if (record.failedLoginAttempts > 0) {
      return (
        <Badge variant="secondary">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {record.failedLoginAttempts} failed attempts
        </Badge>
      );
    }
    
    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <Unlock className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading security records...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Security Management
              </CardTitle>
              <CardDescription>
                Monitor and manage account lockouts and failed login attempts
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCleanupDialog(true)}
                disabled={refreshing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Cleanup Expired
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Security Records */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Account Security Records
            </h4>
            
            {securityRecords.length === 0 ? (
              <div className="text-center py-8">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No security records found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Security records will appear here when users have failed login attempts
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Failed Attempts</TableHead>
                      <TableHead>Consecutive Lockouts</TableHead>
                      <TableHead>Last Attempt</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {securityRecords.map((record) => (
                      <TableRow key={record.email}>
                        <TableCell className="font-medium">
                          {record.email}
                        </TableCell>
                        <TableCell>
                          {getLockoutStatus(record)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {record.failedLoginAttempts}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {record.consecutiveLockouts}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {formatTime(record.lastAttemptTime)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResetEmail(record.email);
                              setResetLockoutDialog(true);
                            }}
                            disabled={!isAccountLocked(record.lockoutUntil)}
                          >
                            <Unlock className="h-3 w-3 mr-1" />
                            Reset
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Security Statistics */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Security Statistics
            </h4>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Currently Locked</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {securityRecords.filter(r => isAccountLocked(r.lockoutUntil)).length}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Failed Attempts</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {securityRecords.reduce((sum, r) => sum + r.failedLoginAttempts, 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Total Records</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {securityRecords.length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={resetLockoutDialog}
        onOpenChange={setResetLockoutDialog}
        title="Reset Account Lockout"
        description={`This will unlock the account for ${resetEmail} and reset all failed login attempts. The user will be able to login again immediately.`}
        confirmText="Reset Lockout"
        cancelText="Cancel"
        variant="default"
        loading={actionLoading}
        onConfirm={async () => {
          setActionLoading(true);
          try {
            await securityService.resetSecurityRecord(resetEmail);
            await loadSecurityRecords();
          } catch (error) {
            setError('Failed to reset lockout');
            console.error('Error resetting lockout:', error);
          } finally {
            setActionLoading(false);
          }
        }}
      />

      <ConfirmationDialog
        open={cleanupDialog}
        onOpenChange={setCleanupDialog}
        title="Cleanup Expired Lockouts"
        description="This will remove all expired lockout records from the system. This action cannot be undone."
        confirmText="Cleanup Expired"
        cancelText="Cancel"
        variant="default"
        loading={actionLoading}
        onConfirm={async () => {
          setActionLoading(true);
          try {
            await securityService.cleanupExpiredLockouts();
            await loadSecurityRecords();
          } catch (error) {
            setError('Failed to cleanup expired lockouts');
            console.error('Error cleaning up lockouts:', error);
          } finally {
            setActionLoading(false);
          }
        }}
      />
    </>
  );
} 