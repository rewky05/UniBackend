'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, 
  Smartphone, 
  Globe, 
  Clock, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  Users,
  Activity
} from 'lucide-react';
import { sessionService, type SessionData } from '@/lib/services/session.service';
import { SecureSessionStorage } from '@/lib/utils/session-storage';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

export function SessionManagement() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalActiveSessions: 0,
    uniqueUsers: 0,
    averageSessionsPerUser: 0,
  });
  const [userRoles, setUserRoles] = useState<{ [userId: string]: string }>({});
  
  // Confirmation dialog states
  const [logoutAllDialog, setLogoutAllDialog] = useState(false);
  const [logoutSessionDialog, setLogoutSessionDialog] = useState(false);
  const [logoutSessionId, setLogoutSessionId] = useState<string>('');
  const [logoutLoading, setLogoutLoading] = useState(false);

  const loadSessions = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading sessions...');
      const [activeSessions, sessionStats] = await Promise.all([
        sessionService.getAllActiveSessions(),
        sessionService.getSessionStats()
      ]);
      
      console.log('📊 Loaded sessions:', activeSessions.length, 'sessions');
      if (activeSessions.length > 0) {
        activeSessions.forEach((session, index) => {
          console.log(`📋 Session ${index + 1}:`, {
            userEmail: session.userEmail,
            lastActivity: new Date(session.lastActivity).toLocaleTimeString(),
            expiresAt: new Date(session.expiresAt).toLocaleTimeString(),
            duration: `${Math.floor((Date.now() - session.createdAt) / (1000 * 60))}m`
          });
        });
      }
      console.log('📈 Session stats:', sessionStats);
      
      // Fetch current user roles for all sessions
      const rolePromises = activeSessions.map(async (session) => {
        const role = await getUserRole(session.userId);
        return { userId: session.userId, role };
      });
      
      const roleResults = await Promise.all(rolePromises);
      const rolesMap: { [userId: string]: string } = {};
      roleResults.forEach(({ userId, role }) => {
        rolesMap[userId] = role;
      });
      
      setUserRoles(rolesMap);
      setSessions(activeSessions);
      setStats(sessionStats);
    } catch (error) {
      setError('Failed to load session data');
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Force cleanup before refresh
      console.log('Refreshing sessions with cleanup...');
      await sessionService.cleanupExpiredSessions();
      await loadSessions();
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleForceLogout = async (sessionId: string) => {
    try {
      console.log('Force logging out session:', sessionId);
      await sessionService.destroySession(sessionId);
      console.log('Session destroyed, reloading sessions...');
      await loadSessions();
    } catch (error) {
      setError('Failed to force logout session');
      console.error('Error forcing logout:', error);
    }
  };

  const handleForceLogoutUser = async (userId: string) => {
    try {
      const loggedOutCount = await sessionService.forceLogoutUser(userId);
      await loadSessions();
      console.log(`Force logged out ${loggedOutCount} sessions for user ${userId}`);
    } catch (error) {
      setError('Failed to force logout user');
      console.error('Error forcing logout user:', error);
    }
  };

  const handleCleanup = async () => {
    try {
      console.log('Cleaning up expired sessions...');
      const cleanedCount = await sessionService.cleanupExpiredSessions();
      console.log(`Cleaned up ${cleanedCount} expired sessions`);
      await loadSessions();
    } catch (error) {
      setError('Failed to cleanup expired sessions');
      console.error('Error cleaning up sessions:', error);
    }
  };

  useEffect(() => {
    loadSessions();
    
    // Auto-refresh disabled - only refresh on activity events
    // const autoRefreshInterval = setInterval(() => {
    //   console.log('Auto-refreshing sessions...');
    //   loadSessions();
    // }, 120000); // 2 minutes (reduced frequency)
    
    // Manual refresh only - activity events disabled
    // const handleSessionUpdate = (event: any) => {
    //   console.log('🎯 Session activity event received:', event.detail);
    //   console.log('Session activity detected, refreshing UI...');
    //   // Force immediate refresh
    //   setRefreshing(true);
    //   loadSessions().finally(() => setRefreshing(false));
    // };
    
    // Add event listener for session updates
    // window.addEventListener('sessionActivity', handleSessionUpdate);
    // console.log('📡 Session activity event listener added');
    
    return () => {
      // clearInterval(autoRefreshInterval); // Disabled auto-refresh
      // window.removeEventListener('sessionActivity', handleSessionUpdate); // Disabled activity events
    };
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (startTime: number) => {
    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const getDeviceIcon = (userAgent: string = '') => {
    if (userAgent.includes('Mobile')) return <Smartphone className="h-4 w-4" />;
    if (userAgent.includes('Tablet')) return <Monitor className="h-4 w-4" />;
    return <Globe className="h-4 w-4" />;
  };

  const getDeviceType = (userAgent: string = '') => {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  };

  const isCurrentSession = (sessionId: string) => {
    return sessionId === SecureSessionStorage.getSessionId();
  };

  // Function to get current user role from database
  const getUserRole = async (userId: string): Promise<string> => {
    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        return userData.role || 'admin';
      }
      return 'admin'; // Default role
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'admin'; // Default role on error
    }
  };

    if (loading) {
    return (
      <>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading session data...</span>
                       </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialogs */}
        <ConfirmationDialog
          open={logoutAllDialog}
          onOpenChange={setLogoutAllDialog}
          title="Logout All Sessions"
          description="This will force logout all active sessions across all users. This action cannot be undone."
          confirmText="Logout All Sessions"
          cancelText="Cancel"
          variant="destructive"
          loading={logoutLoading}
          onConfirm={async () => {
            setLogoutLoading(true);
            try {
              console.log('Logout all sessions for all users');
              const allSessions = await sessionService.getAllActiveSessions();
              console.log(`Found ${allSessions.length} total sessions to logout`);
              for (const session of allSessions) {
                await sessionService.destroySession(session.sessionId);
              }
              await handleRefresh();
            } catch (error) {
              console.error('Error logging out all sessions:', error);
            } finally {
              setLogoutLoading(false);
            }
          }}
        />

        <ConfirmationDialog
          open={logoutSessionDialog}
          onOpenChange={setLogoutSessionDialog}
          title="Logout Session"
          description="This will force logout the selected session. The user will be immediately signed out."
          confirmText="Logout Session"
          cancelText="Cancel"
          variant="destructive"
          loading={logoutLoading}
          onConfirm={async () => {
            setLogoutLoading(true);
            try {
              console.log('Force logging out session:', logoutSessionId);
              await sessionService.destroySession(logoutSessionId);
              console.log('Session destroyed, reloading sessions...');
              await handleRefresh();
            } catch (error) {
              console.error('Error logging out session:', error);
            } finally {
              setLogoutLoading(false);
            }
          }}
        />
      </>
    );
  }

    return (
    <>
      <Card className="card-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Session Management
              </CardTitle>
              <CardDescription>
                Monitor and manage active user sessions across the platform
              </CardDescription>
            </div>
                                                                                                                                                                               <div className="flex space-x-2">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={handleRefresh}
                 disabled={refreshing}
               >
                 <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                 Refresh
               </Button>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setLogoutAllDialog(true)}
                 disabled={refreshing}
               >
                 <AlertTriangle className="h-4 w-4 mr-2" />
                 Logout All Sessions
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

        {/* Session Statistics */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Session Statistics
          </h4>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Active Sessions</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalActiveSessions}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Unique Users</span>
                </div>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Avg Sessions/User</span>
                </div>
                <p className="text-2xl font-bold">
                  {stats.averageSessionsPerUser.toFixed(1)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

                 {/* Active Sessions */}
         <div className="space-y-4">
           <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
             Active Sessions
           </h4>
           
           {sessions.length === 0 ? (
             <div className="text-center py-8">
               <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
               <p className="text-muted-foreground">No active sessions found</p>
               <p className="text-sm text-muted-foreground mt-1">
                 Active sessions will appear here when users are logged in
               </p>
             </div>
           ) : (
             <div className="border rounded-lg">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>User</TableHead>
                     <TableHead>Device</TableHead>
                     <TableHead>IP Address</TableHead>
                     <TableHead>Duration</TableHead>
                     <TableHead>Last Activity</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {sessions.map((session) => (
                     <TableRow
                       key={session.sessionId}
                       className={isCurrentSession(session.sessionId) ? 'bg-green-50' : ''}
                     >
                       <TableCell>
                         <div className="flex items-center space-x-2">
                           <div className="font-medium">{session.userEmail}</div>
                           <Badge variant="outline" className="text-xs">
                             {userRoles[session.userId] || session.userRole}
                           </Badge>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center space-x-2">
                           {getDeviceIcon(session.userAgent)}
                           <span className="text-sm">{getDeviceType(session.userAgent)}</span>
                         </div>
                       </TableCell>
                       <TableCell>
                         <span className="font-mono text-sm">{session.ipAddress || 'N/A'}</span>
                       </TableCell>
                       <TableCell>
                         <span className="text-sm">{formatDuration(session.createdAt)}</span>
                       </TableCell>
                       <TableCell>
                         <span className="text-sm">{formatTime(session.lastActivity)}</span>
                       </TableCell>
                       <TableCell>
                         {isCurrentSession(session.sessionId) ? (
                           <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                             Current Session
                           </Badge>
                         ) : (
                           <Badge variant="secondary" className="text-xs">
                             Active
                           </Badge>
                         )}
                       </TableCell>
                       <TableCell className="text-right">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             setLogoutSessionId(session.sessionId);
                             setLogoutSessionDialog(true);
                           }}
                           disabled={isCurrentSession(session.sessionId)}
                         >
                           <Trash2 className="h-3 w-3 mr-1" />
                           Logout
                         </Button>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
           )}
         </div>
       </CardContent>
     </Card>

     {/* Confirmation Dialogs */}
     <ConfirmationDialog
       open={logoutAllDialog}
       onOpenChange={setLogoutAllDialog}
       title="Logout All Sessions"
       description="This will force logout all active sessions across all users. This action cannot be undone."
       confirmText="Logout All Sessions"
       cancelText="Cancel"
       variant="destructive"
       loading={logoutLoading}
       onConfirm={async () => {
         setLogoutLoading(true);
         try {
           console.log('Logout all sessions for all users');
           const allSessions = await sessionService.getAllActiveSessions();
           console.log(`Found ${allSessions.length} total sessions to logout`);
           for (const session of allSessions) {
             await sessionService.destroySession(session.sessionId);
           }
           await handleRefresh();
         } catch (error) {
           console.error('Error logging out all sessions:', error);
         } finally {
           setLogoutLoading(false);
         }
       }}
     />

     <ConfirmationDialog
       open={logoutSessionDialog}
       onOpenChange={setLogoutSessionDialog}
       title="Logout Session"
       description="This will force logout the selected session. The user will be immediately signed out."
       confirmText="Logout Session"
       cancelText="Cancel"
       variant="destructive"
       loading={logoutLoading}
       onConfirm={async () => {
         setLogoutLoading(true);
         try {
           console.log('Force logging out session:', logoutSessionId);
           await sessionService.destroySession(logoutSessionId);
           console.log('Session destroyed, reloading sessions...');
           await handleRefresh();
         } catch (error) {
           console.error('Error logging out session:', error);
         } finally {
           setLogoutLoading(false);
         }
       }}
     />
   </>
  );
 } 