'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { ListPagination } from '@/components/ui/list-pagination';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, History, RefreshCw } from 'lucide-react';
import { activityLogsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { usePermissions } from '@/hooks/use-permissions';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ACTION_STYLES: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  update: 'bg-blue-100 text-blue-800 border-blue-200',
  delete: 'bg-red-100 text-red-800 border-red-200',
  login: 'bg-violet-100 text-violet-800 border-violet-200',
  payment: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  cancel: 'bg-orange-100 text-orange-800 border-orange-200',
  stock_update: 'bg-amber-100 text-amber-800 border-amber-200',
};

const ENTITY_LABELS: Record<string, string> = {
  auth: 'Auth',
  product: 'Product',
  sale: 'Sale',
  purchase: 'Purchase',
  expense: 'Expense',
  user: 'User',
  customer: 'Customer',
  supplier: 'Supplier',
  sale_return: 'Sale Return',
  purchase_return: 'Purchase Return',
  other_income: 'Other Income',
  settings: 'Settings',
};

function ActionBadge({ action }: { action: string }) {
  return (
    <Badge variant="outline" className={cn('capitalize', ACTION_STYLES[action] || '')}>
      {action.replace('_', ' ')}
    </Badge>
  );
}

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case 'superadmin':
      return <Badge className="bg-violet-600">Superadmin</Badge>;
    case 'admin':
      return <Badge className="bg-indigo-600">Admin</Badge>;
    case 'staff':
      return <Badge variant="secondary">Staff</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

export default function ActivityLogsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { canViewActivityLogs } = usePermissions();
  const router = useRouter();

  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const extraParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (entityFilter !== 'all') params.entity = entityFilter;
    if (actionFilter !== 'all') params.action = actionFilter;
    return params;
  }, [entityFilter, actionFilter]);

  const {
    items: logs,
    loading,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    search,
    setSearch,
    refetch,
  } = usePaginatedList((params) => activityLogsApi.getAll(params), {
    sortBy: 'createdAt',
    sortOrder: 'desc',
    extraParams,
    enabled: canViewActivityLogs,
  });

  useEffect(() => {
    if (user && !canViewActivityLogs) {
      router.replace('/dashboard');
    }
  }, [user, canViewActivityLogs, router]);

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load activity logs',
        variant: 'destructive',
      });
    }
  };

  if (!canViewActivityLogs) return null;

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 p-5 sm:p-8 text-white shadow-xl shadow-orange-300/30">
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <History className="h-3.5 w-3.5" />
                Audit trail
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Activity Log</h1>
              <p className="text-sm sm:text-base text-orange-100 max-w-lg">
                Track who performed each action across products, sales, purchases, expenses, and more.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleRefresh}
              disabled={loading}
              className="rounded-xl bg-white/95 text-orange-900 hover:bg-white border-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-lg ring-1 ring-slate-200/60 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search user, email, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-full lg:w-[160px] rounded-xl">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                {Object.entries(ENTITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full lg:w-[160px] rounded-xl">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="cancel">Cancel</SelectItem>
                <SelectItem value="stock_update">Stock update</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {logs.map((log) => (
                  <div key={log._id} className="rounded-xl border border-slate-100 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{log.userName}</p>
                        <p className="text-xs text-slate-500">{log.userEmail}</p>
                      </div>
                      <RoleBadge role={log.userRole} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ActionBadge action={log.action} />
                      <Badge variant="outline">{ENTITY_LABELS[log.entity] || log.entity}</Badge>
                    </div>
                    <p className="text-sm text-slate-700">{log.description}</p>
                    {log.entityLabel && (
                      <p className="text-xs font-medium text-orange-700">{log.entityLabel}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-center py-10 text-slate-500">No activity recorded yet</p>
                )}
              </div>

              <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-slate-200/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-amber-50 to-orange-50/80">
                      <TableHead>Date & Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log._id} className="hover:bg-orange-50/20">
                        <TableCell className="text-slate-600 whitespace-nowrap text-sm">
                          {format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{log.userName}</p>
                            <p className="text-xs text-slate-500">{log.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={log.userRole} />
                        </TableCell>
                        <TableCell>
                          <ActionBadge action={log.action} />
                        </TableCell>
                        <TableCell className="capitalize text-slate-700">
                          {ENTITY_LABELS[log.entity] || log.entity}
                        </TableCell>
                        <TableCell className="font-medium text-orange-800">
                          {log.entityLabel || '—'}
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-xs truncate">
                          {log.description}
                        </TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                          No activity recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <ListPagination pagination={pagination} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
