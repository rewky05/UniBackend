'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  UserCheck, 
  UserX,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get, remove } from 'firebase/database';
import { auth, db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { AUTH_CONFIG } from '@/lib/config/auth';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { formatDateToText } from '@/lib/utils';

interface AdminUser {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'superadmin';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface UserRoleManagementProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export function UserRoleManagement({ onUnsavedChanges }: UserRoleManagementProps) {
  const { isSuperadmin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Confirmation dialog states
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [toggleStatusDialog, setToggleStatusDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load admin users from Firebase
  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList = Object.keys(usersData)
          .map(uid => ({
            uid,
            ...usersData[uid]
          }))
          .filter((user: any) => user.isActive === true || user.isActive === false); 
        setUsers(usersList);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading admin users:', error);
      setError('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!isSuperadmin()) {
      setError('Only superadmins can create admin users');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Capture the creator's email before creating the new user
    const creatorEmail = auth.currentUser?.email || 'system';

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update display name with firstName
      await updateProfile(userCredential.user, {
        displayName: formData.firstName
      });

      // Store user data in Realtime Database
      const userData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'admin', // Always set to admin since this is admin user creation
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: creatorEmail
      };

      await set(ref(db, `users/${userCredential.user.uid}`), userData);

      // Immediately sign out to prevent the header from showing the new user's email
      // The useAuth hook will handle restoring the correct user state
      await auth.signOut();

      // Refresh users list
      await loadAdminUsers();

      // Reset form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
      });
      setIsDialogOpen(false);
      onUnsavedChanges(false);

    } catch (error: any) {
      console.error('Error creating admin user:', error);
      setError(error.message || 'Failed to create admin user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!isSuperadmin()) {
      setError('Only superadmins can delete admin users');
      return;
    }

    if (user.role === 'superadmin') {
      setError('Cannot delete superadmin users');
      return;
    }

    setSelectedUser(user);
    setDeleteUserDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      // Remove from Realtime Database
      await remove(ref(db, `users/${selectedUser.uid}`));
      
      // Refresh users list
      await loadAdminUsers();
      
    } catch (error) {
      console.error('Error deleting admin user:', error);
      setError('Failed to delete admin user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: AdminUser) => {
    if (!isSuperadmin()) {
      setError('Only superadmins can modify user status');
      return;
    }

    setSelectedUser(user);
    setToggleStatusDialog(true);
  };

  const confirmToggleUserStatus = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      await set(ref(db, `users/${selectedUser.uid}/isActive`), !selectedUser.isActive);
      await loadAdminUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isSuperadmin()) {
  return (
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
          User & Role Management
        </CardTitle>
      </CardHeader>
      <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only superadmins can access user management features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
            <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User & Role Management</h2>
          <p className="text-muted-foreground">
            Manage admin users and their permissions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
                <Plus className="h-4 w-4 mr-2" />
              Add Admin User
              </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Admin User</DialogTitle>
              <DialogDescription>
                Add a new administrator to the system. They will receive login credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@unihealth.ph"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter secure password"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="First Name"
                  />
            </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Last Name"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>
            Manage system administrators and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active admin users found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first admin user to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.firstName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'superadmin' ? 'default' : 'secondary'}>
                        {user.role === 'superadmin' ? (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Superadmin
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3 w-3 mr-1" />
                            Admin
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDateToText(user.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDateToText(user.lastLogin)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserStatus(user)}
                          disabled={user.role === 'superadmin'}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.role === 'superadmin'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </CardContent>
    </Card>

    {/* Confirmation Dialogs */}
    <ConfirmationDialog
      open={deleteUserDialog}
      onOpenChange={setDeleteUserDialog}
      title="Delete Admin User"
      description={`Are you sure you want to delete ${selectedUser?.firstName}? This action cannot be undone and will permanently remove the user from the system.`}
      confirmText="Delete User"
      cancelText="Cancel"
      variant="destructive"
      loading={actionLoading}
      onConfirm={confirmDeleteUser}
    />

    <ConfirmationDialog
      open={toggleStatusDialog}
      onOpenChange={setToggleStatusDialog}
      title={`${selectedUser?.isActive ? 'Deactivate' : 'Activate'} User`}
      description={`Are you sure you want to ${selectedUser?.isActive ? 'deactivate' : 'activate'} ${selectedUser?.firstName}? This will ${selectedUser?.isActive ? 'prevent' : 'allow'} them from accessing the system.`}
      confirmText={selectedUser?.isActive ? 'Deactivate' : 'Activate'}
      cancelText="Cancel"
      variant="default"
      loading={actionLoading}
      onConfirm={confirmToggleUserStatus}
    />
    </div>
  );
}