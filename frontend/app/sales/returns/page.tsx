'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { ListPagination } from '@/components/ui/list-pagination';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Trash2, Eye, RotateCcw, DollarSign, CalendarDays, Tag, MoreVertical } from 'lucide-react';
import { saleReturnsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';
import { formatLineItemNames } from '@/lib/line-items';
import {
  ColorCard,
  formatSaleDate,
  formatSaleDateShort,
  getReasonBadge,
  NewReturnButton,
  SalesPageHero,
  STAT_GRID_CLASS,
  SummaryStat,
} from '@/components/sales/sales-ui';

export default function SalesReturnsPage() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; num: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    items: returns,
    loading,
    setPage,
    pageSize,
    setPageSize,
    pagination,
    search,
    setSearch,
    refetch,
  } = usePaginatedList((params) => saleReturnsApi.getAll(params), {
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const fetchSummary = async () => {
    try {
      const summaryRes = await saleReturnsApi.getSummary();
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
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
      await saleReturnsApi.delete(deleteTarget.id);
      toast({
        title: 'Success',
        description: 'Sale return deleted successfully',
      });
      setDeleteTarget(null);
      await refetch();
      await fetchSummary();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete sale return',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const renderReturnActions = (ret: any, mobile = false) => (
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
          <Link href={`/sales/returns/${ret._id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onSelect={() => setDeleteTarget({ id: ret._id, num: ret.returnNumber })}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Sales Returns"
          description="Manage product returns from customers"
          badge="Returns"
          gradient="from-orange-600 via-amber-600 to-yellow-600"
          actions={<NewReturnButton />}
        />

        <div className={STAT_GRID_CLASS}>
          <SummaryStat
            label="Total Returns"
            value={summary ? String(summary.totalReturns || 0) : '-'}
            icon={RotateCcw}
            theme="bg-gradient-to-br from-orange-50 to-amber-100 text-orange-900 ring-1 ring-orange-100"
          />
          <SummaryStat
            label="This Month"
            value={summary ? String(summary.thisMonthReturns || 0) : '-'}
            icon={CalendarDays}
            theme="bg-gradient-to-br from-amber-50 to-yellow-100 text-amber-900 ring-1 ring-amber-100"
          />
          <SummaryStat
            label="Total Value"
            value={summary ? formatCurrency(summary.totalAmount || 0) : '-'}
            icon={DollarSign}
            theme="bg-gradient-to-br from-rose-50 to-orange-100 text-rose-900 ring-1 ring-rose-100"
          />
        </div>

        {summary?.byReason?.[0] && (
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm text-orange-800 ring-1 ring-orange-100">
            <Tag className="h-4 w-4" />
            Top reason: <strong>{summary.byReason[0]._id}</strong> ({summary.byReason[0].count} returns)
          </div>
        )}

        <ColorCard
          title={`Returns History${pagination.total ? ` (${pagination.total})` : ''}`}
          headerClassName="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-orange-100/50 text-orange-900"
        >
          <div className="mb-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search returns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {returns.map((ret) => (
                  <div
                    key={ret._id}
                    className="rounded-2xl border border-orange-100/80 bg-gradient-to-br from-white to-orange-50/30 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-orange-900">{ret.returnNumber}</p>
                        <p className="text-sm text-slate-600 truncate">{ret.customerName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {ret.invoiceNumber} · {formatSaleDateShort(ret.date)}
                        </p>
                      </div>
                      {getReasonBadge(ret.reason)}
                    </div>
                    <div className="mt-3 text-sm text-slate-600 line-clamp-2">
                      {formatLineItemNames(ret.items)}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl bg-orange-50 px-3 py-2">
                        <p className="text-xs text-orange-600">Amount</p>
                        <p className="font-bold text-orange-800">{formatCurrency(ret.amount)}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">Profit</p>
                        <p
                          className={`font-bold ${
                            (ret.profit || 0) >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {formatCurrency(ret.profit || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="outline" className="rounded-lg">
                        {ret.refundMethod}
                      </Badge>
                      <div className="flex justify-end">{renderReturnActions(ret, true)}</div>
                    </div>
                  </div>
                ))}
                {returns.length === 0 && (
                  <div className="rounded-2xl bg-slate-50 py-10 text-center text-slate-500 text-sm">
                    No sale returns found
                  </div>
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-orange-100/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-orange-50 to-amber-50/80 hover:from-orange-50 hover:to-amber-50/80">
                      <TableHead>Return #</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Refund</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returns.map((ret) => (
                      <TableRow key={ret._id} className="hover:bg-orange-50/30">
                        <TableCell className="font-semibold text-orange-800">{ret.returnNumber}</TableCell>
                        <TableCell>{ret.invoiceNumber}</TableCell>
                        <TableCell className="text-slate-600">{formatSaleDate(ret.date)}</TableCell>
                        <TableCell>{ret.customerName}</TableCell>
                        <TableCell className="max-w-[220px]">
                          <span className="line-clamp-2 text-sm">
                            {formatLineItemNames(ret.items)}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-orange-700">
                          {formatCurrency(ret.amount)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              (ret.profit || 0) >= 0
                                ? 'text-green-600 font-semibold'
                                : 'text-red-600 font-semibold'
                            }
                          >
                            {formatCurrency(ret.profit || 0)}
                          </span>
                        </TableCell>
                        <TableCell>{getReasonBadge(ret.reason)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg">
                            {ret.refundMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">{renderReturnActions(ret)}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {returns.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-10 text-slate-500">
                          No sale returns found
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
              <AlertDialogTitle>Delete Sale Return</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete return{' '}
                <strong>{deleteTarget?.num}</strong>? This will reverse stock changes and customer
                balance adjustments.
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
