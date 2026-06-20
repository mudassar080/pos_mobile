'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Loader2, Edit, Trash2, Shield, UserCog } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { paginatedParams } from '@/lib/pagination';
import { useToast } from '@/hooks/use-toast';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { ListPagination } from '@/components/ui/list-pagination';
import { FitValue, STAT_GRID_CLASS } from '@/components/ui/stat-cards';
import { useAuth } from '@/lib/auth-context';
import {
  UserFormDialog,
  type UserFormData,
} from '@/components/users/user-form-dialog';

const emptyForm: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'staff',
  isActive: true,
};

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case 'superadmin':
      return <Badge className="bg-violet-600">Superadmin</Badge>;
    case 'admin':
      return <Badge className="bg-indigo-600">Admin</Badge>;
    default:
      return <Badge variant="secondary">Staff</Badge>;
  }
}

export default function UsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<{
    total: number;
    superadmins: number;
    active: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);

  const isSuperadmin = currentUser?.role === 'superadmin';

  const {
    items: users,
    loading,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    search,
    setSearch,
    refetch,
  } = usePaginatedList((params) => usersApi.getAll(params), { enabled: isSuperadmin });

  const fetchStats = async () => {
    try {
      const response = await usersApi.getAll(paginatedParams(500));
      if (response.success && response.data) {
        const data = response.data;
        setStats({
          total: response.pagination?.total ?? data.length,
          superadmins: data.filter((u) => u.role === 'superadmin').length,
          active: data.filter((u) => u.isActive !== false).length,
        });
      }
    } catch {
      // Stat cards fall back to dashes
    }
  };

  useEffect(() => {
    if (currentUser && !isSuperadmin) {
      router.replace('/dashboard');
    }
  }, [currentUser, isSuperadmin, router]);

  useEffect(() => {
    if (isSuperadmin) {
      fetchStats();
    }
  }, [isSuperadmin]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (u: any) => {
    setEditingUser(u);
    setForm({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'staff',
      isActive: u.isActive !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({
        title: 'Validation',
        description: 'Name and email are required',
        variant: 'destructive',
      });
      return;
    }

    if (!editingUser && !form.password) {
      toast({
        title: 'Validation',
        description: 'Password is required for new users',
        variant: 'destructive',
      });
      return;
    }

    if (form.password && form.password.length < 6) {
      toast({
        title: 'Validation',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
        isActive: form.isActive,
      };
      if (form.password) payload.password = form.password;

      const editingSuperadmin = editingUser?.role === 'superadmin';
      if (!editingSuperadmin) {
        payload.role = form.role === 'superadmin' ? 'staff' : form.role;
      }

      if (editingUser) {
        await usersApi.update(editingUser._id, payload);
        toast({ title: 'Updated', description: 'User updated successfully' });
      } else {
        const response = await usersApi.create(payload);
        const createdRole = response.data?.role || form.role;
        toast({
          title: 'Created',
          description: `User created as ${createdRole}`,
        });
      }

      setDialogOpen(false);
      await refetch();
      await fetchStats();
    } catch (error: any) {
      const message = error.message || 'Failed to save user';
      toast({
        title: 'Error',
        description:
          message.includes('Not authorized') || message.includes('permission')
            ? `${message}. Sign out and sign in again as superadmin (admin@pos.com).`
            : message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await usersApi.delete(deleteTarget._id);
      toast({ title: 'Deleted', description: 'User removed' });
      setDeleteTarget(null);
      await refetch();
      await fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperadmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Checking access...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-200">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">User Management</h1>
                <p className="text-slate-600 text-sm">Create admin and staff accounts</p>
              </div>
            </div>
          </div>
          <Button
            onClick={openCreate}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        <div className={STAT_GRID_CLASS}>
          <Card className="rounded-2xl border-indigo-100 bg-gradient-to-br from-indigo-50 to-white min-w-0">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Total users</p>
              <FitValue value={stats ? String(stats.total) : '-'} className="text-slate-900" />
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-violet-100 bg-gradient-to-br from-violet-50 to-white min-w-0">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Superadmins</p>
              <FitValue
                value={stats ? String(stats.superadmins) : '-'}
                className="text-violet-700"
              />
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-emerald-100 bg-gradient-to-br from-emerald-50 to-white min-w-0">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Active</p>
              <FitValue
                value={stats ? String(stats.active) : '-'}
                className="text-emerald-700"
              />
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              System users{pagination.total ? ` (${pagination.total})` : ''}
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell>
                        {u.isActive !== false ? (
                          <Badge className="bg-emerald-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl"
                            onClick={() => openEdit(u)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteTarget(u)}
                            disabled={
                              currentUser?.id === (u._id?.toString?.() ?? u.id)
                            }
                            title={
                              currentUser?.id === u._id
                                ? 'Cannot delete your own account'
                                : 'Delete user'
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <ListPagination pagination={pagination} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={!!editingUser}
        roleLocked={editingUser?.role === 'superadmin'}
        form={form}
        onFormChange={setForm}
        onSave={handleSave}
        saving={saving}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})? They will no
              longer be able to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
