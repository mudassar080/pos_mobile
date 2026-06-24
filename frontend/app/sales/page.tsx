'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Trash2, ShoppingCart, DollarSign, Wallet, Receipt, Eye, Pencil, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { salesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { ListPagination } from '@/components/ui/list-pagination';
import { formatCurrency } from '@/utils/constant';
import {
  ColorCard,
  formatSaleDate,
  formatSaleDateShort,
  getStatusBadge,
  NewSaleButton,
  SalesPageHero,
  STAT_GRID_CLASS,
  SummaryStat,
} from '@/components/sales/sales-ui';

export default function SalesPage() {
  const { toast } = useToast();
  const { canEdit, canDelete } = usePermissions();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; num: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const {
    items: sales,
    loading,
    page,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    search,
    setSearch,
    refetch,
  } = usePaginatedList((params) => salesApi.getAll(params), { sortBy: 'date', sortOrder: 'desc' });

  const fetchSummary = async () => {
    try {
      const response = await salesApi.getSummary();
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch {
      // Summary cards fall back to dashes
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const response = await salesApi.delete(deleteTarget.id);
      if (response.success) {
        toast({
          title: 'Sale Deleted',
          description: `${deleteTarget.num} deleted and products restored`,
        });
        setDeleteTarget(null);
        await refetch();
        await fetchSummary();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete sale',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const renderSaleActions = (sale: any, mobile = false) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={mobile ? 'outline' : 'ghost'}
          size={mobile ? 'sm' : 'icon'}
          className={mobile ? 'rounded-lg' : 'h-8 w-8 rounded-lg'}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/sales/${sale._id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </Link>
        </DropdownMenuItem>
        {canEdit &&
          (sale.status !== 'cancelled' && sale.status !== 'paid' ? (
            <DropdownMenuItem asChild>
              <Link href={`/sales/${sale._id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit payment
              </Link>
            </DropdownMenuItem>
          ) : sale.status === 'cancelled' ? (
            <DropdownMenuItem disabled>
              <Pencil className="mr-2 h-4 w-4 opacity-50" />
              Edit (cancelled)
            </DropdownMenuItem>
          ) : null)}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onSelect={() =>
                setDeleteTarget({ id: sale._id, num: sale.invoiceNumber })
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Sales"
          description="Manage all sales transactions"
          badge="Transactions"
          gradient="from-cyan-600 via-blue-600 to-indigo-700"
          actions={<NewSaleButton />}
        />

        <div className={STAT_GRID_CLASS}>
          <SummaryStat
            label="Total Sales"
            value={summary ? String(summary.count || 0) : '-'}
            icon={ShoppingCart}
            theme="bg-gradient-to-br from-cyan-50 to-blue-100 text-cyan-900 ring-1 ring-cyan-100"
          />
          <SummaryStat
            label="Total Amount"
            value={summary ? formatCurrency(summary.totalSales || 0) : '-'}
            icon={DollarSign}
            theme="bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-900 ring-1 ring-emerald-100"
          />
          <SummaryStat
            label="Collected"
            value={summary ? formatCurrency(summary.totalPaid || 0) : '-'}
            icon={Receipt}
            theme="bg-gradient-to-br from-violet-50 to-purple-100 text-violet-900 ring-1 ring-violet-100"
          />
          <SummaryStat
            label="Outstanding"
            value={summary ? formatCurrency(summary.totalDue || 0) : '-'}
            icon={Wallet}
            theme="bg-gradient-to-br from-orange-50 to-amber-100 text-orange-900 ring-1 ring-amber-100"
          />
        </div>

        <ColorCard
          title={`Sales List${pagination.total ? ` (${pagination.total})` : ''}`}
          headerClassName="bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/50 border-indigo-100/50 text-slate-800"
        >
          <div className="mb-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by invoice or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {sales.map((sale) => (
                  <div
                    key={sale._id}
                    className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/sales/${sale._id}`}
                          className="font-semibold text-indigo-700 hover:underline"
                        >
                          {sale.invoiceNumber}
                        </Link>
                        <p className="text-sm text-slate-600 truncate mt-0.5">{sale.customerName}</p>
                        <p className="text-xs text-slate-400 mt-1">{formatSaleDateShort(sale.date)}</p>
                      </div>
                      <div className="shrink-0">{getStatusBadge(sale.status)}</div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl bg-emerald-50 px-3 py-2">
                        <p className="text-xs text-emerald-600">Amount</p>
                        <p className="font-bold text-emerald-800">{formatCurrency(sale.amount)}</p>
                      </div>
                      <div className="rounded-xl bg-violet-50 px-3 py-2">
                        <p className="text-xs text-violet-600">Paid</p>
                        <p className="font-bold text-violet-800">{formatCurrency(sale.paid)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Badge variant="outline" className="rounded-lg border-slate-200">
                        {sale.paymentMode}
                      </Badge>
                      <div className="flex justify-end">{renderSaleActions(sale, true)}</div>
                    </div>
                  </div>
                ))}
                {sales.length === 0 && (
                  <div className="rounded-2xl bg-slate-50 py-10 text-center text-slate-500 text-sm">
                    No sales found
                  </div>
                )}
              </div>

              <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-slate-200/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-indigo-50/50 hover:from-slate-50 hover:to-indigo-50/50">
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale._id} className="hover:bg-blue-50/30">
                        <TableCell>
                          <Link
                            href={`/sales/${sale._id}`}
                            className="font-semibold text-indigo-700 hover:underline"
                          >
                            {sale.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-slate-600">{formatSaleDate(sale.date)}</TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>{sale.itemsCount || sale.items?.length || 0}</TableCell>
                        <TableCell className="font-medium text-emerald-700">
                          {formatCurrency(sale.amount)}
                        </TableCell>
                        <TableCell className="font-medium text-violet-700">
                          {formatCurrency(sale.paid)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg">
                            {sale.paymentMode}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(sale.status)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">{renderSaleActions(sale)}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sales.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-slate-500">
                          No sales found
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

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Sale</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete sale <strong>{deleteTarget?.num}</strong>? This will
                restore all linked products back to available status.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting} className="rounded-xl">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 hover:bg-red-700"
              >
                {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
