'use client';

import { useState, useEffect, useMemo } from 'react';
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
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Users,
  Trash2,
  Edit,
  Scale,
} from 'lucide-react';
import { investmentsApi, ownersApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';
import moment from 'moment';
import {
  AddOwnerButton,
  ColorCard,
  formatAccountingDate,
  getTransactionTypeBadge,
  INVESTMENT_GRADIENT,
  NewTransactionButton,
  SalesPageHero,
  STAT_GRID_CLASS,
  SummaryStat,
} from '@/components/investments/investments-ui';
import {
  OwnerFormDialog,
  type OwnerFormData,
} from '@/components/investments/owner-form-dialog';
import {
  TransactionFormDialog,
  type TransactionFormData,
} from '@/components/investments/transaction-form-dialog';

const emptyOwnerForm = (): OwnerFormData => ({
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
});

const defaultTransactionForm = (): TransactionFormData => ({
  owner: '',
  type: 'investment',
  amount: '',
  date: moment().format('YYYY-MM-DD'),
  description: '',
});

export default function InvestmentsPage() {
  const { toast } = useToast();
  const [owners, setOwners] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [filterOwner, setFilterOwner] = useState('all');
  const [formData, setFormData] = useState<TransactionFormData>(defaultTransactionForm());
  const [ownerForm, setOwnerForm] = useState<OwnerFormData>(emptyOwnerForm());
  const [editingOwner, setEditingOwner] = useState<any>(null);
  const [savingOwner, setSavingOwner] = useState(false);
  const [deleteOwnerTarget, setDeleteOwnerTarget] = useState<{ id: string; name: string } | null>(
    null
  );
  const [deletingOwner, setDeletingOwner] = useState(false);

  const extraParams = useMemo((): Record<string, string> => {
    if (filterOwner !== 'all') return { owner: filterOwner };
    return {};
  }, [filterOwner]);

  const {
    items: investments,
    loading: listLoading,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    refetch: refetchInvestments,
  } = usePaginatedList<any>((params) => investmentsApi.getAll(params), {
    sortBy: 'date',
    sortOrder: 'desc',
    extraParams,
  });

  const fetchMeta = async () => {
    try {
      setMetaLoading(true);
      const [summaryRes, ownersRes] = await Promise.all([
        investmentsApi.getSummary(),
        ownersApi.getAll(),
      ]);
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
      if (ownersRes.success && ownersRes.data) {
        setOwners(ownersRes.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  const handleSaveTransaction = async () => {
    if (!formData.owner || !formData.type || !formData.amount) {
      toast({
        title: 'Validation Error',
        description: 'Please select an owner and fill in type and amount',
        variant: 'destructive',
      });
      return;
    }

    const selectedOwner = owners.find((o) => o._id === formData.owner);
    if (!selectedOwner) {
      toast({
        title: 'Validation Error',
        description: 'Please select a valid owner',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await investmentsApi.create({
        ...formData,
        ownerName: selectedOwner.name,
        amount: parseFloat(formData.amount),
        date: moment(formData.date, 'YYYY-MM-DD').startOf('day').toDate(),
      });
      toast({ title: 'Success', description: 'Transaction added successfully' });
      setShowAddTransaction(false);
      setFormData(defaultTransactionForm());
      await refetchInvestments();
      await fetchMeta();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save transaction',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddOwner = () => {
    setEditingOwner(null);
    setOwnerForm(emptyOwnerForm());
    setShowAddOwner(true);
  };

  const handleOwnerDialogChange = (open: boolean) => {
    setShowAddOwner(open);
    if (!open) {
      setEditingOwner(null);
      setOwnerForm(emptyOwnerForm());
    }
  };

  const handleSaveOwner = async () => {
    if (!ownerForm.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Owner name is required',
        variant: 'destructive',
      });
      return;
    }

    setSavingOwner(true);
    try {
      if (editingOwner) {
        await ownersApi.update(editingOwner._id, ownerForm);
        toast({ title: 'Success', description: 'Owner updated successfully' });
      } else {
        await ownersApi.create(ownerForm);
        toast({ title: 'Success', description: 'Owner created successfully' });
      }
      setShowAddOwner(false);
      setEditingOwner(null);
      setOwnerForm(emptyOwnerForm());
      await fetchMeta();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save owner',
        variant: 'destructive',
      });
    } finally {
      setSavingOwner(false);
    }
  };

  const handleEditOwner = (owner: any) => {
    setEditingOwner(owner);
    setOwnerForm({
      name: owner.name || '',
      phone: owner.phone || '',
      email: owner.email || '',
      address: owner.address || '',
      notes: owner.notes || '',
    });
    setShowAddOwner(true);
  };

  const confirmDeleteOwner = async () => {
    if (!deleteOwnerTarget) return;
    setDeletingOwner(true);
    try {
      await ownersApi.delete(deleteOwnerTarget.id);
      toast({ title: 'Success', description: 'Owner deleted successfully' });
      setDeleteOwnerTarget(null);
      await fetchMeta();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete owner',
        variant: 'destructive',
      });
    } finally {
      setDeletingOwner(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Owner Management"
          description="Manage owners and track investments & withdrawals"
          badge="Capital"
          gradient={INVESTMENT_GRADIENT}
          actions={
            <div className="flex flex-wrap gap-2">
              <AddOwnerButton onClick={handleOpenAddOwner} />
              <NewTransactionButton onClick={() => setShowAddTransaction(true)} />
            </div>
          }
        />

        <div className={STAT_GRID_CLASS}>
          <SummaryStat
            label="Total Investments"
            value={summary ? formatCurrency(summary.totalInvestments || 0) : '-'}
            icon={TrendingUp}
            theme="bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-900 ring-1 ring-emerald-100"
          />
          <SummaryStat
            label="Total Withdrawals"
            value={summary ? formatCurrency(summary.totalWithdrawals || 0) : '-'}
            icon={TrendingDown}
            theme="bg-gradient-to-br from-rose-50 to-red-100 text-rose-900 ring-1 ring-rose-100"
          />
          <SummaryStat
            label="Net Balance"
            value={summary ? formatCurrency(summary.netBalance || 0) : '-'}
            icon={Scale}
            theme="bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-900 ring-1 ring-violet-100"
          />
          <SummaryStat
            label="Owners"
            value={metaLoading ? '-' : String(owners.length)}
            icon={Users}
            theme="bg-gradient-to-br from-indigo-50 to-purple-100 text-indigo-900 ring-1 ring-indigo-100"
          />
        </div>

        {summary?.byOwner && summary.byOwner.length > 0 && (
          <ColorCard
            title="Owner-wise Summary"
            headerClassName="bg-gradient-to-r from-violet-50 to-indigo-50 border-indigo-100/50 text-indigo-900"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.byOwner.map((ownerData: any) => (
                <div
                  key={ownerData.ownerId}
                  className="rounded-2xl bg-gradient-to-br from-white to-indigo-50/50 ring-1 ring-indigo-100 p-4 space-y-2"
                >
                  <h3 className="font-semibold text-indigo-900">{ownerData.ownerName}</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Invested</span>
                    <span className="text-emerald-700 font-semibold">
                      {formatCurrency(ownerData.totalInvestments)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Withdrawn</span>
                    <span className="text-rose-700 font-semibold">
                      {formatCurrency(ownerData.totalWithdrawals)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-indigo-100 pt-2">
                    <span className="text-slate-700 font-medium">Balance</span>
                    <span
                      className={`font-bold ${
                        ownerData.netBalance >= 0 ? 'text-indigo-900' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(ownerData.netBalance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ColorCard>
        )}

        <ColorCard
          title={`Owners (${owners.length})`}
          headerClassName="bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 border-violet-100/50 text-violet-900"
        >
          {metaLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : owners.length === 0 ? (
            <p className="text-center py-8 text-slate-500">
              No owners yet. Click &quot;Add Owner&quot; to create one.
            </p>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {owners.map((owner) => (
                  <div
                    key={owner._id}
                    className="rounded-2xl border border-violet-100/80 bg-gradient-to-br from-white to-violet-50/30 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-violet-900">{owner.name}</p>
                        <p className="text-sm text-slate-600">{owner.phone || '—'}</p>
                        <p className="text-xs text-slate-400 truncate">{owner.email || '—'}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl text-indigo-700 hover:bg-indigo-50"
                          onClick={() => handleEditOwner(owner)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl text-red-600 hover:bg-red-50"
                          onClick={() =>
                            setDeleteOwnerTarget({ id: owner._id, name: owner.name })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {owner.address && (
                      <p className="text-xs text-slate-500 mt-2">{owner.address}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden lg:block overflow-x-auto rounded-xl ring-1 ring-violet-100/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-violet-50 to-indigo-50/80">
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {owners.map((owner) => (
                      <TableRow key={owner._id} className="hover:bg-violet-50/20">
                        <TableCell className="font-medium text-violet-900">{owner.name}</TableCell>
                        <TableCell>{owner.phone || '—'}</TableCell>
                        <TableCell>{owner.email || '—'}</TableCell>
                        <TableCell className="max-w-xs truncate">{owner.address || '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl text-indigo-700 hover:bg-indigo-50"
                              onClick={() => handleEditOwner(owner)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl text-red-600 hover:bg-red-50"
                              onClick={() =>
                                setDeleteOwnerTarget({ id: owner._id, name: owner.name })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </ColorCard>

        <ColorCard
          title={`Transaction History${pagination.total ? ` (${pagination.total})` : ''}`}
          headerClassName="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-100/50 text-purple-900"
        >
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Select value={filterOwner} onValueChange={setFilterOwner}>
              <SelectTrigger className="w-full sm:w-[220px] rounded-xl">
                <SelectValue placeholder="Filter by owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {owners.map((owner) => (
                  <SelectItem key={owner._id} value={owner._id}>
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {listLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {investments.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-purple-100/80 bg-gradient-to-br from-white to-purple-50/30 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-purple-900">
                          {item.ownerName || item.owner?.name || '—'}
                        </p>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {formatAccountingDate(item.date)}
                        </p>
                        <Badge className={`mt-2 ${getTransactionTypeBadge(item.type)}`}>
                          {item.type}
                        </Badge>
                      </div>
                      <span
                        className={`shrink-0 rounded-xl px-2.5 py-1 text-sm font-bold ring-1 ${
                          item.type === 'investment'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                            : 'bg-rose-50 text-rose-700 ring-rose-100'
                        }`}
                      >
                        {item.type === 'investment' ? '+' : '-'}
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                ))}
                {investments.length === 0 && (
                  <p className="text-center py-8 text-slate-500">No transactions found</p>
                )}
              </div>

              <div className="hidden lg:block overflow-x-auto rounded-xl ring-1 ring-purple-100/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-purple-50 to-violet-50/80">
                      <TableHead>Date</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investments.map((item) => (
                      <TableRow key={item._id} className="hover:bg-purple-50/20">
                        <TableCell>{formatAccountingDate(item.date)}</TableCell>
                        <TableCell className="font-medium text-purple-900">
                          {item.ownerName || item.owner?.name || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTransactionTypeBadge(item.type)}>{item.type}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-xs truncate">
                          {item.description || '—'}
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold ${
                            item.type === 'investment' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {item.type === 'investment' ? '+' : '-'}
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {investments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <ListPagination pagination={pagination} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
            </>
          )}
        </ColorCard>

        <OwnerFormDialog
          open={showAddOwner}
          onOpenChange={handleOwnerDialogChange}
          editing={!!editingOwner}
          form={ownerForm}
          onFormChange={setOwnerForm}
          onSave={handleSaveOwner}
          saving={savingOwner}
        />

        <TransactionFormDialog
          open={showAddTransaction}
          onOpenChange={setShowAddTransaction}
          form={formData}
          onFormChange={setFormData}
          owners={owners}
          onSave={handleSaveTransaction}
          saving={saving}
        />

        <AlertDialog
          open={deleteOwnerTarget !== null}
          onOpenChange={(open) => {
            if (!open && !deletingOwner) setDeleteOwnerTarget(null);
          }}
        >
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this owner?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deleteOwnerTarget?.name}</strong>? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingOwner}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  confirmDeleteOwner();
                }}
                disabled={deletingOwner}
                className="rounded-xl bg-red-600 hover:bg-red-700"
              >
                {deletingOwner && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
