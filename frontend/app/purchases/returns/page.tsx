'use client';

import { useState, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Trash2, Eye, RotateCcw, DollarSign, CalendarDays, Tag } from 'lucide-react';
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
import { purchaseReturnsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/constant';
import { formatLineItemNames } from '@/lib/line-items';
import {
  ProductNameCell,
  LineItemBrandCell,
  LineItemModelCell,
  LineItemCategoryCell,
  LineItemImeiCell,
} from '@/components/line-items/line-item-table-cells';
import {
  ColorCard,
  formatSaleDateShort,
  getReasonBadge,
  NewPurchaseReturnButton,
  PURCHASE_RETURN_GRADIENT,
  SalesPageHero,
  STAT_GRID_CLASS,
  SummaryStat,
} from '@/components/purchases/purchases-ui';

export default function PurchaseReturnsPage() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);

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
  } = usePaginatedList((params) => purchaseReturnsApi.getAll(params), {
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const fetchSummary = async () => {
    try {
      const summaryRes = await purchaseReturnsApi.getSummary();
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

  const openReturnDetails = async (ret: any) => {
    setShowDetailsDialog(true);
    setSelectedReturn(ret);
    setDetailsLoading(true);
    try {
      const response = await purchaseReturnsApi.getById(ret._id);
      if (response.success && response.data) {
        setSelectedReturn(response.data);
      }
    } catch {
      // Keep list row data if detail fetch fails
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteReturn = async () => {
    if (!selectedReturn) return;

    setSaving(true);
    try {
      await purchaseReturnsApi.delete(selectedReturn._id);
      toast({
        title: 'Success',
        description: 'Purchase return deleted. Stock and supplier balance restored.',
      });
      setShowDeleteDialog(false);
      setSelectedReturn(null);
      await refetch();
      await fetchSummary();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete purchase return',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8">
        <SalesPageHero
          title="Purchase Returns"
          description="Return items to suppliers and adjust payables"
          badge="Returns"
          gradient={PURCHASE_RETURN_GRADIENT}
          actions={<NewPurchaseReturnButton />}
        />

        <div className={STAT_GRID_CLASS}>
          <SummaryStat
            label="Total Returns"
            value={summary ? String(summary.totalReturns || 0) : '-'}
            icon={RotateCcw}
            theme="bg-gradient-to-br from-violet-50 to-purple-100 text-violet-900 ring-1 ring-violet-100"
          />
          <SummaryStat
            label="This Month"
            value={summary ? String(summary.thisMonthReturns || 0) : '-'}
            icon={CalendarDays}
            theme="bg-gradient-to-br from-purple-50 to-fuchsia-100 text-purple-900 ring-1 ring-purple-100"
          />
          <SummaryStat
            label="Total Value"
            value={summary ? formatCurrency(summary.totalAmount || 0) : '-'}
            icon={DollarSign}
            theme="bg-gradient-to-br from-fuchsia-50 to-pink-100 text-fuchsia-900 ring-1 ring-fuchsia-100"
          />
        </div>

        {summary?.byReason?.[0] && (
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm text-violet-800 ring-1 ring-violet-100">
            <Tag className="h-4 w-4" />
            Top reason: <strong>{summary.byReason[0]._id}</strong> ({summary.byReason[0].count}{' '}
            returns)
          </div>
        )}

        <ColorCard
          title={`Returns History${pagination.total ? ` (${pagination.total})` : ''}`}
          headerClassName="bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 border-violet-100/50 text-violet-900"
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
              <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {returns.map((ret) => (
                  <div
                    key={ret._id}
                    className="rounded-2xl border border-violet-100/80 bg-gradient-to-br from-white to-violet-50/30 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-violet-900">{ret.returnNumber}</p>
                        <p className="text-sm text-slate-600 truncate">{ret.supplierName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {ret.purchaseNumber} · {formatSaleDateShort(ret.date)}
                        </p>
                      </div>
                      {getReasonBadge(ret.reason)}
                    </div>
                    <div className="mt-3 text-sm text-slate-600 line-clamp-2">
                      {formatLineItemNames(ret.items)}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl bg-violet-50 px-3 py-2">
                        <p className="text-xs text-violet-600">Amount</p>
                        <p className="font-bold text-violet-800">{formatCurrency(ret.amount)}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">Items</p>
                        <p className="font-bold text-slate-800">
                          {ret.itemsCount || ret.items?.length || 0}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="outline" className="rounded-lg">
                        {ret.refundMethod}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl"
                          onClick={() => openReturnDetails(ret)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setSelectedReturn(ret);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {returns.length === 0 && (
                  <p className="text-center py-8 text-slate-500">No purchase returns found</p>
                )}
              </div>

              <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-violet-100/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-violet-50 to-purple-50/80">
                      <TableHead>Return #</TableHead>
                      <TableHead>Purchase #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Refund</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returns.map((ret) => (
                      <TableRow key={ret._id} className="hover:bg-violet-50/20">
                        <TableCell className="font-medium text-violet-900">
                          {ret.returnNumber}
                        </TableCell>
                        <TableCell>{ret.purchaseNumber}</TableCell>
                        <TableCell>{formatSaleDateShort(ret.date)}</TableCell>
                        <TableCell>{ret.supplierName}</TableCell>
                        <TableCell className="max-w-[220px]">
                          <span className="line-clamp-2 text-sm">
                            {formatLineItemNames(ret.items)}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-violet-700">
                          {formatCurrency(ret.amount)}
                        </TableCell>
                        <TableCell>{getReasonBadge(ret.reason)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg">
                            {ret.refundMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl h-8 w-8"
                              onClick={() => openReturnDetails(ret)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl h-8 w-8 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedReturn(ret);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {returns.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                          No purchase returns found
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

        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle>Return Details — {selectedReturn?.returnNumber}</DialogTitle>
            </DialogHeader>
            {selectedReturn && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Purchase</p>
                    <p className="font-medium">{selectedReturn.purchaseNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Supplier</p>
                    <p className="font-medium">{selectedReturn.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Date</p>
                    <p className="font-medium">{formatSaleDateShort(selectedReturn.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Return Amount</p>
                    <p className="font-medium text-lg text-violet-700">
                      {formatCurrency(selectedReturn.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Reason</p>
                    <div className="mt-1">{getReasonBadge(selectedReturn.reason)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Refund Method</p>
                    <p className="font-medium">{selectedReturn.refundMethod}</p>
                  </div>
                </div>
                {selectedReturn.notes && (
                  <div>
                    <p className="text-sm text-slate-600">Notes</p>
                    <p className="font-medium">{selectedReturn.notes}</p>
                  </div>
                )}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Items Returned</h4>
                  {detailsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                    </div>
                  ) : (
                  <div className="overflow-x-auto rounded-xl ring-1 ring-violet-100/70">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-violet-50 to-purple-50/80">
                          <TableHead>Product</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>IMEI</TableHead>
                          <TableHead>Purchase Price</TableHead>
                          <TableHead>Return Price</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReturn.items?.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <ProductNameCell item={item} showViewButton={false} />
                            </TableCell>
                            <TableCell><LineItemBrandCell item={item} /></TableCell>
                            <TableCell><LineItemModelCell item={item} /></TableCell>
                            <TableCell><LineItemCategoryCell item={item} /></TableCell>
                            <TableCell><LineItemImeiCell item={item} /></TableCell>
                            <TableCell>{formatCurrency(item.originalPrice || item.price)}</TableCell>
                            <TableCell>{formatCurrency(item.returnPrice || item.price)}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Purchase Return</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete return{' '}
                <strong>{selectedReturn?.returnNumber}</strong>? This will restore the product
                stock and reverse the supplier payable adjustment. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteReturn}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 rounded-xl"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
