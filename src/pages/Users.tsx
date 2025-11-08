import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Filter, Users as UsersIcon, Edit, Trash2, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import UserDialog from '@/components/UserDialog';
import FilterPanel from '@/components/FilterPanel';
import type { User } from '@/types';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('API server not found. Please ensure the proxy server is running on port 3001.');
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) throw new Error(result.error || 'Failed to fetch users');

      const usersData: User[] = (result.data || []).map((p: any) => ({
        id: p.id,
        email: p.email,
        name: p.name || p.full_name || p.email,
        role: p.role || 'staff',
        region: p.region,
        serviceCenter: p.serviceCenter,
        active: p.active,
        createdAt: p.createdAt
      }));

      // Filter out duplicate users based on ID
      const uniqueUsers = usersData.filter((user, index, self) =>
        index === self.findIndex(u => u.id === user.id)
      );

      setUsers(uniqueUsers);
    } catch (error: any) {
      toast({
        title: 'Error fetching users',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`http://localhost:3001/api/users/manage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          data: {
            userId: userToDelete.id
          }
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('API server not found. Please ensure the proxy server is running on port 3001.');
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) throw new Error(result.error || 'Failed to delete user');

      toast({
        title: 'Success',
        description: 'User deleted successfully'
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/manage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          data: {
            userId: user.id,
            active: !user.active
          }
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('API server not found. Please ensure the proxy server is running on port 3001.');
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) throw new Error(result.error || 'Failed to toggle user status');

      toast({
        title: 'Success',
        description: `User ${!user.active ? 'activated' : 'deactivated'} successfully`
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleExportUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/users/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: '/users/export',
          action: 'export',
          data: {}
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('API server not found. Please ensure the proxy server is running on port 3001.');
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Failed to export users');

      // Convert data to CSV
      const csvData = data.data;
      if (csvData.length === 0) {
        toast({
          title: "No Data",
          description: "No users to export",
          variant: "destructive",
        });
        return;
      }

      // Create CSV content
      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map((row: any) => 
        Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `Exported ${data.count} users successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.active) ||
      (statusFilter === 'inactive' && !user.active);

    const matchesDateFrom = !dateFrom || new Date(user.createdAt) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(user.createdAt) <= new Date(dateTo + 'T23:59:59');

    return matchesSearch && matchesRole && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.active).length,
    inactive: users.filter(u => !u.active).length,
    admins: users.filter(u => u.role === 'admin').length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      admin: "destructive",
      manager: "default",
      staff: "secondary",
      technician: "outline",
      customer: "outline"
    };
    return <Badge variant={variants[role] || "default"}>{role}</Badge>;
  };

  // Only admins can manage users
  const canManageUsers = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground">Manage system users, roles, and permissions</p>
        </div>
        {canManageUsers && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportUsers}>
              <Download className="mr-2 h-4 w-4" />
              Export Users
            </Button>
            <Button onClick={handleAddUser}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-success">{stats.active}</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Administrators</p>
                <p className="text-2xl font-bold text-destructive">{stats.admins}</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <FilterPanel
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={{
          role: roleFilter,
          status: statusFilter,
        }}
        onFilterChange={(key, value) => {
          if (key === 'role') setRoleFilter(value);
          if (key === 'status') setStatusFilter(value);
        }}
        filterOptions={[
          {
            key: 'role',
            label: 'Role',
            options: [
              { value: 'admin', label: 'Admin' },
              { value: 'manager', label: 'Manager' },
              { value: 'staff', label: 'Staff' },
              { value: 'technician', label: 'Technician' },
              { value: 'customer', label: 'Customer' },
            ],
          },
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ],
          },
        ]}
        dateFilters={{
          from: dateFrom,
          to: dateTo,
          onFromChange: setDateFrom,
          onToChange: setDateTo,
        }}
        onClearAll={handleClearFilters}
        resultCount={filteredUsers.length}
        totalCount={users.length}
      />

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold">{user.name}</h3>
                          {getRoleBadge(user.role)}
                          {user.active ? (
                            <Badge variant="outline" className="bg-success/10 text-success border-success">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">Inactive</Badge>
                          )}
                          {user.id === currentUser?.id && (
                            <Badge variant="secondary">You</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {(user.region || user.serviceCenter) && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {user.region && <span>Region: {user.region}</span>}
                            {user.region && user.serviceCenter && <span>•</span>}
                            {user.serviceCenter && <span>Service Center: {user.serviceCenter}</span>}
                          </div>
                        )}
                      </div>
                      {canManageUsers && user.id !== currentUser?.id && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleStatus(user)}
                            className={user.active ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'}
                          >
                            {user.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
        onSuccess={fetchUsers}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user <strong>{userToDelete?.name}</strong> and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
